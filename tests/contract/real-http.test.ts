import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, beforeEach, test } from "node:test";

import { createDatabase } from "@/infrastructure/database/client";
import { seedFixture } from "@/infrastructure/database/seed";

import { createIntegrationDatabaseLock } from "../integration/database-lock";

type JsonObject = { [key: string]: JsonValue };
type JsonValue = JsonObject | JsonValue[] | boolean | number | string | null;

const baseUrl = "http://127.0.0.1:3100";
const fixture = JSON.parse(
  readFileSync("contracts/evm/evm-fixture.json", "utf8"),
) as JsonObject;
const databaseUrl =
  process.env.DATABASE_URL ?? "postgres://evm:evm@127.0.0.1:5432/evm";
const { db, pool } = createDatabase(databaseUrl);
const databaseLock = createIntegrationDatabaseLock(pool);

function stripMetadata(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map(stripMetadata);
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !key.startsWith("$"))
        .map(([key, child]) => [key, stripMetadata(child)]),
    );
  }

  return value;
}

async function resetFixture(): Promise<void> {
  await pool.query("truncate table projects restart identity cascade");
  await seedFixture(db);
}

async function request(
  pathname: string,
  init?: RequestInit,
): Promise<{ body: JsonValue | undefined; raw: string; status: number }> {
  const response = await fetch(`${baseUrl}${pathname}`, init);
  const raw = await response.text();
  const body = response.headers
    .get("content-type")
    ?.includes("application/json")
    ? (JSON.parse(raw) as JsonValue)
    : undefined;

  return {
    body,
    raw,
    status: response.status,
  };
}

function jsonRequest(method: string, body?: JsonValue): RequestInit {
  return {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers:
      body === undefined ? undefined : { "content-type": "application/json" },
    method,
  };
}

function projectWrite(
  overrides: JsonObject = {},
): JsonObject {
  const project = (fixture.readResponse as JsonObject).project as JsonObject;
  return {
    name: project.name,
    cutoffDate: project.cutoffDate,
    ...overrides,
  };
}

function fixtureActivity(): JsonObject {
  return (
    ((fixture.readResponse as JsonObject).activities as JsonValue[])[0] as
      JsonObject
  );
}

function activityWrite(overrides: JsonObject = {}): JsonObject {
  const activity = fixtureActivity();
  return {
    name: activity.name,
    bac: activity.bac,
    plannedProgress: activity.plannedProgress,
    actualProgress: activity.actualProgress,
    ac: activity.ac,
    ...overrides,
  };
}

before(async () => {
  await databaseLock.acquire();
});

beforeEach(resetFixture);

after(async () => {
  try {
    await databaseLock.release();
  } finally {
    await pool.end();
  }
});

test("GET /projects returns the bare fixture collection", async () => {
  const response = await request("/projects");
  const expected = fixture.collectionResponse as JsonObject;

  assert.equal(response.status, expected.expectedStatus);
  assert.deepEqual(response.body, expected.expectedBody);
});

test("GET /projects returns a bare empty array", async () => {
  await pool.query("truncate table projects restart identity cascade");

  const response = await request("/projects");
  const empty = (fixture.collectionResponse as JsonObject).empty as JsonObject;

  assert.equal(response.status, empty.expectedStatus);
  assert.deepEqual(response.body, empty.expectedBody);
});

test("GET /projects/1 returns the exact stripped aggregate", async () => {
  const response = await request("/projects/1");
  const expectedStatus = (
    (fixture.successResponses as JsonObject).getProject as JsonObject
  ).expectedStatus;

  assert.equal(response.status, expectedStatus);
  assert.deepEqual(response.body, stripMetadata(fixture.readResponse));
});

test("POST /projects returns 201 with only ProjectRead", async () => {
  const input = projectWrite({
    name: "Proyecto creado por HTTP",
    cutoffDate: "2026-08-01",
  });
  const response = await request("/projects", jsonRequest("POST", input));

  assert.equal(
    response.status,
    ((fixture.successResponses as JsonObject).createProject as JsonObject)
      .expectedStatus,
  );
  const body = response.body as JsonObject;
  assert.deepEqual(Object.keys(body).sort(), ["cutoffDate", "id", "name"]);
  assert.equal(Number.isInteger(body.id), true);
  assert.equal(body.name, input.name);
  assert.equal(body.cutoffDate, input.cutoffDate);
});

test("PUT /projects/1 returns the exact fixture ProjectRead", async () => {
  const response = await request(
    "/projects/1",
    jsonRequest("PUT", projectWrite()),
  );

  assert.equal(
    response.status,
    ((fixture.successResponses as JsonObject).replaceProject as JsonObject)
      .expectedStatus,
  );
  assert.deepEqual(
    response.body,
    (fixture.readResponse as JsonObject).project,
  );
});

