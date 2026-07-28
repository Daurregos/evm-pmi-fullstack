import type { EvmDerivedResult, EvmMagnitudes } from "./evm-types";

/** Fase 1: primitiva pura que derivará indicadores y estado desde magnitudes. */
export type DeriveMagnitudes = (input: EvmMagnitudes) => EvmDerivedResult;
