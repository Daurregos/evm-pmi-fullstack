# Verify and Publish EVM OpenAPI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove that every real EVM HTTP response conforms to the canonical OpenAPI 3.1 contract and publish that exact contract through self-hosted Swagger UI at `/api-docs`.

**Architecture:** One fixture-backed contract test loads the YAML both as a raw document for parity auditing and through `openapi-backend` for response validation. Three Node.js Route Handlers serve a small Swagger bootstrap document, the canonical YAML, and a closed list of `swagger-ui-dist` assets without introducing a React page or a copied contract.

**Tech Stack:** TypeScript 5.9, Next.js 16 App Router, Node.js test runner, PostgreSQL 17, OpenAPI Backend 5.19.0, YAML 2.9.0, Swagger UI Dist 5.32.11, OpenSpec 1.3.1.

---

## Canonical inputs and file map

Read before implementation:

- Product authority: `docs/PRD.md`
- Contract decisions:
  `docs/adr/004-contrato-api-indicadores-no-evaluables.md`,
  `docs/adr/006a-diseno-recursos-rest.md`,
  `docs/adr/006b-forma-respuesta-contrato-datos.md`,
  `docs/adr/007-estrategia-recalculo-tras-edicion.md`,
  `docs/adr/008-ciclo-vida-borrado-cascada.md`,
  `docs/adr/009-contrato-errores-api.md`
- Test ownership: `docs/TESTING.md`
- Published contract: `contracts/evm/openapi.yaml`
- Oracle: `contracts/evm/evm-fixture.json`
- Approved design:
  `docs/superpowers/specs/2026-07-29-verify-publish-openapi-design.md`
- Canonical change:
  `openspec/changes/verify-publish-evm-openapi/`

Create or modify only these implementation-owned files:

- Create `tests/contract/openapi-runtime.test.ts`: raw contract audit, OpenAPI
  3.1 response validation and documentation smoke tests.
- Modify `scripts/run-contract-tests.ts`: include the new test in the existing
  sequential runner.
- Modify `package.json` and `package-lock.json`: pin validator, parser and
  Swagger UI dependencies.
- Create `src/app/api-docs/route.ts`: Swagger bootstrap HTML.
- Create `src/app/api-docs/openapi.yaml/route.ts`: canonical YAML response.
- Create `src/app/api-docs/assets/[asset]/route.ts`: closed Swagger UI asset
  service.
- Modify
  `openspec/changes/verify-publish-evm-openapi/tasks.md`: record evidence as
  each canonical task becomes true.

`contracts/evm/openapi.yaml` remains unchanged unless a test proves a defect in
the YAML and the ADR audit attributes the discrepancy to the contract. A code
defect is a stop condition. Do not touch `src/ui/`, any `page.tsx`,
`src/domain/`, `src/application/`, `README.md`, PRD, ADR or fixture.

### Task 1: Commit the approved OpenSpec and execution plan

**Files:**

- Create: `openspec/changes/verify-publish-evm-openapi/.openspec.yaml`
- Create: `openspec/changes/verify-publish-evm-openapi/proposal.md`
- Create: `openspec/changes/verify-publish-evm-openapi/design.md`
- Create:
  `openspec/changes/verify-publish-evm-openapi/specs/evm-api-documentation/spec.md`
- Create:
  `openspec/changes/verify-publish-evm-openapi/specs/evm-http-surface/spec.md`
- Create: `openspec/changes/verify-publish-evm-openapi/tasks.md`
- Create:
  `docs/superpowers/plans/2026-07-29-verify-publish-evm-openapi.md`

- [ ] **Step 1: Validate the canonical change strictly**

Run:

```bash
openspec validate verify-publish-evm-openapi \
  --type change --strict --no-interactive --json
```

Expected: one change passes, zero changes fail and `issues` is empty.

- [ ] **Step 2: Include every new file in whitespace verification**

Run:

```bash
git add -N -- \
  docs/superpowers/plans/2026-07-29-verify-publish-evm-openapi.md \
  openspec/changes/verify-publish-evm-openapi/.openspec.yaml \
  openspec/changes/verify-publish-evm-openapi/proposal.md \
  openspec/changes/verify-publish-evm-openapi/design.md \
  openspec/changes/verify-publish-evm-openapi/specs/evm-api-documentation/spec.md \
  openspec/changes/verify-publish-evm-openapi/specs/evm-http-surface/spec.md \
  openspec/changes/verify-publish-evm-openapi/tasks.md
git diff --check
```

