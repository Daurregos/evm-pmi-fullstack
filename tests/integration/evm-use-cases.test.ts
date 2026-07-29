import assert from "node:assert/strict";
import { after, test } from "node:test";
import { readFileSync } from "node:fs";

import { EvmUseCases } from "@/application/evm-use-cases";
import { createDatabase } from "@/infrastructure/database/client";
import { DrizzleEvmRepository } from "@/infrastructure/database/drizzle-evm-repository";
import { seedFixture } from "@/infrastructure/database/seed";
import type { ProjectAnalysis } from "@/shared/contract";

type JsonValue =
  | boolean
  | number
  | string
  | null
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

type FixtureViolation = Readonly<{ field: string; rule: string }>;
type ValidationCase = Readonly<{
  $id: string;
  resource: "project" | "activity";
  request: Readonly<Record<string, unknown>>;
  expectedBody: Readonly<{ violations: readonly FixtureViolation[] }>;
}>;

type Fixture = Readonly<{
  readResponse: JsonValue;
  validationChecks: Readonly<{ cases: readonly ValidationCase[] }>;
}>;

function stripFixtureMetadata(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map(stripFixtureMetadata);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !key.startsWith("$"))
        .map(([key, child]) => [key, stripFixtureMetadata(child)]),
    );
  }
  return value;
}

function pairs(
  violations: readonly { field: string; rule: string }[],
): Set<string> {
  return new Set(violations.map(({ field, rule }) => `${field}:${rule}`));
}

function indicators(activity: ProjectAnalysis["activities"][number]) {
  return {
    pv: activity.pv,
    ev: activity.ev,
    cv: activity.cv,
    sv: activity.sv,
    cpi: activity.cpi,
    spi: activity.spi,
    eac: activity.eac,
    vac: activity.vac,
  };
}

