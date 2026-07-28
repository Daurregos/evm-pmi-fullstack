import type { DeriveMagnitudes } from "./derive-magnitudes";
import type { CapturedActivity, EvmDerivedResult } from "./evm-types";

/** Fase 1: obtendrá PV/EV desde porcentajes y llamará a DeriveMagnitudes. */
export type DeriveActivity = (
  input: CapturedActivity,
  deriveMagnitudes: DeriveMagnitudes,
) => EvmDerivedResult;