Expected: no output from `git diff --check`.

- [ ] **Step 3: Commit only the canonical artifacts and plan**

Run:

```bash
git add -- \
  docs/superpowers/plans/2026-07-29-verify-publish-evm-openapi.md \
  openspec/changes/verify-publish-evm-openapi
git diff --cached --check
git diff --cached --name-only
git commit -m "docs(openapi): definir cambio de verificación y publicación"
```

Expected: the staged list contains only the plan and
`openspec/changes/verify-publish-evm-openapi/`; the commit succeeds.

### Task 2: Specify contract parity and runtime validation in a red test

**Files:**

- Create: `tests/contract/openapi-runtime.test.ts`
- Modify: `scripts/run-contract-tests.ts:130-140`
- Reference: `contracts/evm/evm-fixture.json`
- Reference: `contracts/evm/openapi.yaml`

- [ ] **Step 1: Create the fixture-backed test harness before dependencies**

Create `tests/contract/openapi-runtime.test.ts` with these imports, types,
database lifecycle and request helpers:

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { after, before, beforeEach, test } from "node:test";

import OpenAPIBackend from "openapi-backend";
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
  definition: contractPath,
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
```

- [ ] **Step 2: Add raw-document hygiene and reachability helpers**

Append local JSON-pointer traversal that starts at `paths` and follows every
local reference:

```ts
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
```

Add an explicit operation matrix and the hygiene assertion:

```ts
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
```

- [ ] **Step 3: Add the response validator and every required real case**

Append:

```ts
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
    result.body,
    operationId,
    expectedStatus,
  );
  assert.equal(
    validation.valid,
    true,
    JSON.stringify(validation.errors, null, 2),
  );
}

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
      request(
        "/projects/2/activities",
        jsonRequest("POST", activityWrite()),
      ),
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
  test(`${successCase.name} real success validates against OpenAPI 3.1`, async () => {
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
  });
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
```

- [ ] **Step 4: Specify documentation behavior while the routes are absent**

Append:

```ts
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
    assert.match(response.headers.get("content-type") ?? "", new RegExp(mediaType));
    assert.ok((await response.arrayBuffer()).byteLength > 0);
  }

  const unknown = await fetch(`${baseUrl}/api-docs/assets/package.json`);
  assert.equal(unknown.status, 404);
});
```

- [ ] **Step 5: Add the test file to the sequential contract runner**

In `scripts/run-contract-tests.ts`, insert the new path after the structural
test and before `real-http.test.ts`:

```ts
        "tests/contract/mock-http.test.ts",
        "tests/contract/http-surface-structure.test.ts",
        "tests/contract/openapi-runtime.test.ts",
        "tests/contract/real-http.test.ts",
```

- [ ] **Step 6: Run the red suite and record the expected cause**

With an isolated migrated PostgreSQL available through `DATABASE_URL`, run:

```bash
DATABASE_URL=postgres://evm:evm@127.0.0.1:5433/evm \
  npm run test:contract
```

Expected: FAIL before tests load with
`Cannot find package 'openapi-backend'` or `Cannot find package 'yaml'`.
Existing contract files remain unchanged.

- [ ] **Step 7: Commit the red executable specification**

Run:

```bash
git add -- scripts/run-contract-tests.ts tests/contract/openapi-runtime.test.ts
git diff --cached --check
git commit -m "test(openapi): especificar paridad y documentación"
```

Expected: the commit contains only the runner and new contract test.

### Task 3: Add the OpenAPI and Swagger dependencies

**Files:**

- Modify: `package.json:26-44`
- Modify: `package-lock.json`
- Test: `tests/contract/openapi-runtime.test.ts`

- [ ] **Step 1: Install exact runtime and development dependencies**

Run:

```bash
npm install --save-exact swagger-ui-dist@5.32.11
npm install --save-dev --save-exact openapi-backend@5.19.0 yaml@2.9.0
```

Expected: `swagger-ui-dist` appears in `dependencies`; `openapi-backend` and
`yaml` appear in `devDependencies`; every version is exact and the lockfile is
updated.

- [ ] **Step 2: Verify validator support and the next intended red state**

Run:

```bash
DATABASE_URL=postgres://evm:evm@127.0.0.1:5433/evm \
  npm run test:contract
