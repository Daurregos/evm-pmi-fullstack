# Slice A1 Application Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Implement fixture-backed EVM application use cases, accumulated business validation and transactional PostgreSQL persistence without adding HTTP handlers.

**Architecture:** Application owns commands, validation, use-case results and conversion between stored percentage scale and the pure EVM domain. Infrastructure owns the Drizzle implementation and PostgreSQL operations. The existing shared contract remains unchanged; application materializes its published read DTOs after domain calculation.

**Tech Stack:** TypeScript 5.9, Node Test Runner, PostgreSQL 17, Drizzle ORM, decimal.js, Next.js project tooling.

---

### Task 1: Expand the persistence port with RED integration coverage

**Files:**
- Modify: src/application/evm-repository.ts
- Modify: src/infrastructure/database/drizzle-evm-repository.ts
- Modify: src/infrastructure/database/map-activity-row.ts only if its public record shape needs adaptation
- Modify: tests/integration/decimal-roundtrip.test.ts
- Create: tests/integration/application-persistence.test.ts

- [ ] **Step 1: Write failing repository CRUD tests against PostgreSQL**

```ts
test("creates, lists, finds, replaces and deletes captured-only records", async () => {
  const project = await repository.createProject({
    name: "Proyecto CRUD",
    cutoffDate: "2026-07-29",
  });
  const activity = await repository.createActivity({
    projectId: project.id,
    name: "Actividad CRUD",
    bac: new Decimal("1000"),
    plannedProgress: new Decimal("50"),
    actualProgress: new Decimal("40"),
    ac: new Decimal("500"),
  });

  assert.deepEqual(await repository.listProjects(), [{ id: project.id, name: "Proyecto CRUD" }]);
  assert.equal((await repository.findActivity(project.id, activity.id))?.bac.eq("1000"), true);
  assert.equal((await repository.replaceActivity(project.id, activity.id, {
    projectId: project.id,
    name: "Renombrada",
    bac: activity.bac,
    plannedProgress: activity.plannedProgress,
    actualProgress: activity.actualProgress,
    ac: activity.ac,
  }))?.name, "Renombrada");
  assert.equal(await repository.deleteActivity(project.id, activity.id), true);
});
```

- [ ] **Step 2: Run the focused test to verify RED**

Run: npm run test:integration -- application-persistence.test.ts
Expected: FAIL because the expanded repository API does not exist.

- [ ] **Step 3: Replace the repository interface with captured-data operations**

```ts
export interface EvmRepository {
  createProject(input: NewProjectRecord): Promise<ProjectRecord>;
  findProject(id: number): Promise<ProjectRecord | null>;
  listProjects(): Promise<readonly ProjectRecord[]>;
  replaceProject(id: number, input: NewProjectRecord): Promise<ProjectRecord | null>;
  deleteProject(id: number): Promise<boolean>;
  createActivity(input: NewActivityRecord): Promise<ActivityRecord>;
  findActivity(projectId: number, id: number): Promise<ActivityRecord | null>;
  listActivities(projectId: number): Promise<readonly ActivityRecord[]>;
  replaceActivity(projectId: number, id: number, input: NewActivityRecord): Promise<ActivityRecord | null>;
  deleteActivity(projectId: number, id: number): Promise<boolean>;
}
```

Define NewProjectRecord and NewActivityRecord by omitting generated identifiers; retain Decimal in all persisted numeric fields.

- [ ] **Step 4: Implement the Drizzle operations**

Use insert(...).values(...).returning(), update(...).set(...).where(...).returning(), select and delete returning an id. Scope activity reads, replacements and deletes with both projectId and id by using Drizzle and(). Keep numeric conversion exclusively in mapActivityRow.

- [ ] **Step 5: Adapt the decimal round-trip test**

Replace saveProject/saveActivity with createProject/createActivity and assert the round trip through findActivity(projectId, activityId), retaining its direct numeric-string assertion.

- [ ] **Step 6: Run repository tests to GREEN**

Run: npm run test:integration -- application-persistence.test.ts decimal-roundtrip.test.ts
Expected: PASS, with PostgreSQL preserving the exact 18-place values and no derived writes.

- [ ] **Step 7: Commit the persistence port**

