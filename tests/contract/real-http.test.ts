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
