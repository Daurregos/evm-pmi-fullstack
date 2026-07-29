import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { Decimal } from "../../src/domain/decimal";
import * as evm from "../../src/domain/evm";

type FixtureIndex = Readonly<{
  value: number | null;
  display: string | null;
  status: evm.IndexStatus;
  label: string;
}>;

type FixtureActivity = Readonly<{
  $id: string;
  $state: keyof typeof stateByFixture;
  bac: number;
  plannedProgress: number;
  actualProgress: number;
  pv: number;
  ev: number;
  ac: number;
  cv: number;
  sv: number;
  cpi: FixtureIndex;
  spi: FixtureIndex;
  eac: number | null;
  vac: number | null;
}>;

type FixtureBandCase = Readonly<{
  $id: string;
  $input: Readonly<{
    bac: number;
    plannedProgress: number;
    actualProgress: number;
    ac: number;
  }>;
  $expected: Readonly<{
    cpi: FixtureIndex;
    spi: FixtureIndex;
  }>;
}>;

type FixtureSummary = Readonly<{
  bac: number;
  pv: number;
  ev: number;
  ac: number;
  cv: number;
  sv: number;
  cpi: FixtureIndex;
  spi: FixtureIndex;
  eac: number | null;
  vac: number | null;
  progress: number | null;
  activitiesWithEvAndZeroAc: number;
}>;

const stateByFixture = {
  SIN_INICIAR: "not_started",
  SIN_AVANCE_CON_PLAN_VIGENTE: "planned_without_progress",
  AVANCE_CON_AC_CERO: "progress_without_cost",
  COSTO_SIN_AVANCE: "cost_without_progress",
  AVANCE_CON_COSTO: "progress_with_cost",
} as const satisfies Record<string, evm.ActivityState>;

const fixture = JSON.parse(
  readFileSync(
    new URL("../../contracts/evm/evm-fixture.json", import.meta.url),
    "utf8",
  ),
) as {
  readResponse: {
    activities: FixtureActivity[];
    summary: FixtureSummary;
  };
  emptyProject: { summary: FixtureSummary };
  neutralBandChecks: { cases: FixtureBandCase[] };
  negativeChecks: {
    cpiAsAverageOfIndices: number;
    eacAsSumOfActivityEacs: number;
    eacFromRoundedCpi: number;
  };
};

function activityInput(activity: {
  bac: number;
  plannedProgress: number;
  actualProgress: number;
  ac: number;
}): evm.ActivityInput {
  return {
    bac: new Decimal(activity.bac),
    plannedProgress: new Decimal(activity.plannedProgress).div(100),
    actualProgress: new Decimal(activity.actualProgress).div(100),
    ac: new Decimal(activity.ac),
  };
}

function assertDecimal(
  actual: Decimal | null,
  expected: number | null,
  field: string,
): void {
  assert.equal(actual?.toNumber() ?? null, expected, field);
}

function assertIndex(
  actual: evm.IndexResult,
  expected: FixtureIndex,
  field: string,
): void {
  assertDecimal(actual.value, expected.value, `${field}.value`);
  assert.equal(actual.display, expected.display, `${field}.display`);
  assert.equal(actual.status, expected.status, `${field}.status`);
  assert.equal(actual.label, expected.label, `${field}.label`);
}

test("exports the three pure domain operations", () => {
  assert.equal(typeof evm.deriveFromMagnitudes, "function");
  assert.equal(typeof evm.deriveActivity, "function");
  assert.equal(typeof evm.consolidateProject, "function");
});

test("derives all indicators and state for the fixture defined-zero case", () => {
  const activity = fixture.readResponse.activities.find(
    (candidate) => candidate.$id === "a3",
  );
  assert.ok(activity);

  const result = evm.deriveFromMagnitudes(
    new Decimal(activity.bac),
    new Decimal(activity.pv),
    new Decimal(activity.ev),
    new Decimal(activity.ac),
  );

  assert.equal(result.pv.toNumber(), activity.pv);
  assert.equal(result.ev.toNumber(), activity.ev);
  assert.equal(result.cv.toNumber(), activity.cv);
  assert.equal(result.sv.toNumber(), activity.sv);
  assert.deepEqual(
    { ...result.cpi, value: result.cpi.value?.toNumber() ?? null },
    activity.cpi,
  );
  assert.deepEqual(
    { ...result.spi, value: result.spi.value?.toNumber() ?? null },
    activity.spi,
  );
  assert.equal(result.eac?.toNumber() ?? null, activity.eac);
  assert.equal(result.vac?.toNumber() ?? null, activity.vac);
  assert.equal(
    result.state,
    stateByFixture[activity.$state],
  );
});

