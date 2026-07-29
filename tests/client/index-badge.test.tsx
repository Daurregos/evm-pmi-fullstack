import assert from "node:assert/strict";
import { test } from "node:test";

import type { IndexResult, IndexStatus } from "../../src/shared/contract";
import { IndexBadge } from "../../src/ui/index-badge";
import { indexGlyph, indexTone } from "../../src/ui/index-status";
import { ABSENT_VALUE } from "../../src/ui/format";
import { attributeValues, renderMarkup, visibleText } from "./render";
import { bandCaseIndexes, referenceAnalysis } from "./simulated-api";

const activities = referenceAnalysis.activities;

/** Un índice del fixture por cada uno de los cuatro `status`. */
const indexesByStatus: Readonly<Record<IndexStatus, IndexResult>> = {
  favorable: activities[0].cpi,
  unfavorable: activities[1].cpi,
  not_evaluable: activities[3].cpi,
  neutral: activities[7].cpi,
};

test("the fixture supplies all four statuses", () => {
  for (const [status, index] of Object.entries(indexesByStatus)) {
    assert.equal(index.status, status);
  }
});

for (const [status, index] of Object.entries(indexesByStatus)) {
  test(`status ${status} receives a visual treatment and stays itself`, () => {
    const markup = renderMarkup(<IndexBadge index={index} />);

    assert.deepEqual(attributeValues(markup, "data-status"), [status]);
    assert.ok(
      markup.includes(`index--${indexTone(index.status)}`),
      `Expected the ${status} tone class in: ${markup}`,
    );
    assert.ok(visibleText(markup).includes(indexGlyph(index.status)));
    assert.ok(visibleText(markup).includes(index.label));
  });
}

test("neutral and not_evaluable share a tone without collapsing", () => {
  assert.equal(indexTone("neutral"), indexTone("not_evaluable"));
  assert.equal(indexGlyph("neutral"), indexGlyph("not_evaluable"));

  const neutral = renderMarkup(<IndexBadge index={indexesByStatus.neutral} />);
  const notEvaluable = renderMarkup(
    <IndexBadge index={indexesByStatus.not_evaluable} />,
  );

  assert.deepEqual(attributeValues(neutral, "data-status"), ["neutral"]);
  assert.deepEqual(attributeValues(notEvaluable, "data-status"), [
    "not_evaluable",
  ]);
});

test("the unfavorable and favorable tones differ from the shared one", () => {
  const tones = new Set([
    indexTone("unfavorable"),
    indexTone("neutral"),
    indexTone("favorable"),
  ]);

  assert.equal(tones.size, 3);
});

test("an evaluable index renders its display verbatim", () => {
  const markup = renderMarkup(<IndexBadge index={indexesByStatus.neutral} />);

  assert.equal(indexesByStatus.neutral.display, "1,00");
  assert.ok(visibleText(markup).includes("1,00"));
});

test("a non-evaluable index shows absence and its label, never zero", () => {
  const index = indexesByStatus.not_evaluable;
  const text = visibleText(renderMarkup(<IndexBadge index={index} />));

  assert.equal(index.value, null);
  assert.equal(index.display, null);
  assert.ok(text.includes(ABSENT_VALUE));
  assert.ok(text.includes("no evaluable"));
  assert.ok(!text.includes("0,00"));
});

test("cpi.value zero is a defined unfavorable value, not absence", () => {
  const index = activities[2].cpi;
  const text = visibleText(renderMarkup(<IndexBadge index={index} />));

  assert.equal(index.value, 0);
  assert.equal(index.status, "unfavorable");
  assert.ok(text.includes("0,00"));
  assert.ok(!text.includes(ABSENT_VALUE));
});

const bandContrasts = [
  { caseId: "B1", index: "cpi", display: "<0,99", status: "unfavorable" },
  { caseId: "B2", index: "cpi", display: "0,99", status: "neutral" },
  { caseId: "B4", index: "cpi", display: "1,01", status: "neutral" },
  { caseId: "B5", index: "cpi", display: ">1,01", status: "favorable" },
  { caseId: "B6", index: "spi", display: "<0,99", status: "unfavorable" },
  { caseId: "B7", index: "spi", display: ">1,01", status: "favorable" },
] as const;

for (const contrast of bandContrasts) {
  test(`band case ${contrast.caseId} renders ${contrast.display} verbatim`, () => {
    const index = bandCaseIndexes(contrast.caseId)[contrast.index];
    const markup = renderMarkup(<IndexBadge index={index} />);

    assert.equal(index.display, contrast.display);
    assert.equal(index.status, contrast.status);
    assert.ok(
      visibleText(markup).includes(contrast.display),
      `Expected ${contrast.display} in: ${visibleText(markup)}`,
    );
    assert.deepEqual(attributeValues(markup, "data-status"), [contrast.status]);
  });
}

test("the marker is what distinguishes values that round alike", () => {
  const outsideBand = bandCaseIndexes("B1").cpi;
  const insideBand = bandCaseIndexes("B2").cpi;

  const outsideText = visibleText(
    renderMarkup(<IndexBadge index={outsideBand} />),
  );
  const insideText = visibleText(renderMarkup(<IndexBadge index={insideBand} />));

  assert.notEqual(outsideText, insideText);
  assert.notEqual(indexTone(outsideBand.status), indexTone(insideBand.status));
});