```

Expected: the operation matrix and all eight real success validations plus the
three error validations pass. The documentation test fails because
`GET /api-docs` still returns 404. If any real response fails schema
validation, classify it against the ADR before proceeding: correct only a YAML
defect and stop/report any code defect.

- [ ] **Step 3: Commit the pinned dependency boundary**

Run:

```bash
git add -- package.json package-lock.json
git diff --cached --check
git commit -m "build(openapi): fijar validador y Swagger UI"
```

Expected: the commit contains only package metadata.

### Task 4: Serve self-hosted Swagger UI and the canonical contract

**Files:**

- Create: `src/app/api-docs/route.ts`
- Create: `src/app/api-docs/openapi.yaml/route.ts`
- Create: `src/app/api-docs/assets/[asset]/route.ts`
- Test: `tests/contract/openapi-runtime.test.ts`

- [ ] **Step 1: Implement the Swagger bootstrap HTML**

Create `src/app/api-docs/route.ts`:

```ts
export const runtime = "nodejs";

const swaggerDocument = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>API EVM</title>
    <link rel="stylesheet" href="/api-docs/assets/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="/api-docs/assets/swagger-ui-bundle.js"></script>
    <script src="/api-docs/assets/swagger-ui-standalone-preset.js"></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: "/api-docs/openapi.yaml",
          dom_id: "#swagger-ui",
          deepLinking: true,
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset,
          ],
          layout: "StandaloneLayout",
        });
      };
    </script>
  </body>
</html>
`;

export function GET(): Response {
  return new Response(swaggerDocument, {
    headers: {
      "cache-control": "no-store",
      "content-type": "text/html; charset=utf-8",
    },
  });
}
```

- [ ] **Step 2: Serve the exact canonical YAML**

Create `src/app/api-docs/openapi.yaml/route.ts`:

```ts
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const contractPath = resolve(process.cwd(), "contracts/evm/openapi.yaml");

export async function GET(): Promise<Response> {
  const contract = await readFile(contractPath, "utf8");
  return new Response(contract, {
    headers: {
      "cache-control": "no-store",
      "content-type":
        "application/vnd.oai.openapi;version=3.1.0;charset=utf-8",
    },
  });
}
```

- [ ] **Step 3: Serve only the closed Swagger asset list**

Create `src/app/api-docs/assets/[asset]/route.ts`:

```ts
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

export const runtime = "nodejs";

const require = createRequire(import.meta.url);
const swaggerRoot = dirname(require.resolve("swagger-ui-dist/package.json"));
const assets: Readonly<Record<string, string>> = {
  "swagger-ui.css": "text/css; charset=utf-8",
  "swagger-ui-bundle.js": "text/javascript; charset=utf-8",
  "swagger-ui-standalone-preset.js": "text/javascript; charset=utf-8",
};

interface AssetContext {
  params: Promise<{ asset: string }>;
}

export async function GET(
  _request: Request,
  context: AssetContext,
): Promise<Response> {
  const { asset } = await context.params;
  const contentType = assets[asset];
  if (contentType === undefined) {
    return new Response(null, { status: 404 });
  }

  const content = await readFile(join(swaggerRoot, asset));
  return new Response(content, {
    headers: {
      "cache-control": "public, max-age=86400, immutable",
      "content-type": contentType,
    },
  });
}
```

- [ ] **Step 4: Run focused checks and reach green**

Run:

```bash
DATABASE_URL=postgres://evm:evm@127.0.0.1:5433/evm \
  npm run test:contract
npm run typecheck
npm run lint
```

Expected: every contract test passes; typecheck and lint exit zero.

- [ ] **Step 5: Commit the documentation route**

Run:

```bash
git add -- \
  src/app/api-docs/route.ts \
  src/app/api-docs/openapi.yaml/route.ts \
  'src/app/api-docs/assets/[asset]/route.ts'
git diff --cached --check
git commit -m "feat(openapi): publicar documentación interactiva"
```

Expected: the commit contains only the three Route Handlers.

### Task 5: Complete canonical tasks and fresh verification

**Files:**

- Modify: `openspec/changes/verify-publish-evm-openapi/tasks.md`
- Verify: all changed implementation and documentation files

- [ ] **Step 1: Start a private PostgreSQL on the verified alternate port**

Run:

```bash
docker run --rm --detach \
  --name evm-openapi-postgres \
  --publish 127.0.0.1:5433:5432 \
  --env POSTGRES_DB=evm \
  --env POSTGRES_USER=evm \
  --env POSTGRES_PASSWORD=evm \
  --health-cmd "pg_isready -U evm -d evm" \
  --health-interval 2s \
  --health-timeout 3s \
  --health-retries 20 \
  postgres:17-alpine
docker inspect --format '{{.State.Health.Status}}' evm-openapi-postgres
```

