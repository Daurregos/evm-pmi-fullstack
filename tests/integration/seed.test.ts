import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { createDatabase } from "@/infrastructure/database/client";
import { seedFixture } from "@/infrastructure/database/seed";

const databaseUrl =
  process.env.DATABASE_URL ?? "postgres://evm:evm@127.0.0.1:5432/evm";
const { db, pool } = createDatabase(databaseUrl);

before(async () => {
  await pool.query("delete from projects where id in (1, 2)");
});

after(async () => {
  await pool.end();
});

test("seeds the two fixture projects and eight captured-only activities idempotently", async () => {
  await seedFixture(db);
  await seedFixture(db);

  const projectCount = await pool.query<{ count: string }>(
    "select count(*) from projects where id in (1, 2)",
  );
  const activityCount = await pool.query<{ count: string }>(
    "select count(*) from activities where project_id = 1",
  );
  assert.equal(projectCount.rows[0]?.count, "2");
  assert.equal(activityCount.rows[0]?.count, "8");

  const columns = await pool.query<{ column_name: string }>(
    `select column_name
       from information_schema.columns
      where table_schema = 'public' and table_name = 'activities'
      order by ordinal_position`,
  );
  assert.deepEqual(
    columns.rows.map(({ column_name }) => column_name),
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

  const firstActivity = await pool.query<{
    name: string;
    bac: string;
    planned_progress: string;
    actual_progress: string;
    ac: string;
  }>(
    `select name, bac, planned_progress, actual_progress, ac
       from activities
      where id = 1`,
  );
  assert.deepEqual(firstActivity.rows[0], {
    name: "Actividad con avance y costo, favorable",
    bac: "10000.000000000000000000",
    planned_progress: "40.000000000000000000",
    actual_progress: "50.000000000000000000",
    ac: "4000.000000000000000000",
  });
});
