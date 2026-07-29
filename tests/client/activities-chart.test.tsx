import assert from "node:assert/strict";
import { test } from "node:test";

import { ActivitiesChart } from "../../src/ui/activities-chart";
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

test("each activity is identified on the category axis", () => {
  const axis = visibleText(markup);

  for (const activity of activities) {
    assert.ok(
      axis.includes(String(activity.id)),
      `Expected activity ${String(activity.id)} on the axis`,
    );
  }
});

test("a project without activities renders no bars and does not fail", () => {
  const empty = renderMarkup(
    <ActivitiesChart activities={emptyAnalysis.activities} />,
  );

  assert.equal(occurrences(empty, 'recharts-bar-rectangle"'), 0);
});
