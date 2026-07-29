import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import type {
  ActivityRecord,
  ProjectRecord,
} from "@/application/evm-repository";
import { Decimal } from "@/domain/decimal";
import { createDatabase } from "@/infrastructure/database/client";
import { DrizzleEvmRepository } from "@/infrastructure/database/drizzle-evm-repository";

import { createIntegrationDatabaseLock } from "./database-lock";

type NewProjectRecord = Omit<ProjectRecord, "id">;
type NewActivityRecord = Omit<ActivityRecord, "id">;

type ExpandedRepository = {
  createProject(input: NewProjectRecord): Promise<ProjectRecord>;
  findProject(id: number): Promise<ProjectRecord | null>;
  listProjects(): Promise<readonly ProjectRecord[]>;
  replaceProject(
    id: number,
    input: NewProjectRecord,
  ): Promise<ProjectRecord | null>;
  deleteProject(id: number): Promise<boolean>;
  createActivity(input: NewActivityRecord): Promise<ActivityRecord>;
  findActivity(projectId: number, id: number): Promise<ActivityRecord | null>;
  listActivities(projectId: number): Promise<readonly ActivityRecord[]>;
  replaceActivity(
    projectId: number,
    id: number,
    input: NewActivityRecord,
  ): Promise<ActivityRecord | null>;
  deleteActivity(projectId: number, id: number): Promise<boolean>;
};

const databaseUrl =
  process.env.DATABASE_URL ?? "postgres://evm:evm@127.0.0.1:5432/evm";
const { db, pool } = createDatabase(databaseUrl);
const repository = new DrizzleEvmRepository(db);
const expandedRepository = repository as unknown as ExpandedRepository;
const createdProjectIds: number[] = [];
const databaseLock = createIntegrationDatabaseLock(pool);

before(async () => {
  await databaseLock.acquire();
});

after(async () => {
  try {
    if (createdProjectIds.length > 0) {
      await pool.query("delete from projects where id = any($1::int[])", [
        createdProjectIds,
      ]);
    }
  } finally {
    try {
      await databaseLock.release();
    } finally {
      await pool.end();
    }
  }
});

test("creates, lists, finds, replaces and deletes captured-only records", async () => {
  assert.equal(typeof expandedRepository.createProject, "function");

  const project = await expandedRepository.createProject({
    name: "Proyecto CRUD de aplicación",
    cutoffDate: "2026-07-29",
  });
  createdProjectIds.push(project.id);

  const activity = await expandedRepository.createActivity({
    projectId: project.id,
    name: "Actividad CRUD de aplicación",
    bac: new Decimal("1000"),
    plannedProgress: new Decimal("50"),
    actualProgress: new Decimal("40"),
    ac: new Decimal("500"),
  });

  assert.deepEqual(
    (await expandedRepository.listProjects()).find(
      (candidate) => candidate.id === project.id,
    ),
    project,
  );
  assert.equal(
    (await expandedRepository.findActivity(project.id, activity.id))?.bac.eq(
      "1000",
    ),
    true,
  );

  const replaced = await expandedRepository.replaceActivity(
    project.id,
    activity.id,
    {
      projectId: project.id,
      name: "Actividad renombrada",
      bac: activity.bac,
      plannedProgress: activity.plannedProgress,
      actualProgress: activity.actualProgress,
      ac: activity.ac,
    },
  );
  assert.equal(replaced?.name, "Actividad renombrada");
  assert.equal(
    await expandedRepository.deleteActivity(project.id, activity.id),
    true,
  );
});

test("finds, replaces and deletes the single current project photo", async () => {
  assert.equal(typeof expandedRepository.findProject, "function");

  const project = await expandedRepository.createProject({
    name: "Proyecto de ciclo de vida",
    cutoffDate: "2026-07-29",
  });
  createdProjectIds.push(project.id);

  const first = await expandedRepository.createActivity({
    projectId: project.id,
    name: "Primera hermana",
    bac: new Decimal("10"),
    plannedProgress: new Decimal("10"),
    actualProgress: new Decimal("10"),
    ac: new Decimal("10"),
  });
  const second = await expandedRepository.createActivity({
    projectId: project.id,
    name: "Segunda hermana",
    bac: new Decimal("20"),
    plannedProgress: new Decimal("20"),
    actualProgress: new Decimal("20"),
    ac: new Decimal("20"),
  });

  assert.equal((await expandedRepository.findProject(project.id))?.name, project.name);
  assert.deepEqual(
    (await expandedRepository.listActivities(project.id)).map(({ id }) => id),
    [first.id, second.id],
  );
  assert.equal(
    (
      await expandedRepository.replaceProject(project.id, {
        name: "Proyecto reemplazado",
        cutoffDate: "2026-08-01",
      })
    )?.cutoffDate,
    "2026-08-01",
  );
  assert.equal(await expandedRepository.deleteProject(project.id), true);
  assert.equal(await expandedRepository.findProject(project.id), null);
});