```bash
git add src/application/evm-repository.ts src/infrastructure/database/drizzle-evm-repository.ts src/infrastructure/database/map-activity-row.ts tests/integration/decimal-roundtrip.test.ts tests/integration/application-persistence.test.ts
git commit -m "feat: expand EVM persistence repository"
```

### Task 2: Accumulated business validation

**Files:**
- Create: src/application/evm-validation.ts
- Create: tests/integration/evm-validation.test.ts
- Modify: tests/integration/application-persistence.test.ts

- [ ] **Step 1: Write fixture-backed failing validation tests**

Load contracts/evm/evm-fixture.json directly, iterate validationChecks.cases, and compare the unordered field/rule pairs without recalculating expectations.

```ts
test("accumulates V9 business violations", () => {
  const validation = validateActivityWrite(v9.request);
  assert.equal(validation.ok, false);
  if (!validation.ok) {
    assert.deepEqual(
      new Set(validation.violations.map(({ field, rule }) => field + ":" + rule)),
      new Set(v9.expectedBody.violations.map(({ field, rule }) => field + ":" + rule)),
    );
  }
});
```

Also generate absence and null cases for every writeSchemas project and activity field. Assert leading/trailing name normalization and that interior spaces remain.

- [ ] **Step 2: Run validation tests to verify RED**

Run: node --import tsx --test tests/integration/evm-validation.test.ts
Expected: FAIL because evm-validation.ts does not exist.

- [ ] **Step 3: Implement validators and normalized commands**

```ts
export type ValidationResult<T> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false; violations: readonly ContractViolation[] }>;

export function validateActivityWrite(
  input: Readonly<Record<string, unknown>>,
): ValidationResult<ValidatedActivityWrite>;
```

Implement project and activity variants. Treat missing and null as required; trim name before required/persistence; test BAC positive, AC non-negative and both percentages inclusively in 0–100. Classify all non-write keys as read_only only when present in the corresponding read shape; otherwise unknown. Use the Spanish messages from the fixture examples and retain the received key for unknown.

- [ ] **Step 4: Run validation tests to GREEN**

Run: node --import tsx --test tests/integration/evm-validation.test.ts
Expected: PASS for V1–V13, all generated required-field cases, whitespace normalization and unordered V9 accumulation.

- [ ] **Step 5: Add a no-mutation integration assertion**

Seed the fixture, attempt V9 through the eventual use case once it exists, and assert the subsequent project analysis is exactly the metadata-stripped fixture readResponse.

- [ ] **Step 6: Commit validation**

```bash
git add src/application/evm-validation.ts tests/integration/evm-validation.test.ts tests/integration/application-persistence.test.ts
git commit -m "feat: validate EVM business writes"
```

### Task 3: Materialize authoritative EVM read models

**Files:**
- Create: src/application/evm-analysis.ts
- Create: tests/integration/evm-analysis.test.ts
- Modify: tests/integration/application-persistence.test.ts

- [ ] **Step 1: Write failing analysis tests from the fixture**

Load the fixture directly and compare ProjectAnalysis after seeding the reference project.

```ts
test("materializes the reference project analysis from persisted captured values", async () => {
  await seedFixture(db);
  const result = await application.getProjectAnalysis(1);
  assert.deepEqual(result, stripFixtureMetadata(fixture.readResponse));
});
```

Add the empty-project assertion against emptyProject and a direct assertion that one activity with non-evaluable CPI does not prevent an evaluable consolidated CPI.

- [ ] **Step 2: Run the focused analysis tests to verify RED**

Run: node --import tsx --test tests/integration/evm-analysis.test.ts
Expected: FAIL because the analysis adapter/use case is absent.

- [ ] **Step 3: Implement the application-to-domain adapter**

```ts
function toActivityInput(record: ActivityRecord): ActivityInput {
  return {
    bac: record.bac,
    plannedProgress: record.plannedProgress.div(100),
    actualProgress: record.actualProgress.div(100),
    ac: record.ac,
  };
}
```

Derive every activity through deriveActivity and derive the summary through consolidateProject. Convert Decimal values to JSON numbers only after calculation, preserve CPI/SPI display/status/label, and do not expose domain activity state.