test("matches all eight activity results from the fixture", () => {
  const activities = fixture.readResponse.activities;
  assert.equal(activities.length, 8);

  for (const activity of activities) {
    const result = evm.deriveActivity(activityInput(activity));
    for (const field of ["pv", "ev", "cv", "sv"] as const) {
      assertDecimal(result[field], activity[field], `${activity.$id}.${field}`);
    }
    assertIndex(result.cpi, activity.cpi, `${activity.$id}.cpi`);
    assertIndex(result.spi, activity.spi, `${activity.$id}.spi`);
    assertDecimal(result.eac, activity.eac, `${activity.$id}.eac`);
    assertDecimal(result.vac, activity.vac, `${activity.$id}.vac`);
    assert.equal(
      result.state,
      stateByFixture[activity.$state],
      `${activity.$id}.state`,
    );
  }
});

test("covers five states and four CPI/SPI evaluability combinations", () => {
  const activities = fixture.readResponse.activities;
  assert.deepEqual(
    new Set(activities.map((activity) => stateByFixture[activity.$state])),
    new Set([
      "not_started",
      "planned_without_progress",
      "progress_without_cost",
      "cost_without_progress",
      "progress_with_cost",
    ]),
  );

  const expected = new Set(
    activities.map(
      ({ cpi, spi }) =>
        `${cpi.value === null ? "N" : "E"}-${spi.value === null ? "N" : "E"}`,
    ),
  );
  const actual = new Set(
    activities.map((activity) => {
      const result = evm.deriveActivity(activityInput(activity));
      return `${result.cpi.value === null ? "N" : "E"}-${
        result.spi.value === null ? "N" : "E"
      }`;
    }),
  );

  assert.deepEqual(actual, expected);
  assert.equal(actual.size, 4);
});

test("does not propagate an activity's non-evaluable CPI to the project", () => {
  const activities = fixture.readResponse.activities;
  assert.ok(activities.some((activity) => activity.cpi.value === null));

  const result = evm.consolidateProject(activities.map(activityInput));

  assertIndex(result.cpi, fixture.readResponse.summary.cpi, "summary.cpi");
  assert.notEqual(result.cpi.value, null);
});

test("matches all seven unrounded neutral-band checks", () => {
  const cases = fixture.neutralBandChecks.cases;
  assert.equal(cases.length, 7);

  for (const bandCase of cases) {
    const result = evm.deriveActivity(activityInput(bandCase.$input));
    assertIndex(result.cpi, bandCase.$expected.cpi, `${bandCase.$id}.cpi`);
    assertIndex(result.spi, bandCase.$expected.spi, `${bandCase.$id}.spi`);
  }
});

test("matches the fixture project summary after summing magnitudes", () => {
  const activities = fixture.readResponse.activities;
  const summary = fixture.readResponse.summary;
  const result = evm.consolidateProject(activities.map(activityInput));

  for (const field of ["bac", "pv", "ev", "ac", "cv", "sv"] as const) {
    assertDecimal(result[field], summary[field], `summary.${field}`);
  }
  assertIndex(result.cpi, summary.cpi, "summary.cpi");
  assertIndex(result.spi, summary.spi, "summary.spi");
  assertDecimal(result.eac, summary.eac, "summary.eac");
  assertDecimal(result.vac, summary.vac, "summary.vac");
  assertDecimal(result.progress, summary.progress, "summary.progress");
  assert.equal(
    result.activitiesWithEvAndZeroAc,
    summary.activitiesWithEvAndZeroAc,
  );
});

test("matches the empty project summary", () => {
  const result = evm.consolidateProject([]);
  const summary = fixture.emptyProject.summary;

  for (const field of ["bac", "pv", "ev", "ac", "cv", "sv"] as const) {
    assertDecimal(result[field], summary[field], `empty.${field}`);
  }
  assertIndex(result.cpi, summary.cpi, "empty.cpi");
  assertIndex(result.spi, summary.spi, "empty.spi");
  assertDecimal(result.eac, summary.eac, "empty.eac");
  assertDecimal(result.vac, summary.vac, "empty.vac");
  assertDecimal(result.progress, summary.progress, "empty.progress");
  assert.equal(
    result.activitiesWithEvAndZeroAc,
    summary.activitiesWithEvAndZeroAc,
  );
});

test("rejects fixture negative consolidation strategies explicitly", () => {
  const result = evm.consolidateProject(
    fixture.readResponse.activities.map(activityInput),
  );
  const negative = fixture.negativeChecks;

  assert.notEqual(
    result.cpi.value?.toNumber(),
    negative.cpiAsAverageOfIndices,
  );
  assert.notEqual(result.eac?.toNumber(), negative.eacAsSumOfActivityEacs);
  assert.notEqual(result.eac?.toNumber(), negative.eacFromRoundedCpi);
});
