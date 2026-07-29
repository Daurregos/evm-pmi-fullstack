"use client";

import type {
  ActivityFormField,
  ActivityFormValues,
} from "@/ui/activity-form-state";
import { FormField } from "@/ui/form-field";
import { type FormFeedback, violationsOf } from "@/ui/form-feedback";
import { FormNotice } from "@/ui/form-notice";

export interface ActivityFormProps {
  readonly values: ActivityFormValues;
  readonly feedback: FormFeedback;
  readonly saving: boolean;
  readonly onChange: (field: ActivityFormField, raw: string) => void;
  readonly onSubmit: () => void;
  readonly onCancel: () => void;
}

interface FieldDescriptor {
  readonly field: ActivityFormField;
  readonly label: string;
  readonly type: "number" | "text";
}

/**
 * Los cinco datos capturados del PRD §3, en el orden en que se leen. Los ocho
 * indicadores no aparecen: RF-02 los declara no editables y ADR-009 rechazaría
 * su envío con `rule: "read_only"`.
 */
const FIELDS: readonly FieldDescriptor[] = [
  { field: "name", label: "Nombre", type: "text" },
  { field: "bac", label: "BAC", type: "number" },
  { field: "plannedProgress", label: "Avance planificado (%)", type: "number" },
  { field: "actualProgress", label: "Avance real (%)", type: "number" },
  { field: "ac", label: "AC", type: "number" },
];

/**
 * Formulario de actividad. Presentacional: la digitación solo avisa al
 * contenedor, que guarda el valor. Nada se calcula ni se pide al API mientras se
 * escribe, conforme a RF-03.
 */
export function ActivityForm({
  feedback,
  onCancel,
  onChange,
  onSubmit,
  saving,
  values,
}: ActivityFormProps) {
  return (
    <form
      className="form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <FormNotice feedback={feedback} />

      <div className="form__grid">
        {FIELDS.map((descriptor) => (
          <FormField
            field={descriptor.field}
            key={descriptor.field}
            label={descriptor.label}
            onChange={(raw) => {
              onChange(descriptor.field, raw);
            }}
            type={descriptor.type}
            value={values[descriptor.field]}
            violations={violationsOf(feedback, descriptor.field)}
          />
        ))}
      </div>

      <p className="form__hint">
        Los indicadores se calculan al confirmar y no se capturan.
      </p>

      <div className="form__actions">
        <button
          className="button button--ghost"
          onClick={onCancel}
          type="button"
        >
          Cancelar
        </button>
        <button className="button button--primary" disabled={saving} type="submit">
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}