- [ ] **Step 4: Run analysis tests to GREEN**

Run: node --import tsx --test tests/integration/evm-analysis.test.ts
Expected: PASS for the eight activities, summary and empty project using only fixture expectations.

- [ ] **Step 5: Commit analysis mapping**

```bash
git add src/application/evm-analysis.ts tests/integration/evm-analysis.test.ts tests/integration/application-persistence.test.ts
git commit -m "feat: derive persisted EVM project analysis"
```

### Task 4: Implement project and activity use cases

**Files:**
- Create: src/application/evm-use-cases.ts
- Modify: src/application/evm-validation.ts
- Modify: tests/integration/application-persistence.test.ts
- Modify: tests/integration/evm-analysis.test.ts

- [ ] **Step 1: Write failing create/replace/delete use-case tests**

Cover successful project/activity creates and replacements, valid absence results, scoped activity ownership, list output, and validation-before-mutation. For every V1–V13 fixture case, seed PostgreSQL with the reference project, invoke the relevant project or activity use case, compare unordered field/rule pairs and a non-empty Spanish message, then reread through getProjectAnalysis and compare exactly with the metadata-stripped fixture response.

```ts
const replacement = await application.replaceActivity(projectId, activityId, {
  name: "Actividad editada",
  bac: 2000,
  plannedProgress: 60,
  actualProgress: 50,
  ac: 900,
});
assert.equal(replacement.ok, true);
if (replacement.ok) assert.equal(replacement.value.ev, 1000);
```

For each captured activity field, replace only that field with a valid alternate and assert the fixture-backed analysis changes. Replace only name and cutoffDate and assert indicator blocks remain deep-equal to the pre-write fixture values.

- [ ] **Step 2: Run use-case tests to verify RED**

Run: npm run test:integration -- application-persistence.test.ts
Expected: FAIL because EvmUseCases does not exist.

- [ ] **Step 3: Implement result unions and project methods**

```ts
export type UseCaseResult<T> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false; kind: "validation"; violations: readonly ContractViolation[] }>
  | Readonly<{ ok: false; kind: "not_found" }>;
```

Implement createProject, replaceProject, deleteProject and listProjects. Validate before repository calls; return ProjectRead for creates/replacements and a not_found result for absent resources without HTTP semantics.

- [ ] **Step 4: Implement activity methods and analysis delegation**

Implement createActivity, replaceActivity and deleteActivity. Check the project exists before create and use scoped repository methods for replacement/deletion. Return ActivityRead by delegating to the analysis materializer after a successful write. Implement getProjectAnalysis as the public use-case façade over the Task 3 adapter.

- [ ] **Step 5: Run use-case and integration tests to GREEN**

Run: npm run test:integration -- application-persistence.test.ts
Expected: PASS for CRUD, ownership, fixture analysis, four individual captured-value changes, name/cutoff invariance and rejected-write state integrity.

- [ ] **Step 6: Commit use cases**

```bash
git add src/application/evm-use-cases.ts src/application/evm-validation.ts tests/integration/evm-analysis.test.ts tests/integration/application-persistence.test.ts
git commit -m "feat: add EVM application use cases"
```

### Task 5: Prove cascade and storage invariants

**Files:**
- Modify: tests/integration/application-persistence.test.ts
- Modify: tests/integration/seed.test.ts if a focused schema assertion is missing
- Modify: openspec/changes/implement-slice-a1-application-persistence/tasks.md

- [ ] **Step 1: Write failing cascade and rollback tests**

Create a project with siblings; delete one activity and assert project/sibling remain. Create another project with two activities, install a test-local PostgreSQL BEFORE DELETE trigger that raises while cascading, call deleteProject and assert rejection followed by presence of all rows.

```ts
await pool.query("create trigger fail_cascade before delete on activities for each row execute function fail_project_cascade()");
await assert.rejects(repository.deleteProject(project.id), /forced cascade failure/);
assert.ok(await repository.findProject(project.id));
assert.equal((await repository.listActivities(project.id)).length, 2);
```

Drop the trigger and function in finally so later tests retain normal cascade behavior.

- [ ] **Step 2: Run cascade tests to verify RED**

