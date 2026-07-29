"use client";

import type { ContractViolation } from "@/shared/contract";

export interface FormFieldProps {
  /** Nombre `lowerCamelCase` del contrato; ubica la infracción del API. */
  readonly field: string;
  readonly label: string;
  readonly type: "date" | "number" | "text";
  readonly value: string;
  readonly violations: readonly ContractViolation[];
  readonly onChange: (raw: string) => void;
}

/**
 * Un campo del formulario con sus infracciones al lado.
 *
 * El control es numérico cuando el campo lo es, de modo que el navegador
 * resuelve el separador decimal y el valor viaja tal cual: el cliente no
 * interpreta la entrada ni la redondea. `step="any"` evita que el control
 * rechace decimales.
 *
 * Cada mensaje conserva su `rule` en el marcado. La regla es el enumerado
 * estable de ADR-009; el texto es para la persona.
 */
export function FormField({
  field,
  label,
  onChange,
  type,
  value,
  violations,
}: FormFieldProps) {
  const controlId = `field-${field}`;
  const invalid = violations.length > 0;
  const describedBy = violations
    .map((violation) => `${controlId}-${violation.rule}`)
    .join(" ");

  return (
    <p className="field" data-field={field}>
      <label className="field__label" htmlFor={controlId}>
        {label}
      </label>
      <input
        aria-describedby={invalid ? describedBy : undefined}
        aria-invalid={invalid ? true : undefined}
        className="field__control"
        id={controlId}
        name={field}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        step={type === "number" ? "any" : undefined}
        type={type}
        value={value}
      />
      {violations.map((violation) => (
        <span
          className="field__error"
          data-field-error={field}
          data-violation-rule={violation.rule}
          id={`${controlId}-${violation.rule}`}
          key={violation.rule}
        >
          {violation.message}
        </span>
      ))}
    </p>
  );
}