test("project replacement changes no activity or summary", async () => {
  const before = (await request("/projects/1")).body as JsonObject;
  const replacement = projectWrite({
    name: "Proyecto reetiquetado",
    cutoffDate: "2026-08-01",
  });

  const replaced = await request(
    "/projects/1",
    jsonRequest("PUT", replacement),
  );
  const after = (await request("/projects/1")).body as JsonObject;

  assert.equal(replaced.status, 200);
  assert.deepEqual(replaced.body, { id: 1, ...replacement });
  assert.deepEqual(after.activities, before.activities);
  assert.deepEqual(after.summary, before.summary);
});

test("DELETE /projects/:id returns a bodyless 204", async () => {
  const created = await request(
    "/projects",
    jsonRequest(
      "POST",
      projectWrite({
        name: "Proyecto para eliminar",
        cutoffDate: "2026-08-01",
      }),
    ),
  );
  const createdId = String((created.body as JsonObject).id);

  const deleted = await request(
    `/projects/${createdId}`,
    jsonRequest("DELETE"),
  );

  assert.equal(deleted.status, 204);
  assert.equal(deleted.raw, "");
  assert.equal(deleted.body, undefined);
});

async function assertNotFound(
  pathname: string,
  init?: RequestInit,
): Promise<void> {
  const response = await request(pathname, init);
  const envelope = response.body as JsonObject;

  assert.equal(response.status, 404);
  assert.deepEqual(Object.keys(envelope).sort(), [
    "code",
    "message",
    "violations",
  ]);
  assert.equal(envelope.code, "not_found");
  assert.equal(typeof envelope.message, "string");
  assert.deepEqual(envelope.violations, []);
}

test("missing project replacement and deletion return 404", async () => {
  await assertNotFound(
    "/projects/999999",
    jsonRequest("PUT", projectWrite()),
  );
  await assertNotFound("/projects/999999", jsonRequest("DELETE"));
});

test("POST nested activity returns 201 with fixture-derived ActivityRead", async () => {
  const response = await request(
    "/projects/2/activities",
    jsonRequest("POST", activityWrite()),
  );

  assert.equal(
    response.status,
    ((fixture.successResponses as JsonObject).createActivity as JsonObject)
      .expectedStatus,
  );
  const body = response.body as JsonObject;
  assert.equal(Number.isInteger(body.id), true);
  assert.deepEqual(body, {
    ...(stripMetadata(fixtureActivity()) as JsonObject),
    id: body.id,
  });
});

test("PUT nested activity returns the exact fixture ActivityRead", async () => {
  const response = await request(
    "/projects/1/activities/1",
    jsonRequest("PUT", activityWrite()),
  );

  assert.equal(
    response.status,
    ((fixture.successResponses as JsonObject).replaceActivity as JsonObject)
      .expectedStatus,
  );
  assert.deepEqual(response.body, stripMetadata(fixtureActivity()));
});

test("activity mutation is followed by a separate aggregate read", async () => {
  const created = await request(
    "/projects/2/activities",
    jsonRequest("POST", activityWrite()),
  );
  assert.equal(created.status, 201);

  const afterCreate = (await request("/projects/2")).body as JsonObject;
  assert.deepEqual(afterCreate.activities, [created.body]);

  const activityId = String((created.body as JsonObject).id);
  const deleted = await request(
    `/projects/2/activities/${activityId}`,
    jsonRequest("DELETE"),
  );
  assert.equal(deleted.status, 204);
  assert.equal(deleted.raw, "");

  const afterDelete = await request("/projects/2");
  assert.deepEqual(afterDelete.body, stripMetadata(fixture.emptyProject));
});

test("activity create, replacement and deletion respect project scope", async () => {
  await assertNotFound(
    "/projects/999999/activities",
    jsonRequest("POST", activityWrite()),
  );
  await assertNotFound(
    "/projects/2/activities/1",
    jsonRequest("PUT", activityWrite()),
  );
  await assertNotFound(
    "/projects/1/activities/999999",
    jsonRequest("PUT", activityWrite()),
  );
  await assertNotFound(
    "/projects/1/activities/999999",
    jsonRequest("DELETE"),
  );
});

type ValidationCheck = {
  $id: string;
  expectedBody: JsonObject;
  expectedStatus: number;
  request: JsonObject;
  resource: "activity" | "project";
};

function violationKeys(value: JsonValue): string[] {
  assert.ok(Array.isArray(value));

  return value
    .map((entry) => {
      assert.ok(
        entry !== null && typeof entry === "object" && !Array.isArray(entry),
      );
      const violation = entry as JsonObject;
      assert.deepEqual(Object.keys(violation).sort(), [
        "field",
        "message",
        "rule",
      ]);
      assert.equal(typeof violation.field, "string");
      assert.equal(typeof violation.rule, "string");
      assert.equal(typeof violation.message, "string");
      return `${String(violation.field)}:${String(violation.rule)}`;
    })
    .sort();
}

function assertNoInternalDetail(value: JsonValue): void {
  if (Array.isArray(value)) {
    value.forEach(assertNoInternalDetail);
    return;
  }

  if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      assert.doesNotMatch(
        key,
        /exception|stack|trace|framework|postgres|drizzle|cause|detail/i,
      );
      assertNoInternalDetail(child);
    }
  }
}