Expected: the container reports `healthy`. Do not use the PostgreSQL already
bound to 5432 by another worktree.

- [ ] **Step 2: Migrate and execute the complete test surface**

Run these commands in order:

```bash
DATABASE_URL=postgres://evm:evm@127.0.0.1:5433/evm npm run db:migrate
npm run typecheck
npm run test:structure
npm run test:client
DATABASE_URL=postgres://evm:evm@127.0.0.1:5433/evm npm run test:integration
DATABASE_URL=postgres://evm:evm@127.0.0.1:5433/evm npm run test:contract
npm run lint
npm run build
```

Expected: every command exits zero. Read each complete output; do not use a
narrow command to claim full-suite success.

- [ ] **Step 3: Run the explicit documentation smoke against the live app**

Start the application on port 3100 with the isolated database:

```bash
DATABASE_URL=postgres://evm:evm@127.0.0.1:5433/evm \
  NEXT_TELEMETRY_DISABLED=1 \
  npm run dev -- --hostname 127.0.0.1 --port 3100
```

From another terminal, run:

```bash
curl --fail --show-error --silent \
  --output /tmp/evm-openapi-docs.html \
  http://127.0.0.1:3100/api-docs
curl --fail --show-error --silent \
  --output /tmp/evm-openapi-served.yaml \
  http://127.0.0.1:3100/api-docs/openapi.yaml
cmp contracts/evm/openapi.yaml /tmp/evm-openapi-served.yaml
curl --fail --show-error --silent \
  http://127.0.0.1:3100/api-docs/assets/swagger-ui.css \
  --output /tmp/evm-openapi-swagger.css
curl --fail --show-error --silent \
  http://127.0.0.1:3100/projects \
  --output /tmp/evm-openapi-projects.json
```

Expected: every curl exits zero, `cmp` emits no output, the HTML and CSS files
are non-empty, and the projects response is the fixture-backed collection.
Stop the Next process cleanly after the smoke.

- [ ] **Step 4: Audit source authority, diff territory and OpenSpec coverage**

Run:

```bash
git diff origin/develop --name-only
git diff origin/develop -- contracts/evm/openapi.yaml
git diff origin/develop -- src/ui src/domain src/application README.md
openspec validate verify-publish-evm-openapi \
  --type change --strict --no-interactive --json
git diff --check
```

Expected:

- the OpenAPI diff is empty if the automated audit found no contract defect;
- the excluded-territory diff is empty;
- OpenSpec passes with no issues; and
- `git diff --check` emits no output.

If `contracts/evm/openapi.yaml` changed, the commit history and report must name
the exact discrepancy and the ADR evidence proving the YAML was wrong.

- [ ] **Step 5: Mark only evidenced OpenSpec tasks complete**

Change every checkbox in
`openspec/changes/verify-publish-evm-openapi/tasks.md` from `[ ]` to `[x]` only
after the corresponding command or diff proves it. Then run:

```bash
openspec status --change verify-publish-evm-openapi
openspec validate verify-publish-evm-openapi \
  --type change --strict --no-interactive --json
git diff --check
```

Expected: all artifacts remain complete, strict validation passes and the task
file contains no unchecked implementation item.

- [ ] **Step 6: Commit verification evidence and stop the private database**

Run:

```bash
git add -- openspec/changes/verify-publish-evm-openapi/tasks.md
git diff --cached --check
git commit -m "docs(openapi): registrar verificación del cambio"
docker stop evm-openapi-postgres
```

Expected: the commit contains only the completed task checklist. The named
ephemeral database stops and auto-removes; no shared container is changed.

- [ ] **Step 7: Perform the completion audit**

Inspect:

```bash
git status --short --branch
git log --oneline --decorate origin/develop..HEAD
git diff --stat origin/develop...HEAD
git diff --check origin/develop...HEAD
git diff --name-only origin/develop...HEAD
```

Prove each objective item from current evidence:

- the operation matrix reports any discrepancies and their origin;
- eight successes and all three error envelopes passed OpenAPI 3.1 validation;
- both 204 responses were bodyless;
- `/api-docs`, its canonical YAML and local assets responded;
- a real operation responded from the same application;
- excluded territory and user work remain untouched; and
- the handoff line is exactly `Swagger UI: /api-docs`.
