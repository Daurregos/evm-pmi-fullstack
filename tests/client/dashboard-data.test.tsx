import assert from "node:assert/strict";
import { test } from "node:test";

import type { ProjectAnalysis } from "../../src/shared/contract";
import { Dashboard } from "../../src/ui/dashboard";
import { loadDashboard } from "../../src/ui/dashboard-data";
import {
  attributeValues,
  elementWith,
  fieldsOf,
  renderMarkup,
  tableRows,
  visibleText,
} from "./render";
import {
  createSimulatedApi,
  emptyAnalysis,
  projectCollection,
  referenceAnalysis,
} from "./simulated-api";

test("the initial load reads the collection and the first project", async () => {
  const api = createSimulatedApi();

  const snapshot = await loadDashboard(api.fetch);

  assert.deepEqual(snapshot.projects, projectCollection);
  assert.equal(snapshot.selectedProjectId, projectCollection[0].id);
  assert.deepEqual(snapshot.analysis, referenceAnalysis);
  assert.deepEqual(api.requests, ["/mock-api/projects", "/mock-api/projects/1"]);
});

test("an empty collection leaves no project selected and asks for no analysis", async () => {
  const api = createSimulatedApi({ collection: [] });

  const snapshot = await loadDashboard(api.fetch);

  assert.deepEqual(snapshot.projects, []);
  assert.equal(snapshot.selectedProjectId, null);
  assert.equal(snapshot.analysis, null);
  assert.deepEqual(api.requests, ["/mock-api/projects"]);
});

test("a project without activities loads like any other", async () => {
  const api = createSimulatedApi({
    collection: [projectCollection[1]],
  });

  const snapshot = await loadDashboard(api.fetch);

  assert.equal(snapshot.selectedProjectId, 2);
  assert.deepEqual(snapshot.analysis, emptyAnalysis);
});

/**
 * Carga centinela: los cinco datos capturados de la actividad 1 y del proyecto
 * no cambian, pero los indicadores sí. Si el cliente derivara o conservara
 * indicadores, mostraría los del fixture en lugar de los servidos.
 */
const sentinelAnalysis: ProjectAnalysis = {
  ...referenceAnalysis,
  activities: [
    {
      ...referenceAnalysis.activities[0],
      cpi: {
        display: "7,77",
        label: "centinela de actividad",
        status: "unfavorable",
        value: 7.77,
      },
      pv: 12345.678,
    },
    ...referenceAnalysis.activities.slice(1),
  ],
  summary: {
    ...referenceAnalysis.summary,
    bac: 98765.432,
    cpi: {
      display: "9,99",
      label: "centinela de costo",
      status: "favorable",
      value: 9.99,
    },
    progress: 12.7,
  },
};

test("the view shows the indicators the API served, not derived ones", async () => {
  const api = createSimulatedApi({
    analysisByProjectId: { 1: sentinelAnalysis },
    collection: [projectCollection[0]],
  });

  const snapshot = await loadDashboard(api.fetch);
  assert.ok(snapshot.analysis);
  const markup = renderMarkup(<Dashboard analysis={snapshot.analysis} />);

  const cost = elementWith(markup, "data-verdict", "cost", "article");
  assert.ok(visibleText(cost).includes("9,99"));
  assert.ok(visibleText(cost).includes("centinela de costo"));
  assert.deepEqual(attributeValues(cost, "data-status"), ["favorable"]);

  const fields = fieldsOf(markup);
  assert.equal(visibleText(fields.bac), "98.765,43");
  assert.equal(visibleText(fields.progress), "13 %");

  const [firstRow] = tableRows(markup);
  assert.equal(visibleText(firstRow.cells.pv), "12.345,68");
  assert.ok(visibleText(firstRow.cells.cpi).includes("7,77"));
  assert.ok(
    visibleText(firstRow.cells.cpi).includes("centinela de actividad"),
  );
});

test("the sentinel keeps the captured data of the fixture", () => {
  const original = referenceAnalysis.activities[0];
  const sentinel = sentinelAnalysis.activities[0];

  assert.equal(sentinel.bac, original.bac);
  assert.equal(sentinel.plannedProgress, original.plannedProgress);
  assert.equal(sentinel.actualProgress, original.actualProgress);
  assert.equal(sentinel.ac, original.ac);
  assert.notEqual(sentinel.cpi.display, original.cpi.display);
});

test("a failed read surfaces instead of showing the previous project", async () => {
  const api = createSimulatedApi({ failWithScenario: "notFound" });

  const failure = await loadDashboard(api.fetch).then(
    () => undefined,
    (error: unknown) => error,
  );

  assert.ok(failure instanceof Error);
  assert.ok(failure.message.length > 0);
});
