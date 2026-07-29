import assert from "node:assert/strict";
import { test } from "node:test";

import type { ActivityRead, IndexResult } from "../../src/shared/contract";
import { ActivitiesTable } from "../../src/ui/activities-table";
import {
  ABSENT_VALUE,
  formatAmount,
  formatCapturedPercentage,
  formatIndexDisplay,
  formatOptionalAmount,
} from "../../src/ui/format";
import { indexGlyph } from "../../src/ui/index-status";
import {
  attributeValues,
  renderMarkup,
  tableRows,
  visibleText,
} from "./render";
import { bandCaseInput, referenceAnalysis } from "./simulated-api";

const activities = referenceAnalysis.activities;
const markup = renderMarkup(<ActivitiesTable activities={activities} />);
const rows = tableRows(markup);
const header = markup.slice(0, markup.indexOf("</thead>"));

/** Encabezados de fila y de columna, en orden de aparición. */
function headings(source: string, scope: "col" | "row"): string[] {
  const pattern = new RegExp(
    `<th[^>]*scope="${scope}"[^>]*>([\\s\\S]*?)</th>`,
    "g",
  );

  return [...source.matchAll(pattern)].map(([, inner]) => visibleText(inner));
}

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
    actualProgress: formatCapturedPercentage(activity.actualProgress),
    bac: formatAmount(activity.bac),
    cpi: indexCellText(activity.cpi),
    cv: formatAmount(activity.cv),
    eac: formatOptionalAmount(activity.eac),
    ev: formatAmount(activity.ev),
    name: activity.name,
    plannedProgress: formatCapturedPercentage(activity.plannedProgress),
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

test("a captured percentage with decimals is not rounded to a whole percent", () => {
  const captured = bandCaseInput("B1");
  const [activity] = activities;
  const [row] = tableRows(
    renderMarkup(
      <ActivitiesTable
        activities={[
          {
            ...activity,
            actualProgress: captured.actualProgress,
            plannedProgress: captured.plannedProgress,
          },
        ]}
      />,
    ),
  );

  assert.equal(visibleText(row.cells.plannedProgress), "49,45 %");
  assert.equal(visibleText(row.cells.actualProgress), "49,45 %");
});

test("each row is headed by the activity name, not by its identifier", () => {
  assert.deepEqual(
    headings(markup.slice(markup.indexOf("<tbody")), "row"),
    activities.map((activity) => activity.name),
  );
});

test("the first column is the activity name", () => {
  const columns = headings(header, "col");

  assert.equal(columns[0], "Actividad");
  assert.equal(columns.length, 13);
});

test("the header names the captured data and the derived indicators", () => {
  const headerText = visibleText(header);

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
    assert.ok(
      headerText.includes(heading),
      `Expected ${heading} in: ${headerText}`,
    );
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

test("without handlers the table offers no action", () => {
  for (const tag of ["<input", "<button", "<form", "<textarea", "<select"]) {
    assert.ok(!markup.includes(tag), `Unexpected ${tag} in the table`);
  }

  assert.equal(markup.includes("data-row-actions"), false);
});

/**
 * RF-02: editar y eliminar empiezan donde están las actividades. La captura
 * sigue fuera de la tabla: dentro no hay ningún control de entrada.
 */
test("with handlers every row offers editing and deletion but no capture", () => {
  const editable = renderMarkup(
    <ActivitiesTable
      activities={activities}
      onDeleteActivity={() => undefined}
      onEditActivity={() => undefined}
    />,
  );

  assert.deepEqual(
    attributeValues(editable, "data-row-actions"),
    activities.map((activity) => String(activity.id)),
  );

  const actionPattern = /<button[^>]*data-row-action="([^"]*)"/g;
  const actions = [...editable.matchAll(actionPattern)].map(([, name]) => name);

  assert.deepEqual(
    actions,
    activities.flatMap(() => ["edit", "delete"]),
  );

  for (const tag of ["<input", "<form", "<textarea", "<select"]) {
    assert.ok(!editable.includes(tag), `Unexpected ${tag} in the table`);
  }

  for (const row of tableRows(editable)) {
    assert.deepEqual(row.fields, [...CAPTURED_FIELDS, ...DERIVED_FIELDS]);
  }
});
