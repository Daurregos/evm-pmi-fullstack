import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  Decimal,
  formatForPresentation,
  roundForPresentation,
} from "../../src/domain/decimal";

const fixture = JSON.parse(
  readFileSync(
    new URL("../../contracts/evm/evm-fixture.json", import.meta.url),
    "utf8",
  ),
) as {
  readResponse: {
    summary: {
      cpi: { value: number };
      eac: number;
      vac: number;
      progress: number;
    };
  };
};

test("configures the shared Decimal constructor with precision 40", () => {
  assert.equal(Decimal.precision, 40);
  assert.equal(Decimal.rounding, Decimal.ROUND_HALF_UP);
});

for (const [input, expected] of [
  ["1.005", "1.01"],
  ["-1.005", "-1.01"],
  ["0.625", "0.63"],
] as const) {
  test(`rounds ${input} to ${expected} away from zero`, () => {
    assert.equal(roundForPresentation(input).toString(), expected);
  });
}

test("preserves approved fixture values through a JSON number round trip", () => {
  const { summary } = fixture.readResponse;
  for (const value of [
    summary.cpi.value,
    summary.eac,
    summary.vac,
    summary.progress,
  ]) {
    const wireNumber = JSON.parse(JSON.stringify(new Decimal(value).toNumber()));
    assert.equal(new Decimal(wireNumber).toNumber(), value);
  }
});

for (const [input, expected] of [
  ["1e-18", "0,00"],
  [
    "99999999999999999999.999999999999999999",
    "100000000000000000000,00",
  ],
  ["1e21", "1000000000000000000000,00"],
] as const) {
  test(`formats ${input} in fixed notation with exactly two decimals`, () => {
    assert.equal(formatForPresentation(input), expected);
  });
}
