import assert from "node:assert/strict";
import { after, test } from "node:test";

import { Decimal } from "@/domain/decimal";
import { createDatabase } from "@/infrastructure/database/client";
import { DrizzleEvmRepository } from "@/infrastructure/database/drizzle-evm-repository";

const projectId = 2_000_000_004;
const activityId = 2_000_000_004;
const originalBac = new Decimal("987654321012345678.123456789012345678");
const plannedProgress = new Decimal("0.123456789012345678");
const actualProgress = new Decimal("0.876543210987654321");
const ac = new Decimal("123456789012345678.987654321098765432");
const databaseUrl =
  process.env.DATABASE_URL ?? "postgres://evm:evm@127.0.0.1:5432/evm";
const { db, pool } = createDatabase(databaseUrl);
const repository = new DrizzleEvmRepository(db);

after(async () => {
  try {
    await pool.query("delete from projects where id = $1", [projectId]);
  } finally {
    await pool.end();
  }
});

test("preserves an 18-place numeric and reconstructs Decimal without rounding", async () => {
  await pool.query("delete from projects where id = $1", [projectId]);

  await repository.saveProject({
    id: projectId,
    name: "Prueba de ida y vuelta decimal",
    cutoffDate: "2026-07-28",
  });
  await repository.saveActivity({
    id: activityId,
    projectId,
    name: "Actividad de precisión",
    bac: originalBac,
    plannedProgress,
    actualProgress,
    ac,
  });

  const rawResult = await pool.query<{ bac: string }>(
    "select bac from activities where id = $1",
    [activityId],
  );
  assert.equal(rawResult.rows[0]?.bac, originalBac.toString());

  const reconstructed = await repository.findActivity(activityId);
  assert.ok(reconstructed);
  assert.equal(reconstructed.bac.eq(originalBac), true);
  assert.equal(reconstructed.plannedProgress.eq(plannedProgress), true);
  assert.equal(reconstructed.actualProgress.eq(actualProgress), true);
  assert.equal(reconstructed.ac.eq(ac), true);
});
