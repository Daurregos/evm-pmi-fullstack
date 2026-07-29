import type { ContractViolation } from "@/shared/contract";

import { EvmApiError } from "@/ui/evm-api-client";

/**
 * Traduce el fallo de una escritura en retroalimentación de formulario.
 *
 * ADR-009 fija la regla que gobierna este módulo: los consumidores automatizan
 * sobre `code` y `rule`, nunca sobre el texto de `message`. Aquí `message` se
 * conserva para mostrarlo y no se inspecciona para decidir nada.
 *
 * Una infracción cuyo `field` no pertenece al formulario —un campo de solo
 * lectura, una propiedad desconocida o una `rule` futura— se reporta sin fallar
 * y conserva el nombre que devolvió el API.
 */

export interface FormFeedback {
  /** `validation` reparte por campo; `generic` no marca ninguno. */
  readonly kind: "generic" | "validation";
  /** Texto para la persona: el de la envolvente cuando existe. */
  readonly notice: string;
  readonly byField: Readonly<Record<string, readonly ContractViolation[]>>;
  /** Infracciones sin campo en el formulario. */
  readonly unassigned: readonly ContractViolation[];
}

export const NO_FEEDBACK: FormFeedback = {
  byField: {},
  kind: "generic",
  notice: "",
  unassigned: [],
};

const GENERIC_NOTICE = "No fue posible guardar el cambio.";

function genericFeedback(notice: string): FormFeedback {
  return {
    byField: {},
    kind: "generic",
    notice: notice === "" ? GENERIC_NOTICE : notice,
    unassigned: [],
  };
}

function distribute(
  violations: readonly ContractViolation[],
  fields: readonly string[],
): Pick<FormFeedback, "byField" | "unassigned"> {
  const byField: Record<string, ContractViolation[]> = {};
  const unassigned: ContractViolation[] = [];

  for (const violation of violations) {
    if (!fields.includes(violation.field)) {
      unassigned.push(violation);
      continue;
    }

    const placed = byField[violation.field] ?? [];
    placed.push(violation);
    byField[violation.field] = placed;
  }

  return { byField, unassigned };
}

/**
 * `validation_failed` reparte las infracciones; cualquier otro código, una
 * respuesta sin envolvente y un fallo de red comparten tratamiento genérico,
 * porque ADR-009 les da `violations` vacío o ninguna envolvente.
 */
export function feedbackOf(
  failure: unknown,
  fields: readonly string[],
): FormFeedback {
  if (!(failure instanceof EvmApiError)) {
    return genericFeedback("");
  }

  if (failure.code !== "validation_failed") {
    return genericFeedback(failure.message);
  }

  return {
    ...distribute(failure.violations, fields),
    kind: "validation",
    notice: failure.message === "" ? GENERIC_NOTICE : failure.message,
  };
}

export function violationsOf(
  feedback: FormFeedback,
  field: string,
): readonly ContractViolation[] {
  return feedback.byField[field] ?? [];
}
