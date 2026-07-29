import assert from "node:assert/strict";
import { test } from "node:test";

import type { ActivityWrite, ProjectWrite } from "../../src/shared/contract";
import {
  EvmApiError,
  createActivity,
  createProject,
  deleteActivity,
  deleteProject,
  fetchProjectAnalysis,
  fetchProjectList,
  replaceActivity,
  replaceProject,
} from "../../src/ui/evm-api-client";
import {
  createSimulatedApi,
  emptyAnalysis,
  errorEnvelope,
  projectCollection,
  referenceActivity,
  referenceAnalysis,
  referenceProject,
  validationCase,
} from "./simulated-api";

const activityWrite: ActivityWrite = {
  ac: 500,
  actualProgress: 40,
  bac: 1000,
  name: "Actividad nueva",
  plannedProgress: 50,
};

const projectWrite: ProjectWrite = {
  cutoffDate: "2026-06-30",
  name: "Proyecto nuevo",
};

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

/**
 * ADR-006a: rutas anidadas y dos `PUT` de reemplazo. `successResponses` fija el
 * estado y la forma de cada respuesta, y el borrado no devuelve cuerpo.
 */
test("the six writes reach their published verb and route", async () => {
  const api = createSimulatedApi();

  const createdProject = await createProject(projectWrite, api.fetch);
  const replacedProject = await replaceProject(1, projectWrite, api.fetch);
  const createdActivity = await createActivity(1, activityWrite, api.fetch);
  const replacedActivity = await replaceActivity(
    1,
    3,
    activityWrite,
    api.fetch,
  );
  const deletedActivity = await deleteActivity(1, 3, api.fetch);
  const deletedProject = await deleteProject(1, api.fetch);

  assert.deepEqual(
    api.calls.map((call) => `${call.method} ${call.path}`),
    [
      "POST /mock-api/projects",
      "PUT /mock-api/projects/1",
      "POST /mock-api/projects/1/activities",
      "PUT /mock-api/projects/1/activities/3",
      "DELETE /mock-api/projects/1/activities/3",
      "DELETE /mock-api/projects/1",
    ],
  );
  assert.deepEqual(
    api.calls.map((call) => call.body),
    [
      projectWrite,
      projectWrite,
      activityWrite,
      activityWrite,
      undefined,
      undefined,
    ],
  );
  assert.deepEqual(createdProject, referenceProject);
  assert.deepEqual(replacedProject, referenceProject);
  assert.deepEqual(createdActivity, referenceActivity);
  assert.deepEqual(replacedActivity, referenceActivity);
  assert.equal(deletedActivity, undefined);
  assert.equal(deletedProject, undefined);
});

/** ADR-009: el consumidor necesita `code` y `rule`, no el texto. */
test("a rejected write carries the envelope violations", async () => {
  const expected = validationCase("V9");
  const api = createSimulatedApi({ writeFailure: "V9" });

  const failure = await createActivity(1, activityWrite, api.fetch).then(
    () => undefined,
    (error: unknown) => error,
  );

  assert.ok(failure instanceof EvmApiError);
  assert.equal(failure.status, expected.status);
  assert.equal(failure.code, expected.body.code);
  assert.deepEqual(
    [...failure.violations].map((violation) => violation.rule).sort(),
    [...expected.body.violations].map((violation) => violation.rule).sort(),
  );
});

test("a read failure carries no violations", async () => {
  const api = createSimulatedApi({ failWithScenario: "notFound" });

  const failure = await fetchProjectAnalysis(1, api.fetch).then(
    () => undefined,
    (error: unknown) => error,
  );

  assert.ok(failure instanceof EvmApiError);
  assert.deepEqual(failure.violations, []);
});

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
