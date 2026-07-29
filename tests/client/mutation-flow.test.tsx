import assert from "node:assert/strict";
import { test } from "node:test";

import {
  ACTIVITY_FORM_FIELDS,
  activityFormOf,
  blankActivityForm,
  withActivityValue,
} from "../../src/ui/activity-form-state";
import {
  createActivityPlan,
  createProjectPlan,
  deleteActivityPlan,
  deleteProjectPlan,
  replaceActivityPlan,
  replaceProjectPlan,
} from "../../src/ui/dashboard-mutations";
import { applyMutation, retryRefresh } from "../../src/ui/mutation-flow";
import { projectFormOf } from "../../src/ui/project-form-state";
import {
  createSimulatedApi,
  emptyAnalysis,
  projectCollection,
  referenceActivity,
  referenceAnalysis,
  referenceProject,
} from "./simulated-api";

const filled = activityFormOf(referenceActivity);

function verbs(api: { readonly calls: readonly { method: string }[] }): string[] {
  return api.calls.map((call) => call.method);
}

function trace(
  api: { readonly calls: readonly { method: string; path: string }[] },
): string[] {
  return api.calls.map((call) => `${call.method} ${call.path}`);
}

/**
 * Primera comprobación de cliente de ADR-007 y criterio de RF-03: el recálculo
 * ocurre al confirmar, no durante la digitación. La digitación solo cambia
 * estado local.
 */
test("typing issues no request", async () => {
  const api = createSimulatedApi();
  let values = blankActivityForm();

  for (const field of ACTIVITY_FORM_FIELDS) {
    values = withActivityValue(values, field, "1");
    values = withActivityValue(values, field, "12");
    values = withActivityValue(values, field, "12.5");
  }

  assert.deepEqual(api.calls, []);

  const outcome = await applyMutation(createActivityPlan(1, values, api.fetch));

  assert.equal(outcome.kind, "applied");
  assert.deepEqual(verbs(api), ["POST", "GET"]);
});

/**
 * Segunda comprobación: una mutación rechazada no refresca la foto y una
 * exitosa sí. El rechazo conserva el estado previo, así que no hay nada que
 * releer.
 */
test("a rejected mutation asks for no read", async () => {
  const api = createSimulatedApi({ writeFailure: "V4" });

  const outcome = await applyMutation(createActivityPlan(1, filled, api.fetch));

  assert.equal(outcome.kind, "rejected");
  assert.deepEqual(verbs(api), ["POST"]);
});

test("a successful mutation refreshes from a single read", async () => {
  const moved: typeof referenceAnalysis = {
    ...referenceAnalysis,
    summary: { ...referenceAnalysis.summary, bac: 12345.678 },
  };
  const api = createSimulatedApi({ analysisAfterWrite: moved });

  const outcome = await applyMutation(createActivityPlan(1, filled, api.fetch));

  assert.equal(outcome.kind, "applied");
  assert.deepEqual(trace(api), [
    "POST /mock-api/projects/1/activities",
    "GET /mock-api/projects/1",
  ]);
  assert.ok(outcome.kind === "applied");
  assert.deepEqual(outcome.patch.analysis, moved);
});

/**
 * Tercera comprobación, la que más se implementa mal: si la escritura tuvo éxito
 * y falló la lectura, el cambio permanece guardado y solo la lectura se
 * reintenta. Repetir la escritura duplicaría la actividad.
 */
test("a failed refresh is retried without repeating the write", async () => {
  const api = createSimulatedApi({ failingReads: 1 });

  const stale = await applyMutation(createActivityPlan(1, filled, api.fetch));

  assert.equal(stale.kind, "stale");
  assert.ok(stale.kind === "stale");
  assert.deepEqual(verbs(api), ["POST", "GET"]);

  const retried = await retryRefresh(stale);

  assert.equal(retried.kind, "applied");
  assert.deepEqual(verbs(api), ["POST", "GET", "GET"]);
  assert.equal(
    api.calls.filter((call) => call.method === "POST").length,
    1,
    "the write must not be repeated",
  );
});

test("a refresh that keeps failing stays stale and still holds only the read", async () => {
  const api = createSimulatedApi({ failingReads: 2 });

  const first = await applyMutation(replaceActivityPlan(1, 3, filled, api.fetch));
  assert.ok(first.kind === "stale");

  const second = await retryRefresh(first);
  assert.equal(second.kind, "stale");
  assert.deepEqual(verbs(api), ["PUT", "GET", "GET"]);

  assert.ok(second.kind === "stale");
  const third = await retryRefresh(second);
  assert.equal(third.kind, "applied");
  assert.equal(api.calls.filter((call) => call.method === "PUT").length, 1);
});