test("cascades project deletion, preserves siblings and rolls back a failed cascade", async () => {
  const siblingProject = await expandedRepository.createProject({
    name: "Proyecto de hermanas",
    cutoffDate: "2026-07-29",
  });
  createdProjectIds.push(siblingProject.id);
  const firstSibling = await expandedRepository.createActivity({
    projectId: siblingProject.id,
    name: "Primera hermana",
    bac: new Decimal("10"),
    plannedProgress: new Decimal("10"),
    actualProgress: new Decimal("10"),
    ac: new Decimal("10"),
  });
  const secondSibling = await expandedRepository.createActivity({
    projectId: siblingProject.id,
    name: "Segunda hermana",
    bac: new Decimal("20"),
    plannedProgress: new Decimal("20"),
    actualProgress: new Decimal("20"),
    ac: new Decimal("20"),
  });

  assert.equal(
    await expandedRepository.deleteActivity(
      siblingProject.id,
      firstSibling.id,
    ),
    true,
  );
  assert.deepEqual(
    (await expandedRepository.listActivities(siblingProject.id)).map(
      ({ id }) => id,
    ),
    [secondSibling.id],
  );

  const cascadeProject = await expandedRepository.createProject({
    name: "Proyecto de cascada",
    cutoffDate: "2026-07-29",
  });
  const firstCascade = await expandedRepository.createActivity({
    projectId: cascadeProject.id,
    name: "Primera en cascada",
    bac: new Decimal("10"),
    plannedProgress: new Decimal("10"),
    actualProgress: new Decimal("10"),
    ac: new Decimal("10"),
  });
  const secondCascade = await expandedRepository.createActivity({
    projectId: cascadeProject.id,
    name: "Segunda en cascada",
    bac: new Decimal("20"),
    plannedProgress: new Decimal("20"),
    actualProgress: new Decimal("20"),
    ac: new Decimal("20"),
  });

  assert.equal(await expandedRepository.deleteProject(cascadeProject.id), true);
  assert.equal(await expandedRepository.findProject(cascadeProject.id), null);
  assert.deepEqual(
    await expandedRepository.listActivities(cascadeProject.id),
    [],
  );

  const rollbackProject = await expandedRepository.createProject({
    name: "Proyecto de reversión",
    cutoffDate: "2026-07-29",
  });
  createdProjectIds.push(rollbackProject.id);
  const firstRollback = await expandedRepository.createActivity({
    projectId: rollbackProject.id,
    name: "Primera a revertir",
    bac: new Decimal("10"),
    plannedProgress: new Decimal("10"),
    actualProgress: new Decimal("10"),
    ac: new Decimal("10"),
  });
  const secondRollback = await expandedRepository.createActivity({
    projectId: rollbackProject.id,
    name: "Segunda a revertir",
    bac: new Decimal("20"),
    plannedProgress: new Decimal("20"),
    actualProgress: new Decimal("20"),
    ac: new Decimal("20"),
  });

  await pool.query(`
    create function fail_slice_a1_cascade()
    returns trigger
    language plpgsql
    as $$
    begin
      raise exception 'forced cascade failure';
    end;
    $$;
  `);
  await pool.query(`
    create trigger fail_slice_a1_cascade
    before delete on activities
    for each row
    execute function fail_slice_a1_cascade();
  `);

  try {
    await assert.rejects(
      expandedRepository.deleteProject(rollbackProject.id),
    );
    assert.ok(await expandedRepository.findProject(rollbackProject.id));
    assert.deepEqual(
      (await expandedRepository.listActivities(rollbackProject.id)).map(
        ({ id }) => id,
      ),
      [firstRollback.id, secondRollback.id],
    );
  } finally {
    await pool.query(
      "drop trigger if exists fail_slice_a1_cascade on activities",
    );
    await pool.query("drop function if exists fail_slice_a1_cascade()");
  }
});

test("stores only the project and captured activity model", async () => {
  const projectColumns = await pool.query<{ column_name: string }>(
    `
      select column_name
      from information_schema.columns
      where table_schema = 'public' and table_name = 'projects'
      order by ordinal_position
    `,
  );
  const activityColumns = await pool.query<{ column_name: string }>(
    `
      select column_name
      from information_schema.columns
      where table_schema = 'public' and table_name = 'activities'
      order by ordinal_position
    `,
  );

  assert.deepEqual(
    projectColumns.rows.map(({ column_name }) => column_name),
    ["id", "name", "cutoff_date"],
  );
  assert.deepEqual(
    activityColumns.rows.map(({ column_name }) => column_name),
    [
      "id",
      "project_id",
      "name",
      "bac",
      "planned_progress",
      "actual_progress",
      "ac",
    ],
  );
});
