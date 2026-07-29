import assert from "node:assert/strict";
import { test } from "node:test";

import { Dashboard } from "../../src/ui/dashboard";
import { ProjectSelector } from "../../src/ui/project-selector";
import { ABSENT_VALUE } from "../../src/ui/format";
import {
  attributeValues,
  elementWith,
  fieldsOf,
  occurrences,
  renderMarkup,
  tableRows,
  visibleText,
} from "./render";
import { emptyAnalysis, projectCollection, referenceAnalysis } from "./simulated-api";

const reference = renderMarkup(<Dashboard analysis={referenceAnalysis} />);
const empty = renderMarkup(<Dashboard analysis={emptyAnalysis} />);

test("the dashboard states which project and cutoff date it reads", () => {
  const text = visibleText(reference);

  assert.ok(text.includes(referenceAnalysis.project.name));
  assert.ok(text.includes(referenceAnalysis.project.cutoffDate));
});

test("one read feeds verdict, summary, chart and table", () => {
  assert.ok(reference.includes('data-verdict="cost"'));
  assert.ok(reference.includes('data-verdict="schedule"'));
  assert.equal(Object.keys(fieldsOf(reference)).length, 12);
  assert.equal(occurrences(reference, 'recharts-bar-rectangle"'), 24);
  assert.equal(tableRows(reference).length, referenceAnalysis.activities.length);
});

test("the empty project reports the absence of activities", () => {
  const text = visibleText(empty);

  assert.equal(emptyAnalysis.activities.length, 0);
  assert.ok(empty.includes('data-empty-project="true"'));
  assert.ok(text.toLowerCase().includes("sin actividades"));
  assert.equal(tableRows(empty).length, 0);
});

test("the empty project shows zeroed magnitudes and non-evaluable indexes", () => {
  const fields = fieldsOf(empty);

  assert.equal(visibleText(fields.bac), "0,00");
  assert.equal(visibleText(fields.pv), "0,00");
  assert.equal(visibleText(fields.ev), "0,00");
  assert.equal(visibleText(fields.ac), "0,00");
  assert.equal(visibleText(fields.eac), ABSENT_VALUE);
  assert.equal(visibleText(fields.vac), ABSENT_VALUE);
  assert.equal(visibleText(fields.progress), ABSENT_VALUE);
  assert.equal(visibleText(fields.activitiesWithEvAndZeroAc), "0");
  assert.deepEqual(attributeValues(fields.cpi, "data-status"), [
    "not_evaluable",
  ]);
  assert.deepEqual(attributeValues(fields.spi, "data-status"), [
    "not_evaluable",
  ]);
});

test("the empty project keeps its verdict cards without claiming a diagnosis", () => {
  const cost = elementWith(empty, "data-verdict", "cost", "article");

  assert.deepEqual(attributeValues(cost, "data-status"), ["not_evaluable"]);
  assert.ok(visibleText(cost).includes(ABSENT_VALUE));
  assert.ok(visibleText(cost).includes("no evaluable"));
});

test("the selector offers one option per project in the collection", () => {
  const markup = renderMarkup(
    <ProjectSelector
      onSelectProject={() => undefined}
      projects={projectCollection}
      selectedProjectId={2}
    />,
  );

  assert.equal(occurrences(markup, "<option"), projectCollection.length);
  assert.deepEqual(
    attributeValues(markup, "value"),
    projectCollection.map((project) => String(project.id)),
  );

  for (const project of projectCollection) {
    assert.ok(visibleText(markup).includes(project.name));
  }

  assert.ok(markup.includes('selected=""') || markup.includes("selected"));
});

test("the selector without projects reports it instead of failing", () => {
  const markup = renderMarkup(
    <ProjectSelector
      onSelectProject={() => undefined}
      projects={[]}
      selectedProjectId={null}
    />,
  );

  assert.equal(occurrences(markup, "<option"), 1);
  assert.ok(visibleText(markup).toLowerCase().includes("no hay proyectos"));
});
