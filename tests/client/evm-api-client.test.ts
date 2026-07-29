import assert from "node:assert/strict";
import { test } from "node:test";

import {
  EvmApiError,
  fetchProjectAnalysis,
  fetchProjectList,
} from "../../src/ui/evm-api-client";
import {
  createSimulatedApi,
  emptyAnalysis,
  errorEnvelope,
  projectCollection,
  referenceAnalysis,
} from "./simulated-api";

test("the project list comes from the collection resource", async () => {
  const api = createSimulatedApi();

  const projects = await fetchProjectList(api.fetch);

  assert.deepEqual(projects, projectCollection);
  assert.deepEqual(api.requests, ["/mock-api/projects"]);
});

test("a single read supplies project, activities and summary", async () => {
  const api = createSimulatedApi();

  const analysis = await fetchProjectAnalysis(1, api.fetch);

  assert.deepEqual(analysis, referenceAnalysis);
  assert.deepEqual(api.requests, ["/mock-api/projects/1"]);
});

test("the empty project is read through the same resource", async () => {
  const api = createSimulatedApi();

  const analysis = await fetchProjectAnalysis(2, api.fetch);

  assert.deepEqual(analysis, emptyAnalysis);
});

test("the configured base replaces the mock prefix", async () => {
  const api = createSimulatedApi();

  await fetchProjectList(api.fetch, "https://api.example.test/v1/");
  await fetchProjectAnalysis(1, api.fetch, "https://api.example.test/v1/");

  assert.deepEqual(api.requests, [
    "https://api.example.test/v1/projects",
    "https://api.example.test/v1/projects/1",
  ]);
});

for (const scenario of ["notFound", "malformedRequest", "validationFailed"]) {
  test(`the ${scenario} envelope surfaces as a reportable failure`, async () => {
    const api = createSimulatedApi({ failWithScenario: scenario });
    const expected = errorEnvelope(scenario);

    const failure = await fetchProjectAnalysis(1, api.fetch).then(
      () => undefined,
      (error: unknown) => error,
    );

    assert.ok(failure instanceof EvmApiError);
    assert.equal(failure.status, expected.status);
    assert.equal(failure.code, expected.body.code);
    assert.equal(failure.message, expected.body.message);
  });
}

test("a transport failure without an envelope is still reportable", async () => {
  const failure = await fetchProjectList(() =>
    Promise.resolve(new Response("<html>502</html>", { status: 502 })),
  ).then(
    () => undefined,
    (error: unknown) => error,
  );

  assert.ok(failure instanceof EvmApiError);
  assert.equal(failure.status, 502);
  assert.equal(failure.code, undefined);
  assert.ok(failure.message.length > 0);
});
