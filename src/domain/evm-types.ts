import type { Decimal } from "./decimal";

export type EvmMagnitudes = Readonly<{
  bac: Decimal;
  pv: Decimal;
  ev: Decimal;
  ac: Decimal;
}>;

export type CapturedActivity = Readonly<{
  name: string;
  bac: Decimal;
  plannedProgress: Decimal;
  actualProgress: Decimal;
  ac: Decimal;
}>;

export type EvmDerivedResult = Readonly<
  Record<
    "pv" | "ev" | "cv" | "sv" | "cpi" | "spi" | "eac" | "vac",
    unknown
  >
> &
  Readonly<{ state: unknown }>;
