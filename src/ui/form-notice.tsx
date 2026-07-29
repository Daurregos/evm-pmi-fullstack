"use client";

import type { FormFeedback } from "@/ui/form-feedback";

export interface FormNoticeProps {
  readonly feedback: FormFeedback;
}

/**
 * Lo que el formulario informa sin poder señalar un campo: el aviso de la
 * envolvente y las infracciones cuyo `field` no pertenece a este formulario.
 *
 * ADR-009 exige conservar `field` y mostrar `message` ante una regla o un campo
 * desconocidos, tratándolos como validación genérica sin fallar.
 */
export function FormNotice({ feedback }: FormNoticeProps) {
  if (feedback.notice === "" && feedback.unassigned.length === 0) {
    return null;
  }

  return (
    <div className="form__feedback" data-feedback-kind={feedback.kind}>
      {feedback.notice === "" ? null : (
        <p className="form__notice" role="alert">
          {feedback.notice}
        </p>
      )}

      {feedback.unassigned.length === 0 ? null : (
        <ul className="form__violations" data-form-violations="true">
          {feedback.unassigned.map((violation) => (
            <li
              data-violation-field={violation.field}
              data-violation-rule={violation.rule}
              key={`${violation.field}-${violation.rule}`}
            >
              <code>{violation.field}</code> {violation.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
