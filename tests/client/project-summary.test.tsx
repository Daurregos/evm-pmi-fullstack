import assert from "node:assert/strict";
import { test } from "node:test";

import { ProjectSummaryPanel } from "../../src/ui/project-summary-panel";
import { ProjectVerdict } from "../../src/ui/project-verdict";
import {
  formatAmount,
  formatOptionalAmount,
  formatProgress,
} from "../../src/ui/format";
import { indexTone } from "../../src/ui/index-status";
import {
  attributeValues,
  elementWith,
  fieldsOf,
  renderMarkup,
  visibleText,
} from "./render";
import { referenceAnalysis } from "./simulated-api";

const summary = referenceAnalysis.summary;
const panel = renderMarkup(<ProjectSummaryPanel summary={summary} />);
const verdict = renderMarkup(<ProjectVerdict summary={summary} />);

test("the panel shows the ten consolidated magnitudes and indexes", () => {
  const fields = fieldsOf(panel);

  assert.equal(visibleText(fields.bac), formatAmount(summary.bac));
  assert.equal(visibleText(fields.pv), formatAmount(summary.pv));
  assert.equal(visibleText(fields.ev), formatAmount(summary.ev));
  assert.equal(visibleText(fields.ac), formatAmount(summary.ac));
  assert.equal(visibleText(fields.cv), formatAmount(summary.cv));
  assert.equal(visibleText(fields.sv), formatAmount(summary.sv));
  assert.equal(visibleText(fields.eac), formatOptionalAmount(summary.eac));
  assert.equal(visibleText(fields.vac), formatOptionalAmount(summary.vac));
  assert.ok(visibleText(fields.cpi).includes("0,95"));
  assert.ok(visibleText(fields.spi).includes("0,80"));
});

test("the panel shows the project progress as a whole percent", () => {
  const fields = fieldsOf(panel);

  assert.equal(
    visibleText(fields.progress),
    formatProgress(summary.progress),
  );
  assert.equal(visibleText(fields.progress), "33 %");
});

test("the panel reports how many activities have EV above zero and AC at zero", () => {
  const fields = fieldsOf(panel);

  assert.equal(summary.activitiesWithEvAndZeroAc, 1);
  assert.equal(
    visibleText(fields.activitiesWithEvAndZeroAc),
    String(summary.activitiesWithEvAndZeroAc),
  );
});

test("the consolidated indexes keep their own status", () => {
  const fields = fieldsOf(panel);

  assert.deepEqual(attributeValues(fields.cpi, "data-status"), [
    summary.cpi.status,
  ]);
  assert.deepEqual(attributeValues(fields.spi, "data-status"), [
    summary.spi.status,
  ]);
});

const verdictCards = [
  { card: "cost", index: summary.cpi },
  { card: "schedule", index: summary.spi },
] as const;

for (const { card, index } of verdictCards) {
  test(`the ${card} verdict states the diagnosis in words and tone`, () => {
    const markup = elementWith(verdict, "data-verdict", card, "article");
    const text = visibleText(markup);

    assert.ok(index.display !== null);
    assert.ok(text.includes(index.display));
    assert.ok(text.includes(index.label));
    assert.ok(markup.includes(`index--${indexTone(index.status)}`));
    assert.deepEqual(attributeValues(markup, "data-status"), [index.status]);
  });
}

test("the reference project reads as unfavorable at a glance", () => {
  assert.equal(summary.cpi.status, "unfavorable");
  assert.equal(summary.spi.status, "unfavorable");

  const cost = elementWith(verdict, "data-verdict", "cost", "article");
  const schedule = elementWith(verdict, "data-verdict", "schedule", "article");

  assert.ok(cost.includes("index--unfavorable"));
  assert.ok(schedule.includes("index--unfavorable"));
});

test("the verdict shows the project progress", () => {
  const progress = elementWith(verdict, "data-verdict", "progress", "article");

  assert.ok(visibleText(progress).includes("33 %"));
});