Run: npm run test:integration -- application-persistence.test.ts
Expected: FAIL until repository deletion is a direct PostgreSQL cascade and test cleanup exists.

- [ ] **Step 3: Keep deletion declarative and add model inspection**

Implement only the repository delete operations required for the tests. Add assertions that information_schema still exposes exactly the captured activity columns and that no repository SQL writes a calculated field.

- [ ] **Step 4: Run cascade and storage tests to GREEN**

Run: npm run test:integration -- application-persistence.test.ts seed.test.ts
Expected: PASS for project cascade, sibling preservation, forced rollback, captured-only columns and single current cutoff.

- [ ] **Step 5: Mark verified OpenSpec implementation tasks**

Change only demonstrated completed items in openspec/changes/implement-slice-a1-application-persistence/tasks.md from - [ ] to - [x].

- [ ] **Step 6: Commit persistence evidence**

```bash
git add tests/integration/application-persistence.test.ts tests/integration/seed.test.ts openspec/changes/implement-slice-a1-application-persistence/tasks.md
git commit -m "test: verify EVM persistence invariants"
```

### Task 6: Document the implemented architecture

**Files:**
- Create: docs/ARCHITECTURE.md
- Modify: openspec/changes/implement-slice-a1-application-persistence/tasks.md

- [ ] **Step 1: Write a concise architecture document after code is green**

Use a compact Mermaid layer diagram with dependency arrows, accompanied by the precise lint rule that permits/protects each boundary. Include the text route of GET /projects/{id}: intended real handler → application use case → repository → PostgreSQL → application/domain → response; identify that the only executable HTTP endpoint remains /mock-api and A2 owns the real handler.

- [ ] **Step 2: Add the calculation and ADR index sections**

State that domain alone evaluates formulas and classification, application normalizes and orchestrates, infrastructure persists inputs, and UI presents received DTOs without importing server layers or calculating. Add a table mapping all ten ADRs 001, 002, 003, 004, 005, 006a, 006b, 007, 008 and 009 to their relevant system boundary.

- [ ] **Step 3: Validate the documentation against current source**

Run: git diff --check
Expected: PASS, including the new architecture file after git add -N -- docs/ARCHITECTURE.md.

Run: rg -n "mock-api|A2|deriveActivity|consolidateProject|ADR-00" docs/ARCHITECTURE.md
Expected: output demonstrates the required caveats and routing references.

- [ ] **Step 4: Mark the documentation task and commit it**

```bash
git add docs/ARCHITECTURE.md openspec/changes/implement-slice-a1-application-persistence/tasks.md
git commit -m "docs: describe implemented EVM architecture"
```

### Task 7: Full verification and handoff

**Files:**
- Modify: openspec/changes/implement-slice-a1-application-persistence/tasks.md

- [ ] **Step 1: Run all fresh verification commands**

```bash
npm run test:types
npm run test:structure
npm run test:client
npm run test:integration
npm run test:contract
npm run lint
npm run lint:imports
npm run typecheck
npm test
npm run build
git diff --check
```

Expected: every command exits zero; npm test preserves the baseline’s 98 domain tests and runs the new PostgreSQL evidence.

- [ ] **Step 2: Audit ADR verification statements**

Read and contrast final evidence with the Verificación sections of ADR-002, ADR-005, ADR-008 and the business-validation portion of ADR-009. Confirm explicitly: derived fields are absent from model/writes; only one current cutoff exists; project cascade/sibling/rollback work; V1–V13 accumulate expected violations and rejected writes preserve state.

- [ ] **Step 3: Review diff and mark OpenSpec complete**

```bash
git diff origin/develop...HEAD --check
git diff --name-only origin/develop...HEAD
openspec status --change implement-slice-a1-application-persistence --json
```

Confirm closed sources and excluded folders are absent from the diff, mark only verified remaining task boxes - [x], and re-run OpenSpec status.

- [ ] **Step 4: Commit verification metadata and confirm integration target**

```bash
git add openspec/changes/implement-slice-a1-application-persistence/tasks.md
git commit -m "docs: verify slice A1 implementation"
git status --short --branch
git log --oneline origin/develop..HEAD
```

Confirm the branch is ready for a future pull request to develop, without creating or merging that pull request.
