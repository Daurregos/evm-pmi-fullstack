# Slice A2 HTTP Surface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose the eight published EVM operations through real Next.js routes with the exact fixture-backed success and error contract.

**Architecture:** Thin App Router handlers delegate to one lazily composed `EvmUseCases` instance. Focused infrastructure modules parse only structural JSON concerns and map application results to the common HTTP envelope; A1 remains authoritative for business validation and domain calculation.

**Tech Stack:** TypeScript 5.9, Next.js 16 App Router, Node.js test runner, PostgreSQL 17, Drizzle ORM, OpenSpec 1.3.1.

---

## Canonical inputs and file map

Read before each implementation task:

- Product rules: `docs/PRD.md`
- HTTP decisions: `docs/adr/006a-diseno-recursos-rest.md`,
  `docs/adr/006b-forma-respuesta-contrato-datos.md`,
  `docs/adr/007-estrategia-recalculo-tras-edicion.md`,
  `docs/adr/009-contrato-errores-api.md`
- Published contract: `contracts/evm/openapi.yaml`
- Numeric and payload oracle: `contracts/evm/evm-fixture.json`
- Test ownership: `docs/TESTING.md`
- Canonical change: `openspec/changes/implement-slice-a2-http-surface/`

Create or modify only these implementation-owned files:

- Create `src/infrastructure/http/evm-use-cases.ts`: lazy server composition.
- Create `src/infrastructure/http/request.ts`: JSON syntax, known non-null type
  and date-format checks.
- Create `src/infrastructure/http/response.ts`: success and public error
  translation.
- Create `src/app/projects/route.ts`: list/create projects.
- Create `src/app/projects/[projectId]/route.ts`: read/replace/delete a project.
- Create `src/app/projects/[projectId]/activities/route.ts`: create an activity.
- Create
  `src/app/projects/[projectId]/activities/[activityId]/route.ts`:
  replace/delete an activity.
- Create `tests/contract/real-http.test.ts`: fixture-backed runtime contract.
- Create `tests/contract/http-surface-structure.test.ts`: negative surface and
  route-boundary evidence.
- Modify `scripts/run-contract-tests.ts`: run mock and real suites serially.
- Modify `docs/ARCHITECTURE.md`: replace only the pending A2 journey.
- Modify
  `openspec/changes/implement-slice-a2-http-surface/tasks.md` only as evidence
  becomes complete.

Do not modify `docs/PRD.md`, `docs/ASSUMPTIONS.md`, `docs/adr/`,
`contracts/evm/openapi.yaml`, `contracts/evm/evm-fixture.json`, `src/domain/`,
`src/application/`, `src/shared/`, `src/ui/` or `src/app/mock-api/`.

### Task 1: Real contract harness and red project reads

**Files:**

- Create: `tests/contract/real-http.test.ts`
- Modify: `scripts/run-contract-tests.ts`
- Reference: `contracts/evm/evm-fixture.json`

- [ ] **Step 1: Add the real HTTP test fixture and database lifecycle**

Create `tests/contract/real-http.test.ts` with direct fixture loading, a
PostgreSQL advisory lock, deterministic reset and HTTP helpers:

```ts
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
  if (Array.isArray(value)) return value.map(stripMetadata);
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
  return {
    body: raw === "" ? undefined : (JSON.parse(raw) as JsonValue),
    raw,
    status: response.status,
  };
}

before(async () => databaseLock.acquire());
beforeEach(resetFixture);
after(async () => {
  try {
    await databaseLock.release();
  } finally {
    await pool.end();
  }
});
```

- [ ] **Step 2: Add red collection and exact aggregate tests**

Append these exact assertions:

```ts
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
  assert.equal(
    response.status,
    ((fixture.successResponses as JsonObject).getProject as JsonObject)
      .expectedStatus,
  );
  assert.deepEqual(response.body, stripMetadata(fixture.readResponse));
});
```

- [ ] **Step 3: Make the contract runner execute all three contract files serially**

In `scripts/run-contract-tests.ts`, replace the single test path with:

```ts
const tests = spawn(
  process.execPath,
  [
    "--import",
    "tsx",
    "--test",
    "--test-concurrency=1",
    "tests/contract/mock-http.test.ts",
    "tests/contract/http-surface-structure.test.ts",
    "tests/contract/real-http.test.ts",
  ],
  { env: childEnvironment, stdio: "inherit" },
);
```

