import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { after, before, beforeEach, test } from "node:test";

import { type Document, OpenAPIBackend } from "openapi-backend";
import { parse } from "yaml";

import { createDatabase } from "@/infrastructure/database/client";
import { seedFixture } from "@/infrastructure/database/seed";
import { createIntegrationDatabaseLock } from "../integration/database-lock";

type JsonObject = { [key: string]: JsonValue };
type JsonValue = JsonObject | JsonValue[] | boolean | number | string | null;

type HttpResult = Readonly<{
  body: JsonValue | undefined;
  contentType: string | null;
  raw: string;
  status: number;
}>;

const baseUrl = "http://127.0.0.1:3100";
const contractPath = resolve("contracts/evm/openapi.yaml");
const contractSource = readFileSync(contractPath, "utf8");
const contract = parse(contractSource) as JsonObject;
const fixture = JSON.parse(
  readFileSync("contracts/evm/evm-fixture.json", "utf8"),
) as JsonObject;
const databaseUrl =
  process.env.DATABASE_URL ?? "postgres://evm:evm@127.0.0.1:5432/evm";
const { db, pool } = createDatabase(databaseUrl);
const databaseLock = createIntegrationDatabaseLock(pool);
const validator = new OpenAPIBackend({
  definition: contract as unknown as Document,
  // v5.19 validates definitions with a 3.0-only metaschema before its
  // response validator runs. Quick mode skips that incompatible precheck;
  // AJV still compiles and validates the canonical 3.1 response schemas.
  quick: true,
  strict: true,
  validate: true,
});
let lockAcquired = false;

async function resetFixture(): Promise<void> {
  await pool.query("truncate table projects restart identity cascade");
  await seedFixture(db);
}

async function request(
  pathname: string,
  init?: RequestInit,
): Promise<HttpResult> {
  const response = await fetch(`${baseUrl}${pathname}`, init);
  const raw = await response.text();
  return {
    body: raw === "" ? undefined : (JSON.parse(raw) as JsonValue),
    contentType: response.headers.get("content-type"),
    raw,
    status: response.status,
  };
}

function jsonRequest(method: string, body: JsonValue): RequestInit {
  return {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method,
  };
}

function projectWrite(): JsonObject {
  const project = (fixture.readResponse as JsonObject).project as JsonObject;
  return { name: project.name, cutoffDate: project.cutoffDate };
}

function activityWrite(): JsonObject {
  const activity = (
    (fixture.readResponse as JsonObject).activities as JsonValue[]
  )[0] as JsonObject;
  return {
    name: activity.name,
    bac: activity.bac,
    plannedProgress: activity.plannedProgress,
    actualProgress: activity.actualProgress,
    ac: activity.ac,
  };
}

function localReference(document: JsonObject, reference: string): JsonValue {
  assert.match(reference, /^#\//);
  return reference
    .slice(2)
    .split("/")
    .map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~"))
    .reduce<JsonValue>((value, part) => {
      assert.ok(value !== null && typeof value === "object");
      assert.ok(!Array.isArray(value));
      return (value as JsonObject)[part]!;
    }, document);
}

function reachableSchemaNames(document: JsonObject): string[] {
  const names = new Set<string>();
  const followedReferences = new Set<string>();
  const seenObjects = new WeakSet<object>();

  function visit(value: JsonValue): void {
    if (value === null || typeof value !== "object") return;
    if (seenObjects.has(value)) return;
    seenObjects.add(value);
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }

    const reference = value.$ref;
    if (typeof reference === "string" && reference.startsWith("#/")) {
      const schemaPrefix = "#/components/schemas/";
      if (reference.startsWith(schemaPrefix)) {
        names.add(reference.slice(schemaPrefix.length));
      }
      if (!followedReferences.has(reference)) {
        followedReferences.add(reference);
        visit(localReference(document, reference));
      }
    }
    Object.values(value).forEach(visit);
  }

  visit(document.paths as JsonValue);
  return [...names].sort();
}

function containsKey(value: JsonValue, searchedKey: string): boolean {
  if (value === null || typeof value !== "object") return false;
  if (Array.isArray(value)) {
    return value.some((child) => containsKey(child, searchedKey));
  }
  return (
    Object.hasOwn(value, searchedKey) ||
    Object.values(value).some((child) => containsKey(child, searchedKey))
  );
}

