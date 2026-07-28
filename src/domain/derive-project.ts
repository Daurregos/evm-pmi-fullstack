import type { DeriveMagnitudes } from "./derive-magnitudes";
import type { CapturedActivity, EvmDerivedResult } from "./evm-types";

/** Fase 1: sumará magnitudes y llamará a la misma DeriveMagnitudes. */
export type DeriveProject = (
  activities: readonly CapturedActivity[],
  deriveMagnitudes: DeriveMagnitudes,
) => EvmDerivedResult;