Create a temporary `tests/contract/http-surface-structure.test.ts` containing
one passing import-free test so the runner reaches the red HTTP tests:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";

test("real HTTP surface structure is introduced contract-first", () => {
  assert.ok(true);
});
```

- [ ] **Step 4: Run the focused suite and verify the intended red state**

Run:

```bash
npm run test:contract
```

Expected: existing `/mock-api` tests pass and the three real-route tests fail
because `/projects` does not yet resolve to the published JSON API.

- [ ] **Step 5: Commit the red contract harness**

```bash
git add scripts/run-contract-tests.ts \
  tests/contract/http-surface-structure.test.ts \
  tests/contract/real-http.test.ts
git commit -m "test(http): define real project reads"
```

### Task 2: Shared HTTP translation

**Files:**

- Create: `src/infrastructure/http/evm-use-cases.ts`
- Create: `src/infrastructure/http/request.ts`
- Create: `src/infrastructure/http/response.ts`
- Test: `tests/contract/real-http.test.ts`

- [ ] **Step 1: Add structural-failure tests before production code**

Append tests that send raw malformed JSON, an incompatible known activity BAC,
an invalid project date and an array root. For each case assert status `400`,
`code === "malformed_request"`, `violations` is `[]`, and the envelope keys are
exactly `code`, `message`, `violations`:

```ts
async function assertMalformed(
  pathname: string,
  body: string,
): Promise<void> {
  const response = await request(pathname, {
    body,
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  assert.equal(response.status, 400);
  const envelope = response.body as JsonObject;
  assert.deepEqual(Object.keys(envelope).sort(), [
    "code",
    "message",
    "violations",
  ]);
  assert.equal(envelope.code, "malformed_request");
  assert.equal(typeof envelope.message, "string");
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
```

Run `npm run test:contract`; expected: the new test fails because the real
routes are absent, while mock tests remain green.

- [ ] **Step 2: Implement lazy use-case composition**

Create `src/infrastructure/http/evm-use-cases.ts`:

```ts
import { EvmUseCases } from "@/application/evm-use-cases";
import { createDatabase } from "@/infrastructure/database/client";
import { DrizzleEvmRepository } from "@/infrastructure/database/drizzle-evm-repository";

let useCases: EvmUseCases | undefined;

export function getEvmUseCases(): EvmUseCases {
  if (!useCases) {
    const { db } = createDatabase();
    useCases = new EvmUseCases(new DrizzleEvmRepository(db));
  }
  return useCases;
}
```

- [ ] **Step 3: Implement the structural parser**

Create `src/infrastructure/http/request.ts` with:

```ts
export type WriteInput = Readonly<Record<string, unknown>>;
export type ParsedWrite =
  | Readonly<{ ok: true; value: WriteInput }>
  | Readonly<{ ok: false }>;

type FieldType = "number" | "string";

const projectTypes: Readonly<Record<string, FieldType>> = {
  name: "string",
  cutoffDate: "string",
};
const activityTypes: Readonly<Record<string, FieldType>> = {
  name: "string",
  bac: "number",
  plannedProgress: "number",
  actualProgress: "number",
  ac: "number",
};

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function isFullDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year === 0 || month < 1 || month > 12) return false;
  const days = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  return day >= 1 && day <= days[month - 1]!;
}

async function parse(
  request: Request,
  types: Readonly<Record<string, FieldType>>,
  validateDate: boolean,
): Promise<ParsedWrite> {
  let value: unknown;
  try {
    value = await request.json();
  } catch {
    return { ok: false };
  }
  if (!isObject(value)) return { ok: false };

  for (const [field, expectedType] of Object.entries(types)) {
    const candidate = value[field];
    if (candidate === undefined || candidate === null) continue;
    if (
      typeof candidate !== expectedType ||
      (expectedType === "number" && !Number.isFinite(candidate))
    ) {
      return { ok: false };
    }
  }
  if (
    validateDate &&
    typeof value.cutoffDate === "string" &&
    !isFullDate(value.cutoffDate)
  ) {
    return { ok: false };
  }
  return { ok: true, value };
}

export function parseProjectWrite(request: Request): Promise<ParsedWrite> {
  return parse(request, projectTypes, true);
}

export function parseActivityWrite(request: Request): Promise<ParsedWrite> {
  return parse(request, activityTypes, false);
}
```

The loop intentionally ignores absent, `null` and every key outside the known
write schema.

- [ ] **Step 4: Implement public response translation**

Create `src/infrastructure/http/response.ts`:

```ts
import type { UseCaseResult } from "@/application/evm-use-cases";
import type { ErrorEnvelope } from "@/shared/contract";

function errorResponse(
  status: 400 | 404 | 422,
  body: ErrorEnvelope,
): Response {
  return Response.json(body, { status });
}

export function malformedRequest(): Response {
  return errorResponse(400, {
    code: "malformed_request",
    message: "La petición no pudo interpretarse.",
    violations: [],
  });
}

export function notFound(): Response {
  return errorResponse(404, {
    code: "not_found",
    message: "El recurso no existe.",
    violations: [],
  });
}

export function jsonSuccess(value: unknown, status: 200 | 201): Response {
  return Response.json(value, { status });
}

export function useCaseResponse<T>(
  result: UseCaseResult<T>,
  status: 200 | 201 | 204,
): Response {
  if (result.ok) {
    return status === 204
      ? new Response(null, { status })
      : jsonSuccess(result.value, status);
  }
  if (result.kind === "not_found") return notFound();
  return errorResponse(422, {
    code: "validation_failed",
    message: "La entrada contiene errores.",
    violations: result.violations,
  });
}
```

- [ ] **Step 5: Run typecheck and commit the shared adapter**

Run:

```bash
npm run typecheck
```

Expected: zero TypeScript errors. If `Number.isFinite(candidate)` does not
narrow `unknown`, guard it with `typeof candidate === "number"` without
changing semantics.

Commit:

```bash
git add src/infrastructure/http
git commit -m "feat(http): translate requests and application results"
```

### Task 3: Project routes and success semantics

**Files:**

- Create: `src/app/projects/route.ts`
- Create: `src/app/projects/[projectId]/route.ts`
- Test: `tests/contract/real-http.test.ts`

- [ ] **Step 1: Add red project mutation and not-found tests**

Add tests for:

- `POST /projects` returning `201` and exactly `{id,name,cutoffDate}`;
- `PUT /projects/1` returning the exact fixture project with `200`;
- a pre/post aggregate comparison proving a project replacement changes only
  project fields and leaves `activities` and `summary` identical;
- deleting a newly created project returns `204` and an empty raw body;
- repeated `PUT` and `DELETE` of id `999999` return the fixture `404` shape.

Use this request helper:

```ts
function jsonRequest(method: string, body?: JsonValue): RequestInit {
  return {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    method,
  };
}
```

For error assertions compare only status, `code`, an existing string `message`
and `violations: []`; never fix message wording.

Run `npm run test:contract`; expected: project route tests fail with `404`.

- [ ] **Step 2: Implement list and create**

Create `src/app/projects/route.ts`:

```ts
import { getEvmUseCases } from "@/infrastructure/http/evm-use-cases";
import { parseProjectWrite } from "@/infrastructure/http/request";
import {
  jsonSuccess,
  malformedRequest,
  useCaseResponse,
} from "@/infrastructure/http/response";

export async function GET(): Promise<Response> {
  return jsonSuccess(await getEvmUseCases().listProjects(), 200);
}

export async function POST(request: Request): Promise<Response> {
  const parsed = await parseProjectWrite(request);
  if (!parsed.ok) return malformedRequest();
  return useCaseResponse(
    await getEvmUseCases().createProject(parsed.value),
    201,
  );
}
```

- [ ] **Step 3: Implement project member handlers**

Create `src/app/projects/[projectId]/route.ts`:

```ts
import { getEvmUseCases } from "@/infrastructure/http/evm-use-cases";
import { parseProjectWrite } from "@/infrastructure/http/request";
import {
  jsonSuccess,
  malformedRequest,
  notFound,
  useCaseResponse,
} from "@/infrastructure/http/response";

interface ProjectRouteContext {
  params: Promise<{ projectId: string }>;
}

async function projectId(context: ProjectRouteContext): Promise<number> {
  return Number((await context.params).projectId);
}

export async function GET(
  _request: Request,
  context: ProjectRouteContext,
): Promise<Response> {
  const analysis = await getEvmUseCases().getProjectAnalysis(
    await projectId(context),
  );
  return analysis === null ? notFound() : jsonSuccess(analysis, 200);
}

export async function PUT(
  request: Request,
  context: ProjectRouteContext,
): Promise<Response> {
  const parsed = await parseProjectWrite(request);
  if (!parsed.ok) return malformedRequest();
  return useCaseResponse(
    await getEvmUseCases().replaceProject(
      await projectId(context),
      parsed.value,
    ),
    200,
  );
}

export async function DELETE(
  _request: Request,
  context: ProjectRouteContext,
): Promise<Response> {
  return useCaseResponse(
    await getEvmUseCases().deleteProject(await projectId(context)),
    204,
  );
}
```

Do not call `getProjectAnalysis` from `PUT` or `DELETE`.

- [ ] **Step 4: Run focused tests and commit green project routes**

Run:

```bash
npm run test:contract
npm run typecheck
```

Expected: mock, project read, project mutation and structural project tests
pass; activity cases may remain red until Task 4.

Commit:

```bash
git add src/app/projects tests/contract/real-http.test.ts
git commit -m "feat(http): expose project resources"
```

### Task 4: Nested activity routes and read representations

**Files:**

- Create: `src/app/projects/[projectId]/activities/route.ts`
- Create:
  `src/app/projects/[projectId]/activities/[activityId]/route.ts`
- Test: `tests/contract/real-http.test.ts`

- [ ] **Step 1: Add red activity success and absence tests**

Use the captured fields from the first fixture activity. Add tests proving:

- create under empty project `2` returns `201`, a generated integer `id`, and
  every captured and derived field equal to the fixture activity after replacing
  its fixture id with the generated id;
- replace `/projects/1/activities/1` returns `200` and the exact fixture
  activity;
- deleting an activity created under project `2` returns `204` with no body;
- create under a missing project, replace a missing or out-of-project activity,
  and repeated delete return `404`;
- `GET /projects/2` after create and after delete reflects the mutation through
  a separate aggregate read, while mutation responses remain `ActivityRead` or
  empty rather than aggregate.

Run `npm run test:contract`; expected: the new activity tests fail with `404`.

- [ ] **Step 2: Implement activity creation**

Create `src/app/projects/[projectId]/activities/route.ts`:

```ts
import { getEvmUseCases } from "@/infrastructure/http/evm-use-cases";
import { parseActivityWrite } from "@/infrastructure/http/request";
import {
  malformedRequest,
  useCaseResponse,
} from "@/infrastructure/http/response";

interface ActivityCollectionContext {
  params: Promise<{ projectId: string }>;
}

export async function POST(
  request: Request,
  context: ActivityCollectionContext,
): Promise<Response> {
  const parsed = await parseActivityWrite(request);
  if (!parsed.ok) return malformedRequest();
  const { projectId } = await context.params;
  return useCaseResponse(
    await getEvmUseCases().createActivity(Number(projectId), parsed.value),
    201,
  );
}
```

- [ ] **Step 3: Implement activity replacement and deletion**

Create
`src/app/projects/[projectId]/activities/[activityId]/route.ts`:

```ts
import { getEvmUseCases } from "@/infrastructure/http/evm-use-cases";
import { parseActivityWrite } from "@/infrastructure/http/request";
import {
  malformedRequest,
  useCaseResponse,
} from "@/infrastructure/http/response";

interface ActivityRouteContext {
  params: Promise<{ activityId: string; projectId: string }>;
}

export async function PUT(
  request: Request,
  context: ActivityRouteContext,
): Promise<Response> {
  const parsed = await parseActivityWrite(request);
  if (!parsed.ok) return malformedRequest();
  const { activityId, projectId } = await context.params;
  return useCaseResponse(
    await getEvmUseCases().replaceActivity(
      Number(projectId),
      Number(activityId),
      parsed.value,
    ),
    200,
  );
}

export async function DELETE(
  _request: Request,
  context: ActivityRouteContext,
): Promise<Response> {
  const { activityId, projectId } = await context.params;
  return useCaseResponse(
    await getEvmUseCases().deleteActivity(
      Number(projectId),
      Number(activityId),
    ),
    204,
  );
}
```

- [ ] **Step 4: Run focused tests and commit green activity routes**

Run:

```bash
npm run test:contract
npm run typecheck
```

Expected: all project/activity success and missing-resource cases pass, with
both mock and real suites green.

Commit:

```bash
git add src/app/projects tests/contract/real-http.test.ts
git commit -m "feat(http): expose nested activity resources"
```

### Task 5: Complete error matrix and state-intact proof

**Files:**

- Modify: `tests/contract/real-http.test.ts`
- Modify only if a red test proves a defect:
  `src/infrastructure/http/request.ts`,
  `src/infrastructure/http/response.ts`,
  `src/app/projects/**/*.ts`

- [ ] **Step 1: Add direct fixture validation helpers**

Define `Violation` and `ValidationCheck` test types, a `violationKeys` helper
that sorts only `field:rule`, and `assertValidationFailure` that requires
status/code/message, exact public keys and expected violations without ordering
or message-text coupling:

```ts
type Violation = {
  field: string;
  message: string;
  rule: string;
};

function violationKeys(value: JsonValue): string[] {
  assert.ok(Array.isArray(value));
  return value
    .map((entry) => {
      assert.ok(entry !== null && typeof entry === "object" && !Array.isArray(entry));
      const violation = entry as JsonObject;
      assert.equal(typeof violation.message, "string");
      assert.deepEqual(Object.keys(violation).sort(), ["field", "message", "rule"]);
      return `${String(violation.field)}:${String(violation.rule)}`;
    })
    .sort();
}
```

- [ ] **Step 2: Parameterize all thirteen fixture cases**

Iterate `validationChecks.cases`. Submit project cases to `PUT /projects/1` and
activity cases to `PUT /projects/1/activities/1`. Assert `422`,
`validation_failed`, message presence and the same sorted `field:rule` pairs as
the fixture. For V9 additionally assert seven violations and six distinct
rules.

After every rejection, call `GET /projects/1` and deep-compare with stripped
`readResponse`.

- [ ] **Step 3: Parameterize missing and null for every write field**

Read field names directly from `fixture.writeSchemas`. Starting from valid
project and activity bodies, create two cases per field: delete the property and
set it to `null`. Every case must return `422 required` for that exact field,
not `400`.

- [ ] **Step 4: Prove malformed state preservation and internal-detail absence**

Seed, read the reference project, submit the fixture
`errorEnvelopes.malformedRequest.$exampleRequest` to the activity replacement,
assert `400`, then reread and deep-compare exact state. Inspect every returned
error recursively and reject keys matching:

```ts
/exception|stack|trace|framework|postgres|drizzle|cause|detail/i
```

The check applies to keys and never requires a specific human message.

- [ ] **Step 5: Run red-green and commit only evidence-backed corrections**

Run:

```bash
npm run test:contract
```

Expected: all thirteen cases, the fourteen generated required cases, V9, 400,
404 and state-intact checks pass. If a failure occurs, change only the HTTP
translation layer; do not edit A1 or the fixture.

Commit:

```bash
git add tests/contract/real-http.test.ts src/infrastructure/http src/app/projects
git commit -m "test(http): cover validation and intact state"
```

### Task 6: Structural boundaries and architecture journey

**Files:**

- Modify: `tests/contract/http-surface-structure.test.ts`
- Modify: `docs/ARCHITECTURE.md`
- Reference: `docs/TESTING.md`

- [ ] **Step 1: Replace the temporary structural test**

Read the real route tree and add tests that assert:

- exactly the four OpenAPI route files exist;
- no real route exists below flat `/activities` or any `indicators` segment;
- real routes import application behavior only through infrastructure adapters;
- project `PUT` contains `replaceProject` but not `getProjectAnalysis`;
- route and HTTP infrastructure sources contain no EVM formulas or calls to
  domain calculation functions;
- `src/app/mock-api/` files are unchanged from `origin/develop`.

Use `readFileSync`, `readdirSync`/`statSync` and `git diff --quiet
origin/develop -- src/app/mock-api` through `spawnSync("git", [...])`;
assert the command exits zero.

- [ ] **Step 2: Run structural tests**

Run:

```bash
node --import tsx --test tests/contract/http-surface-structure.test.ts
npm run lint:imports
```

Expected: all structural assertions and existing dependency-boundary tests
pass.

- [ ] **Step 3: Update only the pending architecture journey**

In `docs/ARCHITECTURE.md`:

- change dotted A2 arrows to implemented dependencies;
- show `/mock-api` as a retained fixture-backed client double, not a component
  being substituted;
- replace `ruta A2` with `src/app/projects/[projectId]/route.ts`;
- describe the executable round trip through `EvmUseCases`,
  `DrizzleEvmRepository`, PostgreSQL, application/domain and the JSON DTO;
- remove the sentences saying the real route is pending;
- update ADR-006a, ADR-007 and ADR-009 table cells only to remove future tense.

Do not add new sections or unrelated architecture material.

- [ ] **Step 4: Verify the documentation scope and commit**

Run:

```bash
rg -n "A2|pendiente|mock-api|GET /projects|EvmUseCases|PostgreSQL|ADR-00" \
  docs/ARCHITECTURE.md
git diff --check
git diff --quiet origin/develop...HEAD -- \
  docs/PRD.md docs/ASSUMPTIONS.md docs/adr \
  contracts/evm/evm-fixture.json contracts/evm/FIXTURE.md \
  contracts/evm/openapi.yaml src/domain src/application src/shared src/ui \
  src/app/mock-api
```

Expected: no A2 pending marker, the real journey and retained mock are visible,
all ten ADRs remain referenced, whitespace is clean and every closed/excluded
path has no diff.

Commit:

```bash
git add tests/contract/http-surface-structure.test.ts docs/ARCHITECTURE.md
git commit -m "docs: complete the real HTTP request journey"
```

### Task 7: ADR traceability and full verification

**Files:**

- Modify:
  `openspec/changes/implement-slice-a2-http-surface/tasks.md`
- Verify: every file in this plan

- [ ] **Step 1: Build an explicit ADR-to-test audit**

Map every statement in each `## Verificación` section:

- ADR-006a → real route operations, full `PUT`, required matrix, missing
  resources, bare collection, aggregate read, negative route structure, plus
  existing cascade integration tests.
- ADR-006b → exact stripped fixture read, collection shape, mutation write/read
  shapes, integer ids, full-date, JSON number preservation, index objects,
  markers and non-evaluable values.
- ADR-007 → real mutation representations and bodyless delete, project
  no-analysis structural test, separate aggregate read after activity mutation,
  plus existing integration and client refresh tests.
- ADR-009 → thirteen cases, V9 seven violations, missing/null matrix, unknown,
  read-only, lateral whitespace, 400, 404, state intact and no internal details.

If any statement lacks a named test, add the narrowest test at its owning level
before continuing.

- [ ] **Step 2: Run the complete fresh project verification**

Run literally from the worktree:

```bash
npm test
npm run lint
npm run build
openspec validate implement-slice-a2-http-surface --strict
git diff --check
```

Expected: every command exits zero. Read full output; do not infer success from
an earlier run.

- [ ] **Step 3: Verify scope, task completion and branch ownership**

Run:

```bash
git diff --quiet origin/develop...HEAD -- \
  docs/PRD.md docs/ASSUMPTIONS.md docs/adr \
  contracts/evm/evm-fixture.json contracts/evm/FIXTURE.md \
  contracts/evm/openapi.yaml src/domain src/application src/shared src/ui \
  src/app/mock-api
git diff --name-status origin/develop...HEAD
git status --short --branch
git log --oneline --decorate origin/develop..HEAD
```

Expected: only the approved design, plan, active OpenSpec artifacts, real HTTP
routes/infrastructure, tests/runner and architecture journey appear. The main
worktree's untracked files do not appear.

- [ ] **Step 4: Mark only proven OpenSpec tasks complete**

Use `apply_patch` to change each evidenced checkbox in
`openspec/changes/implement-slice-a2-http-surface/tasks.md` from `- [ ]` to
`- [x]`. Then run:

```bash
openspec instructions apply \
  --change implement-slice-a2-http-surface --json
git diff --check
```

Expected: OpenSpec reports every implementation task complete and no whitespace
error.

- [ ] **Step 5: Commit completion evidence**

```bash
git add docs/superpowers/plans/2026-07-29-slice-a2-http-surface.md \
  openspec/changes/implement-slice-a2-http-surface/tasks.md
git commit -m "docs(openspec): record verified slice A2 completion"
```

- [ ] **Step 6: Invoke completion and archive workflows**

Before any completion claim, invoke
`superpowers:verification-before-completion`. After fresh evidence proves every
task, invoke `openspec-archive-change`, validate the archived result, commit the
archive separately, and use `superpowers:finishing-a-development-branch` to
report integration options. Do not push, open, merge or delete a PR, branch or
worktree without the corresponding user authorization.
