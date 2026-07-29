import assert from "node:assert/strict";
import { test } from "node:test";

import {
  ABSENT_VALUE,
  formatAmount,
  formatIndexDisplay,
  formatOptionalAmount,
  formatPercentage,
} from "../../src/ui/format";
import { referenceAnalysis } from "./simulated-api";

test("amounts use two decimals, a decimal comma and a thousands dot", () => {
  // Criterio literal de RF-03 sobre los valores de su ejemplo.
  assert.equal(formatAmount(500), "500,00");
  assert.equal(formatAmount(-100), "−100,00");
  assert.equal(formatAmount(1250), "1.250,00");
  assert.equal(formatAmount(-250), "−250,00");
});

test("thousands grouping repeats beyond the first group", () => {
  assert.equal(formatAmount(1234567.891), "1.234.567,89");
  assert.equal(formatAmount(-1234567.891), "−1.234.567,89");
});

test("unrounded fixture amounts are rounded only for presentation", () => {
  const { summary } = referenceAnalysis;

  assert.equal(formatAmount(summary.bac), "68.000,00");
  assert.equal(formatAmount(summary.cv), "−1.230,00");
  assert.equal(formatOptionalAmount(summary.eac), "71.733,93");
  assert.equal(formatOptionalAmount(summary.vac), "−3.733,93");
});

test("exact ties round away from zero", () => {
  assert.equal(formatAmount(0.125), "0,13");
  assert.equal(formatAmount(-0.125), "−0,13");
});

test("zero and negative zero carry no sign", () => {
  assert.equal(formatAmount(0), "0,00");
  assert.equal(formatAmount(-0), "0,00");
});

test("percentages are presented as whole percents", () => {
  const { activities, summary } = referenceAnalysis;
  const [first] = activities;

  assert.equal(formatPercentage(first.plannedProgress), "40 %");
  assert.equal(formatPercentage(first.actualProgress), "50 %");
  assert.equal(formatPercentage(summary.progress), "33 %");
  assert.equal(formatPercentage(0), "0 %");
});

test("an absent value is presented as absent, never as zero", () => {
  assert.equal(formatOptionalAmount(null), ABSENT_VALUE);
  assert.equal(formatPercentage(null), ABSENT_VALUE);
  assert.equal(formatIndexDisplay(null), ABSENT_VALUE);
  assert.notEqual(ABSENT_VALUE, "0,00");
});

test("an index display crosses the client untouched", () => {
  const { activities } = referenceAnalysis;

  assert.equal(formatIndexDisplay(activities[1].cpi.display), "0,76");
  assert.equal(formatIndexDisplay("<0,99"), "<0,99");
  assert.equal(formatIndexDisplay(">1,01"), ">1,01");
});