const expectedOperations = {
  "/projects": {
    get: [
      "listProjects",
      undefined,
      ["200"],
      "array:#/components/schemas/ProjectListItem",
    ],
    post: [
      "createProject",
      "#/components/schemas/ProjectWrite",
      ["201", "400", "422"],
      "#/components/schemas/ProjectRead",
    ],
  },
  "/projects/{projectId}": {
    delete: ["deleteProject", undefined, ["204", "404"], undefined],
    get: [
      "getProject",
      undefined,
      ["200", "404"],
      "#/components/schemas/ProjectAnalysis",
    ],
    put: [
      "replaceProject",
      "#/components/schemas/ProjectWrite",
      ["200", "400", "404", "422"],
      "#/components/schemas/ProjectRead",
    ],
  },
  "/projects/{projectId}/activities": {
    post: [
      "createActivity",
      "#/components/schemas/ActivityWrite",
      ["201", "400", "404", "422"],
      "#/components/schemas/ActivityRead",
    ],
  },
  "/projects/{projectId}/activities/{activityId}": {
    delete: ["deleteActivity", undefined, ["204", "404"], undefined],
    put: [
      "replaceActivity",
      "#/components/schemas/ActivityWrite",
      ["200", "400", "404", "422"],
      "#/components/schemas/ActivityRead",
    ],
  },
} as const;

function responseSchemaIdentity(
  operation: JsonObject,
  successStatus: string,
): string | undefined {
  const response = (operation.responses as JsonObject)[
    successStatus
  ] as JsonObject;
  const content = response.content as JsonObject | undefined;
  const media = content?.["application/json"] as JsonObject | undefined;
  const schema = media?.schema as JsonObject | undefined;
  if (typeof schema?.$ref === "string") return schema.$ref;
  const items = schema?.items as JsonObject | undefined;
  return schema?.type === "array" && typeof items?.$ref === "string"
    ? `array:${items.$ref}`
    : undefined;
}

function fixtureStatus(operationId: string): number {
  return (
    (fixture.successResponses as JsonObject)[operationId] as JsonObject
  ).expectedStatus as number;
}

function assertValidResponse(
  result: HttpResult,
  operationId: string,
  expectedStatus: number,
): void {
  assert.equal(result.status, expectedStatus);
  const validation = validator.validateResponse(
    expectedStatus === 204 ? null : result.body,
    operationId,
    expectedStatus,
  );
  assert.equal(
    validation.valid,
    true,
    JSON.stringify(validation.errors, null, 2),
  );
}

before(async () => {
  await validator.init();
  await databaseLock.acquire();
  lockAcquired = true;
});

beforeEach(resetFixture);

after(async () => {
  try {
    if (lockAcquired) await databaseLock.release();
  } finally {
    await pool.end();
  }
});

test("OpenAPI publishes the exact implemented operation matrix", () => {
  assert.equal(contract.openapi, "3.1.0");
  assert.equal((contract.info as JsonObject).version, "1.0.0");
  assert.equal(containsKey(contract, "x-decisions-missing"), false);

  const paths = contract.paths as JsonObject;
  assert.deepEqual(
    Object.keys(paths).sort(),
    Object.keys(expectedOperations).sort(),
  );
  for (const [pathname, methods] of Object.entries(expectedOperations)) {
    const pathItem = paths[pathname] as JsonObject;
    const actualMethods = Object.keys(pathItem)
      .filter((key) => ["delete", "get", "post", "put"].includes(key))
      .sort();
    assert.deepEqual(actualMethods, Object.keys(methods).sort(), pathname);

    for (const [method, expected] of Object.entries(methods)) {
      const operation = pathItem[method] as JsonObject;
      const requestBody = operation.requestBody as JsonObject | undefined;
      const content = requestBody?.content as JsonObject | undefined;
      const media = content?.["application/json"] as JsonObject | undefined;
      const schema = media?.schema as JsonObject | undefined;
      assert.equal(operation.operationId, expected[0], `${method} ${pathname}`);
      assert.equal(schema?.$ref, expected[1], `${method} ${pathname}`);
      assert.deepEqual(
        Object.keys(operation.responses as JsonObject).sort(),
        [...expected[2]].sort(),
        `${method} ${pathname}`,
      );
      assert.equal(
        responseSchemaIdentity(operation, expected[2][0]),
        expected[3],
        `${method} ${pathname}`,
      );
    }
  }

  const schemas = (contract.components as JsonObject).schemas as JsonObject;
  assert.deepEqual(reachableSchemaNames(contract), Object.keys(schemas).sort());
});

