import assert from "node:assert/strict";
import { test } from "node:test";

import {
  Decimal,
  roundForPresentation,
} from "../../src/domain/decimal";

test("configures the shared Decimal constructor with precision 40", () => {
  assert.equal(Decimal.precision, 40);
  assert.equal(Decimal.rounding, Decimal.ROUND_HALF_UP);
});

test("rounds a negative presentation tie away from zero", () => {
  assert.equal(roundForPresentation("-1.005").toString(), "-1.01");
});
