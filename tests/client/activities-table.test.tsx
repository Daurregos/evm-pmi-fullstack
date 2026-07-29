import assert from "node:assert/strict";
import { test } from "node:test";

import type { ActivityRead, IndexResult } from "../../src/shared/contract";
import { ActivitiesTable } from "../../src/ui/activities-table";
import {
  ABSENT_VALUE,
  formatAmount,
  formatIndexDisplay,
  formatOptionalAmount,
  formatPercentage,
} from "../../src/ui/format";
import { indexGlyph } from "../../src/ui/index-status";
import {
  attributeValues,
  renderMarkup,
  tableRows,
  visibleText,
} from "./render";
import { referenceAnalysis } from "./simulated-api";

const activities = referenceAnalysis.activities;
const markup = renderMarkup(<ActivitiesTable activities={activities} />);
const rows = tableRows(markup);

/** Los cinco datos capturados y los ocho indicadores de RF-06, en orden. */
const CAPTURED_FIELDS = [
  "name",
  "bac",
  "plannedProgress",
  "actualProgress",
  "ac",
] as const;
const DERIVED_FIELDS = [
  "pv",
  "ev",
  "cv",
  "sv",
  "cpi",
  "spi",
  "eac",
  "vac",
] as const;

function indexCellText(index: IndexResult): string {
  return [
    indexGlyph(index.status),
    formatIndexDisplay(index.display),
    index.label,
  ].join(" ");
}

function expectedCells(activity: ActivityRead): Record<string, string> {
  return {
    ac: formatAmount(activity.ac),
    actualProgress: formatPercentage(activity.actualProgress),
    bac: formatAmount(activity.bac),
    cpi: indexCellText(activity.cpi),
    cv: formatAmount(activity.cv),
    eac: formatOptionalAmount(activity.eac),
    ev: formatAmount(activity.ev),
    name: activity.name,
    plannedProgress: formatPercentage(activity.plannedProgress),
    pv: formatAmount(activity.pv),
    spi: indexCellText(activity.spi),
    sv: formatAmount(activity.sv),
    vac: formatOptionalAmount(activity.vac),
  };
}

test("the table renders one row per activity", () => {
  assert.equal(rows.length, activities.length);
  assert.deepEqual(
    rows.map((row) => row.id),
    activities.map((activity) => String(activity.id)),
  );
});

test("every row carries the five captured data and the eight indicators", () => {
  for (const row of rows) {
    assert.deepEqual(row.fields, [...CAPTURED_FIELDS, ...DERIVED_FIELDS]);
  }
});

for (const activity of activities) {
  test(`activity ${String(activity.id)} shows every value it received`, () => {
    const row = rows.find((candidate) => candidate.id === String(activity.id));
    assert.ok(row);

    const expected = expectedCells(activity);

    for (const field of [...CAPTURED_FIELDS, ...DERIVED_FIELDS]) {
      assert.equal(
        visibleText(row.cells[field]),
        expected[field],
        `Field ${field} of activity ${String(activity.id)}`,
      );
    }
  });
}

test("the header names the captured data and the derived indicators", () => {
  const header = visibleText(markup.slice(0, markup.indexOf("</thead>")));

  for (const heading of [
    "BAC",
    "AC",
    "PV",
    "EV",
    "CV",
    "SV",
    "CPI",
    "SPI",
    "EAC",
    "VAC",
  ]) {
    assert.ok(header.includes(heading), `Expected ${heading} in: ${header}`);
  }
});

test("a non-evaluable projection shows absence, not zero", () => {
  const withoutProjection = rows.filter((row) => {
    const activity = activities.find(
      (candidate) => String(candidate.id) === row.id,
    );
    return activity?.eac === null;
  });

  assert.ok(withoutProjection.length > 0);

  for (const row of withoutProjection) {
    assert.equal(visibleText(row.cells.eac), ABSENT_VALUE);
    assert.equal(visibleText(row.cells.vac), ABSENT_VALUE);
  }
});

test("each index cell exposes its own status", () => {
  for (const activity of activities) {
    const row = rows.find((candidate) => candidate.id === String(activity.id));
    assert.ok(row);

    assert.deepEqual(attributeValues(row.cells.cpi, "data-status"), [
      activity.cpi.status,
    ]);
    assert.deepEqual(attributeValues(row.cells.spi, "data-status"), [
      activity.spi.status,
    ]);
  }
});

test("a positive CV with a non-evaluable CPI is never shown as favorable", () => {
  const activity = activities[3];
  const row = rows.find((candidate) => candidate.id === String(activity.id));
  assert.ok(row);

  assert.ok(activity.cv > 0);
  assert.equal(activity.cpi.status, "not_evaluable");
  assert.ok(!row.cells.cpi.includes("index--favorable"));
  assert.ok(row.cells.spi.includes("index--favorable"));
});

test("the read-only table offers no editing affordance", () => {
  for (const tag of ["<input", "<button", "<form", "<textarea", "<select"]) {
    assert.ok(!markup.includes(tag), `Unexpected ${tag} in the table`);
  }
});