test("editing an activity replaces the five fields and reads once", async () => {
  const api = createSimulatedApi();

  await applyMutation(replaceActivityPlan(1, 3, filled, api.fetch));

  assert.deepEqual(trace(api), [
    "PUT /mock-api/projects/1/activities/3",
    "GET /mock-api/projects/1",
  ]);
  assert.deepEqual(api.calls[0].body, {
    ac: referenceActivity.ac,
    actualProgress: referenceActivity.actualProgress,
    bac: referenceActivity.bac,
    name: referenceActivity.name,
    plannedProgress: referenceActivity.plannedProgress,
  });
});

test("deleting an activity reads the project once", async () => {
  const api = createSimulatedApi();

  await applyMutation(deleteActivityPlan(1, 3, api.fetch));

  assert.deepEqual(trace(api), [
    "DELETE /mock-api/projects/1/activities/3",
    "GET /mock-api/projects/1",
  ]);
});

/**
 * RF-01: al eliminar el proyecto seleccionado el dashboard queda sin selección
 * aunque existan otros proyectos, y ADR-007 prohíbe pedir la foto inexistente.
 */
test("deleting the selected project leaves no selection and reads only the collection", async () => {
  const api = createSimulatedApi({
    collectionAfterWrite: [projectCollection[1]],
  });

  const outcome = await applyMutation(deleteProjectPlan(1, 1, api.fetch));

  assert.equal(outcome.kind, "applied");
  assert.deepEqual(trace(api), [
    "DELETE /mock-api/projects/1",
    "GET /mock-api/projects",
  ]);
  assert.ok(outcome.kind === "applied");
  assert.deepEqual(outcome.patch.projects, [projectCollection[1]]);
  assert.equal(outcome.patch.selectedProjectId, null);
  assert.equal(outcome.patch.analysis, null);
});

test("deleting another project keeps the selection and its analysis", async () => {
  const api = createSimulatedApi();

  const outcome = await applyMutation(deleteProjectPlan(2, 1, api.fetch));

  assert.deepEqual(trace(api), [
    "DELETE /mock-api/projects/2",
    "GET /mock-api/projects",
    "GET /mock-api/projects/1",
  ]);
  assert.ok(outcome.kind === "applied");
  assert.equal(outcome.patch.selectedProjectId, 1);
  assert.deepEqual(outcome.patch.analysis, referenceAnalysis);
});

/**
 * El cuerpo del `201` solo dice qué proyecto leer. Tabla, resumen y gráfica
 * provienen de la lectura posterior, como exige ADR-007.
 */
test("creating a project reads the collection and the created project", async () => {
  const api = createSimulatedApi({
    createdProject: { cutoffDate: "2026-06-30", id: 2, name: "Nuevo" },
  });

  const outcome = await applyMutation(
    createProjectPlan(projectFormOf(referenceProject), api.fetch),
  );

  assert.deepEqual(trace(api), [
    "POST /mock-api/projects",
    "GET /mock-api/projects",
    "GET /mock-api/projects/2",
  ]);
  assert.ok(outcome.kind === "applied");
  assert.equal(outcome.patch.selectedProjectId, 2);
  assert.deepEqual(outcome.patch.analysis, emptyAnalysis);
});

test("editing a project reads the collection and its own analysis", async () => {
  const api = createSimulatedApi();

  const outcome = await applyMutation(
    replaceProjectPlan(1, projectFormOf(referenceProject), api.fetch),
  );

  assert.deepEqual(trace(api), [
    "PUT /mock-api/projects/1",
    "GET /mock-api/projects",
    "GET /mock-api/projects/1",
  ]);
  assert.deepEqual(api.calls[0].body, {
    cutoffDate: referenceProject.cutoffDate,
    name: referenceProject.name,
  });
  assert.ok(outcome.kind === "applied");
  assert.equal(outcome.patch.selectedProjectId, 1);
});

test("a rejected project mutation reads nothing", async () => {
  const api = createSimulatedApi({ writeFailure: "V1" });

  const outcome = await applyMutation(
    replaceProjectPlan(1, projectFormOf(referenceProject), api.fetch),
  );

  assert.equal(outcome.kind, "rejected");
  assert.deepEqual(verbs(api), ["PUT"]);
});
