import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, test } from "node:test";

import { getProjectAnalysis } from "@/application/evm-analysis";
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

const fixture = JSON.parse(
  readFileSync(
    new URL(
      "../../contracts/evm/evm-fixture.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as { readResponse: JsonValue; emptyProject: JsonValue };

const databaseUrl =
  process.env.DATABASE_URL ?? "postgres://evm:evm@127.0.0.1:5432/evm";
const { db, pool } = createDatabase(databaseUrl);
const repository = new DrizzleEvmRepository(db);

after(async () => {
  await pool.end();
});

test("materializes reference analysis from persisted captured values", async () => {
  await seedFixture(db);

  const analysis = await getProjectAnalysis(repository, 1);

  assert.deepEqual(analysis, stripFixtureMetadata(fixture.readResponse));
  assert.notEqual((analysis as ProjectAnalysis).summary.cpi.value, null);
});

test("materializes the empty project analysis from the domain result", async () => {
  await seedFixture(db);

  const analysis = await getProjectAnalysis(repository, 2);

  assert.deepEqual(analysis, stripFixtureMetadata(fixture.emptyProject));
});