function assertErrorEnvelope(
  response: { body: JsonValue | undefined; status: number },
  status: number,
  code: string,
): JsonObject {
  assert.equal(response.status, status);
  const envelope = response.body as JsonObject;
  assert.deepEqual(Object.keys(envelope).sort(), [
    "code",
    "message",
    "violations",
  ]);
  assert.equal(envelope.code, code);
  assert.equal(typeof envelope.message, "string");
  assertNoInternalDetail(envelope);
  return envelope;
}

async function assertStateIntact(): Promise<void> {
  const reread = await request("/projects/1");
  assert.equal(reread.status, 200);
  assert.deepEqual(reread.body, stripMetadata(fixture.readResponse));
}

function validationPath(resource: ValidationCheck["resource"]): string {
  return resource === "project"
    ? "/projects/1"
    : "/projects/1/activities/1";
}

const validationCases = (
  (fixture.validationChecks as JsonObject).cases as JsonValue[]
) as unknown as ValidationCheck[];

for (const validationCase of validationCases) {
  test(`${validationCase.$id} returns its accumulated 422 and keeps state intact`, async () => {
    const response = await request(
      validationPath(validationCase.resource),
      jsonRequest("PUT", validationCase.request),
    );
    const envelope = assertErrorEnvelope(
      response,
      validationCase.expectedStatus,
      "validation_failed",
    );

    assert.deepEqual(
      violationKeys(envelope.violations),
      violationKeys(validationCase.expectedBody.violations),
    );

    if (validationCase.$id === "V9") {
      const violations = envelope.violations as JsonValue[];
      assert.equal(violations.length, 7);
      assert.equal(
        new Set(
          violations.map(
            (violation) => String((violation as JsonObject).rule),
          ),
        ).size,
        6,
      );
    }

    await assertStateIntact();
  });
}

type WriteResource = {
  fields: string[];
  input: () => JsonObject;
  path: string;
};

const writeSchemas = fixture.writeSchemas as JsonObject;
const requiredResources: Record<"activity" | "project", WriteResource> = {
  project: {
    fields: ((writeSchemas.project as JsonObject).fields as JsonValue[]).map(
      String,
    ),
    input: projectWrite,
    path: "/projects/1",
  },
  activity: {
    fields: ((writeSchemas.activity as JsonObject).fields as JsonValue[]).map(
      String,
    ),
    input: activityWrite,
    path: "/projects/1/activities/1",
  },
};

for (const [resourceName, resource] of Object.entries(requiredResources)) {
  for (const field of resource.fields) {
    for (const form of ["missing", "null"] as const) {
      test(`${resourceName} ${field} ${form} returns 422 required`, async () => {
        const input = resource.input();
        if (form === "missing") {
          delete input[field];
        } else {
          input[field] = null;
        }

        const response = await request(
          resource.path,
          jsonRequest("PUT", input),
        );
        const envelope = assertErrorEnvelope(
          response,
          422,
          "validation_failed",
        );
        assert.deepEqual(violationKeys(envelope.violations), [
          `${field}:required`,
        ]);
        await assertStateIntact();
      });
    }
  }
}

test("the literal incompatible BAC request is 400 and keeps state intact", async () => {
  const malformed = (fixture.errorEnvelopes as JsonObject)
    .malformedRequest as JsonObject;
  const response = await request(
    "/projects/1/activities/1",
    jsonRequest("PUT", malformed.$exampleRequest as JsonObject),
  );
  const envelope = assertErrorEnvelope(
    response,
    malformed.expectedStatus as number,
    "malformed_request",
  );

  assert.deepEqual(envelope.violations, []);
  await assertStateIntact();
});

test("a successful write trims lateral name spaces and preserves interior spaces", async () => {
  const response = await request(
    "/projects/1/activities/1",
    jsonRequest(
      "PUT",
      activityWrite({ name: "  Actividad   con espacios  " }),
    ),
  );

  assert.equal(response.status, 200);
  assert.equal(
    (response.body as JsonObject).name,
    "Actividad   con espacios",
  );
});

async function assertMalformed(
  pathname: string,
  body: string,
): Promise<void> {
  const response = await request(pathname, {
    body,
    headers: { "content-type": "application/json" },
    method: "POST",
  });

  const envelope = assertErrorEnvelope(response, 400, "malformed_request");
  assert.deepEqual(envelope.violations, []);
}

test("structural request failures are 400 without violations", async () => {
  await assertMalformed("/projects", "{");
  await assertMalformed("/projects", "[]");
  await assertMalformed(
    "/projects",
    JSON.stringify({ name: "Proyecto", cutoffDate: "2026-02-30" }),
  );
  await assertMalformed(
    "/projects/1/activities",
    JSON.stringify({
      name: "Actividad",
      bac: "diez",
      plannedProgress: 50,
      actualProgress: 40,
      ac: 500,
    }),
  );
});