const fixture = JSON.parse(
  readFileSync(
    new URL(
      "../../contracts/evm/evm-fixture.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as Fixture;
const referenceResponse = stripFixtureMetadata(fixture.readResponse);

const databaseUrl =
  process.env.DATABASE_URL ?? "postgres://evm:evm@127.0.0.1:5432/evm";
const { db, pool } = createDatabase(databaseUrl);
const repository = new DrizzleEvmRepository(db);
const application = new EvmUseCases(repository);
const createdProjectIds: number[] = [];

after(async () => {
  try {
    if (createdProjectIds.length > 0) {
      await pool.query("delete from projects where id = any($1::int[])", [
        createdProjectIds,
      ]);
    }
  } finally {
    await pool.end();
  }
});

test("creates, replaces, lists and deletes project and activity resources", async () => {
  const createdProject = await application.createProject({
    name: "  Proyecto de casos de uso  ",
    cutoffDate: "2026-07-29",
  });
  assert.equal(createdProject.ok, true);
  if (!createdProject.ok) {
    return;
  }
  createdProjectIds.push(createdProject.value.id);
  assert.deepEqual(createdProject.value, {
    id: createdProject.value.id,
    name: "Proyecto de casos de uso",
    cutoffDate: "2026-07-29",
  });

  assert.deepEqual(
    (await application.listProjects()).find(
      ({ id }) => id === createdProject.value.id,
    ),
    { id: createdProject.value.id, name: "Proyecto de casos de uso" },
  );

  const createdActivity = await application.createActivity(
    createdProject.value.id,
    {
      name: "Actividad de casos de uso",
      bac: 1000,
      plannedProgress: 50,
      actualProgress: 40,
      ac: 500,
    },
  );
  assert.equal(createdActivity.ok, true);
  if (!createdActivity.ok) {
    return;
  }
  assert.equal(createdActivity.value.ev, 400);

  const replacedProject = await application.replaceProject(
    createdProject.value.id,
    {
      name: "Proyecto reemplazado",
      cutoffDate: "2026-08-01",
    },
  );
  assert.equal(replacedProject.ok, true);
  if (!replacedProject.ok) {
    return;
  }
  assert.equal(replacedProject.value.cutoffDate, "2026-08-01");

  const replacedActivity = await application.replaceActivity(
    createdProject.value.id,
    createdActivity.value.id,
    {
      name: "Actividad reemplazada",
      bac: 2000,
      plannedProgress: 60,
      actualProgress: 50,
      ac: 900,
    },
  );
  assert.equal(replacedActivity.ok, true);
  if (!replacedActivity.ok) {
    return;
  }
  assert.equal(replacedActivity.value.ev, 1000);

  assert.equal(
    (await application.deleteActivity(
      createdProject.value.id,
      createdActivity.value.id,
    )).ok,
    true,
  );
  assert.equal(
    (await application.deleteProject(createdProject.value.id)).ok,
    true,
  );
});

test("returns not_found for absent and out-of-scope resources", async () => {
  await seedFixture(db);

  assert.deepEqual(await application.deleteProject(9_999_999), {
    ok: false,
    kind: "not_found",
  });
  assert.deepEqual(
    await application.replaceProject(9_999_999, {
      name: "Proyecto inexistente",
      cutoffDate: "2026-07-29",
    }),
    { ok: false, kind: "not_found" },
  );
  assert.deepEqual(
    await application.replaceActivity(2, 1, {
      name: "No pertenece al proyecto vacío",
      bac: 100,
      plannedProgress: 10,
      actualProgress: 10,
      ac: 10,
    }),
    { ok: false, kind: "not_found" },
  );
  assert.deepEqual(await application.deleteActivity(1, 9_999_999), {
    ok: false,
    kind: "not_found",
  });
});

test("applies every fixture business validation case without mutating PostgreSQL", async () => {
  for (const validationCase of fixture.validationChecks.cases) {
    await seedFixture(db);

    const result =
      validationCase.resource === "project"
        ? await application.replaceProject(1, validationCase.request)
        : await application.replaceActivity(1, 1, validationCase.request);

    assert.equal(result.ok, false, validationCase.$id);
    if (result.ok) {
      continue;
    }
    assert.equal(result.kind, "validation", validationCase.$id);
    if (result.kind === "validation") {
      assert.deepEqual(
        pairs(result.violations),
        pairs(validationCase.expectedBody.violations),
        validationCase.$id,
      );
      assert.equal(
        result.violations.every(({ message }) => message.length > 0),
        true,
        validationCase.$id,
      );
    }

    assert.deepEqual(
      await application.getProjectAnalysis(1),
      referenceResponse,
      validationCase.$id,
    );
  }
});

test("changes derived analysis for every captured activity value", async () => {
  const replacements = {
    bac: 11_000,
    plannedProgress: 45,
    actualProgress: 55,
    ac: 4_500,
  } as const;

  for (const [field, value] of Object.entries(replacements)) {
    await seedFixture(db);
    const before = await application.getProjectAnalysis(1);
    assert.ok(before);
    const source = before.activities[0];
    assert.ok(source);

    const result = await application.replaceActivity(1, source.id, {
      name: source.name,
      bac: field === "bac" ? value : source.bac,
      plannedProgress:
        field === "plannedProgress" ? value : source.plannedProgress,
      actualProgress:
        field === "actualProgress" ? value : source.actualProgress,
      ac: field === "ac" ? value : source.ac,
    });
    assert.equal(result.ok, true, field);

    const afterAnalysis = await application.getProjectAnalysis(1);
    assert.ok(afterAnalysis);
    const after = afterAnalysis.activities[0];
    assert.ok(after);
    assert.notDeepEqual(indicators(after), indicators(source), field);
  }
});

test("preserves indicators when only name or cutoffDate changes", async () => {
  await seedFixture(db);
  const before = await application.getProjectAnalysis(1);
  assert.ok(before);
  const originalActivity = before.activities[0];
  assert.ok(originalActivity);

  const activityResult = await application.replaceActivity(1, originalActivity.id, {
    name: "  Actividad renombrada  ",
    bac: originalActivity.bac,
    plannedProgress: originalActivity.plannedProgress,
    actualProgress: originalActivity.actualProgress,
    ac: originalActivity.ac,
  });
  assert.equal(activityResult.ok, true);

  const projectResult = await application.replaceProject(1, {
    name: before.project.name,
    cutoffDate: "2026-07-31",
  });
  assert.equal(projectResult.ok, true);

  const after = await application.getProjectAnalysis(1);
  assert.ok(after);
  const renamedActivity = after.activities[0];
  assert.ok(renamedActivity);
  assert.deepEqual(indicators(renamedActivity), indicators(originalActivity));
  assert.deepEqual(after.summary, before.summary);
});
