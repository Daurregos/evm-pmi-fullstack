import type { ActivityRead, ActivityWrite } from "@/shared/contract";

/**
 * Estado del formulario de actividad: los cinco datos capturados del PRD §3 y
 * nada más. Los ocho indicadores no aparecen porque no son editables.
 *
 * Los valores se guardan como cadenas crudas, tal como se digitaron, y solo se
 * convierten al confirmar. La conversión es serialización, no validación: el
 * cliente no decide si un valor cumple el PRD §7.5, únicamente declara qué
 * escribió la persona y qué dejó vacío.
 */

export type ActivityFormField =
  | "ac"
  | "actualProgress"
  | "bac"
  | "name"
  | "plannedProgress";

export const ACTIVITY_FORM_FIELDS: readonly ActivityFormField[] = [
  "name",
  "bac",
  "plannedProgress",
  "actualProgress",
  "ac",
];

export type ActivityFormValues = Readonly<Record<ActivityFormField, string>>;

export function blankActivityForm(): ActivityFormValues {
  return {
    ac: "",
    actualProgress: "",
    bac: "",
    name: "",
    plannedProgress: "",
  };
}

/**
 * Precarga desde la representación de lectura. `String` conserva la
 * representación más corta que reproduce el número, así que un porcentaje
 * capturado con decimales llega sin redondear y un entero no gana decimales:
 * el redondeo pertenece a la presentación, y un formulario no presenta.
 */
export function activityFormOf(activity: ActivityRead): ActivityFormValues {
  return {
    ac: String(activity.ac),
    actualProgress: String(activity.actualProgress),
    bac: String(activity.bac),
    name: activity.name,
    plannedProgress: String(activity.plannedProgress),
  };
}

export function withActivityValue(
  values: ActivityFormValues,
  field: ActivityFormField,
  raw: string,
): ActivityFormValues {
  return { ...values, [field]: raw };
}

/** Un campo vacío no tiene valor; ADR-009 lo trata como ausencia. */
function textOrNull(raw: string): string | null {
  return raw === "" ? null : raw;
}

/**
 * Un texto sin número representable tampoco tiene valor: no existe un número
 * JSON que lo transporte. Con un control numérico el navegador ya entrega vacío
 * en ese caso.
 */
function numberOrNull(raw: string): number | null {
  if (raw.trim() === "") {
    return null;
  }

  const parsed = Number(raw);

  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * ADR-006a: `PUT` reemplaza todos los campos editables, de modo que la escritura
 * lleva siempre las cinco claves y no solo las modificadas.
 */
export function activityWriteOf(values: ActivityFormValues): ActivityWrite {
  return {
    ac: numberOrNull(values.ac),
    actualProgress: numberOrNull(values.actualProgress),
    bac: numberOrNull(values.bac),
    name: textOrNull(values.name),
    plannedProgress: numberOrNull(values.plannedProgress),
  };
}
