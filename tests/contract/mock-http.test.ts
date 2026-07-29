import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const baseUrl = "http://127.0.0.1:3100";
const mockPrefix = "/mock-api";

type JsonObject = { [key: string]: JsonValue };
type JsonValue = JsonObject | JsonValue[] | boolean | number | string | null;

const fixture = JSON.parse(
  readFileSync("contracts/evm/evm-fixture.json", "utf8"),
) as JsonObject;

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

function assertContainsNoFixtureMetadata(value: JsonValue): void {
  if (Array.isArray(value)) {
    value.forEach(assertContainsNoFixtureMetadata);
    return;
  }

  if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      assert.equal(key.startsWith("$"), false);
      assertContainsNoFixtureMetadata(child);
    }
  }
}

async function getJson(
  pathname: string,
  headers?: Record<string, string>,
): Promise<{ body: JsonValue; status: number }> {
  const response = await fetch(`${baseUrl}${pathname}`, { headers });
  const expectedMockInstance = process.env.MOCK_INSTANCE_ID;

  assert.ok(expectedMockInstance);
  assert.equal(
    response.headers.get("x-mock-instance"),
    expectedMockInstance,
  );

  return {
    body: (await response.json()) as JsonValue,
    status: response.status,
  };
}

test("GET /mock-api/projects serves the fixture collection", async () => {
  const response = await getJson(`${mockPrefix}/projects`);
  const expected = fixture.collectionResponse as JsonObject;

  assert.equal(response.status, expected.expectedStatus);
  assert.deepEqual(response.body, expected.expectedBody);
});

test("GET /mock-api/projects/1 serves the stripped fixture project", async () => {
  const response = await getJson(`${mockPrefix}/projects/1`);
  const expectedBody = stripFixtureMetadata(fixture.readResponse);
  const expectedStatus = (
    (fixture.successResponses as JsonObject).getProject as JsonObject
  ).expectedStatus;

  assert.equal(response.status, expectedStatus);
  assert.deepEqual(response.body, expectedBody);
  assertContainsNoFixtureMetadata(response.body);
});

test("GET /mock-api/projects/2 serves the stripped empty fixture project", async () => {
  const response = await getJson(`${mockPrefix}/projects/2`);
  const expectedBody = stripFixtureMetadata(fixture.emptyProject);
  const expectedStatus = (
    (fixture.successResponses as JsonObject).getProject as JsonObject
  ).expectedStatus;

  assert.equal(response.status, expectedStatus);
  assert.deepEqual(response.body, expectedBody);
  assertContainsNoFixtureMetadata(response.body);
});

test("GET /mock-api/projects/:projectId serves the fixture not-found error for an unknown id", async () => {
  const response = await getJson(`${mockPrefix}/projects/999`);
  const expected = (fixture.errorEnvelopes as JsonObject)
    .notFound as JsonObject;

  assert.equal(response.status, expected.expectedStatus);
  assert.deepEqual(response.body, expected.expectedBody);
});

for (const scenario of [
  "malformedRequest",
  "notFound",
  "validationFailed",
]) {
  test(`x-mock-scenario=${scenario} serves its fixture error`, async () => {
    const response = await getJson(`${mockPrefix}/projects`, {
      "x-mock-scenario": scenario,
    });
    const expected = ((fixture.errorEnvelopes as JsonObject)[
      scenario
    ]) as JsonObject;

    assert.equal(response.status, expected.expectedStatus);
    assert.deepEqual(response.body, expected.expectedBody);
  });
}
