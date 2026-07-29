import assert from "node:assert/strict";
import { test } from "node:test";

import { ActivitiesChart, axisLabel } from "../../src/ui/activities-chart";
import { occurrences, renderMarkup, visibleText } from "./render";
import { emptyAnalysis, referenceAnalysis } from "./simulated-api";

const activities = referenceAnalysis.activities;
const markup = renderMarkup(<ActivitiesChart activities={activities} />);

test("the chart identifies the PV, EV and AC series", () => {
  const legend = visibleText(markup);

  for (const series of ["PV", "EV", "AC"]) {
    assert.ok(legend.includes(series), `Expected the ${series} series`);
  }

  assert.equal(occurrences(markup, 'class="recharts-legend-item '), 3);
});

test("the chart presents three values per activity", () => {
  assert.equal(occurrences(markup, 'recharts-bar-rectangle"'), 24);
  assert.equal(occurrences(markup, 'recharts-layer recharts-bar"'), 3);
  assert.equal(activities.length, 8);
});

test("each activity is identified on the axis by its name", () => {
  const axis = visibleText(markup);

  for (const activity of activities) {
    assert.ok(
      axis.includes(axisLabel(activity.name)),
      `Expected the name of activity ${String(activity.id)} on the axis`,
    );
  }
});

test("a truncated label still tells the activities apart", () => {
  const labels = activities.map((activity) => axisLabel(activity.name));

  assert.equal(new Set(labels).size, activities.length);
});

test("a short name reaches the axis whole and a long one is truncated", () => {
  assert.equal(axisLabel("Cimentación"), "Cimentación");

  const long = "Actividad".repeat(10);
  const truncated = axisLabel(long);

  assert.ok(truncated.length < long.length);
  assert.ok(truncated.endsWith("…"));
  assert.ok(long.startsWith(truncated.slice(0, -1)));
});

test("a project without activities renders no bars and does not fail", () => {
  const empty = renderMarkup(
    <ActivitiesChart activities={emptyAnalysis.activities} />,
  );

  assert.equal(occurrences(empty, 'recharts-bar-rectangle"'), 0);
});
