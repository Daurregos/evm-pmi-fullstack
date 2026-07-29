import Decimal from "decimal.js";

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export { Decimal };

export function roundForPresentation(value: Decimal.Value): Decimal {
  return new Decimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

export function formatForPresentation(value: Decimal.Value): string {
  return roundForPresentation(value).toFixed(2).replace(".", ",");
}
