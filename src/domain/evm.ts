import type { Decimal } from "./decimal";

export type IndexStatus =
  | "favorable"
  | "neutral"
  | "unfavorable"
  | "not_evaluable";

export type IndexResult = Readonly<{
  value: Decimal | null;
  status: IndexStatus;
}>;

export type EvmResult = Readonly<{
  pv: Decimal;
  ev: Decimal;
  cv: Decimal;
  sv: Decimal;
  cpi: IndexResult;
  spi: IndexResult;
  eac: Decimal | null;
  vac: Decimal | null;
}>;

export type ActivityInput = Readonly<{
  bac: Decimal;
  plannedProgress: Decimal;
  actualProgress: Decimal;
  ac: Decimal;
}>;

/**
 * Primitiva única de fase 1: recibe magnitudes y deriva los ocho indicadores
 * y su estado. Fase 0 declara el contrato, pero no contiene su implementación.
 */
export declare function deriveFromMagnitudes(
  bac: Decimal,
  pv: Decimal,
  ev: Decimal,
  ac: Decimal,
): EvmResult;

/**
 * En fase 1 obtendrá PV y EV de los porcentajes capturados y delegará en
 * deriveFromMagnitudes; no duplicará derivaciones.
 */
export declare function deriveActivity(input: ActivityInput): EvmResult;

/**
 * En fase 1 sumará magnitudes y delegará en deriveFromMagnitudes; la
 * consolidación no reimplementará indicadores.
 */
export declare function consolidateProject(
  activities: readonly ActivityInput[],
): EvmResult;