const successCases = [
  {
    name: "listProjects",
    request: () => request("/projects"),
  },
  {
    name: "createProject",
    request: () => request("/projects", jsonRequest("POST", projectWrite())),
  },
  {
    name: "getProject",
    request: () => request("/projects/1"),
  },
  {
    name: "replaceProject",
    request: () => request("/projects/1", jsonRequest("PUT", projectWrite())),
  },
  {
    name: "deleteProject",
    request: () => request("/projects/2", { method: "DELETE" }),
  },
  {
    name: "createActivity",
    request: () =>
      request("/projects/2/activities", jsonRequest("POST", activityWrite())),
  },
  {
    name: "replaceActivity",
    request: () =>
      request(
        "/projects/1/activities/1",
        jsonRequest("PUT", activityWrite()),
      ),
  },
  {
    name: "deleteActivity",
    request: () =>
      request("/projects/1/activities/1", { method: "DELETE" }),
  },
] as const;

for (const successCase of successCases) {
  test(
    `${successCase.name} real success validates against OpenAPI 3.1`,
    async () => {
      const result = await successCase.request();
      assertValidResponse(
        result,
        successCase.name,
        fixtureStatus(successCase.name),
      );
      if (result.status === 204) {
        assert.equal(result.raw, "");
        assert.equal(result.body, undefined);
      }
    },
  );
}

test("the three real public error envelopes validate against OpenAPI 3.1", async () => {
  const envelopes = fixture.errorEnvelopes as JsonObject;
  const malformed = envelopes.malformedRequest as JsonObject;
  const malformedResult = await request(
    "/projects/1/activities/1",
    jsonRequest("PUT", malformed.$exampleRequest as JsonObject),
  );
  assert.deepEqual(malformedResult.body, malformed.expectedBody);
  assertValidResponse(
    malformedResult,
    "replaceActivity",
    malformed.expectedStatus as number,
  );

  const missing = envelopes.notFound as JsonObject;
  const missingResult = await request("/projects/999999");
  assert.deepEqual(missingResult.body, missing.expectedBody);
  assertValidResponse(
    missingResult,
    "getProject",
    missing.expectedStatus as number,
  );

  const invalid = envelopes.validationFailed as JsonObject;
  const invalidResult = await request(
    "/projects/1/activities/1",
    jsonRequest("PUT", { ...activityWrite(), bac: 0 }),
  );
  assert.deepEqual(invalidResult.body, invalid.expectedBody);
  assertValidResponse(
    invalidResult,
    "replaceActivity",
    invalid.expectedStatus as number,
  );
});

test("Swagger UI and its canonical local resources are served", async () => {
  const html = await fetch(`${baseUrl}/api-docs`);
  assert.equal(html.status, 200);
  assert.match(html.headers.get("content-type") ?? "", /^text\/html;/);
  const source = await html.text();
  assert.match(source, /url: "\/api-docs\/openapi\.yaml"/);
  assert.match(source, /SwaggerUIBundle/);
  assert.match(source, /SwaggerUIStandalonePreset/);

  const yaml = await fetch(`${baseUrl}/api-docs/openapi.yaml`);
  assert.equal(yaml.status, 200);
  assert.match(
    yaml.headers.get("content-type") ?? "",
    /application\/vnd\.oai\.openapi/,
  );
  assert.equal(await yaml.text(), contractSource);

  for (const [asset, mediaType] of [
    ["swagger-ui.css", "text/css"],
    ["swagger-ui-bundle.js", "text/javascript"],
    ["swagger-ui-standalone-preset.js", "text/javascript"],
  ] as const) {
    const response = await fetch(`${baseUrl}/api-docs/assets/${asset}`);
    assert.equal(response.status, 200, asset);
    assert.match(
      response.headers.get("content-type") ?? "",
      new RegExp(mediaType),
    );
    assert.ok((await response.arrayBuffer()).byteLength > 0);
  }

  const unknown = await fetch(`${baseUrl}/api-docs/assets/package.json`);
  assert.equal(unknown.status, 404);
});
