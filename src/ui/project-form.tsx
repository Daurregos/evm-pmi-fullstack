"use client";

import { FormField } from "@/ui/form-field";
import { type FormFeedback, violationsOf } from "@/ui/form-feedback";
import { FormNotice } from "@/ui/form-notice";
import type {
  ProjectFormField,
  ProjectFormValues,
} from "@/ui/project-form-state";

export interface ProjectFormProps {
  readonly values: ProjectFormValues;
  readonly feedback: FormFeedback;
  readonly saving: boolean;
  readonly onChange: (field: ProjectFormField, raw: string) => void;
  readonly onSubmit: () => void;
  readonly onCancel: () => void;
}

interface FieldDescriptor {
  readonly field: ProjectFormField;
  readonly label: string;
  readonly type: "date" | "text";
}

/**
 * ADR-005: la fecha de corte pertenece al proyecto y rige a sus actividades, así
 * que se captura aquí y no por actividad.
 */
const FIELDS: readonly FieldDescriptor[] = [
  { field: "name", label: "Nombre", type: "text" },
  { field: "cutoffDate", label: "Fecha de corte", type: "date" },
];

export function ProjectForm({
  feedback,
  onCancel,
  onChange,
  onSubmit,
  saving,
  values,
}: ProjectFormProps) {
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

      <div className="form__actions">
        <button
          className="button button--ghost"
          onClick={onCancel}
          type="button"
        >
          Cancelar
        </button>
        <button
          className="button button--primary"
          disabled={saving}
          type="submit"
        >
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}
