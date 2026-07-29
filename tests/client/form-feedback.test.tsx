import assert from "node:assert/strict";
import { test } from "node:test";

import type { ContractViolation } from "../../src/shared/contract";
import { ActivityForm } from "../../src/ui/activity-form";
import {
  ACTIVITY_FORM_FIELDS,
  activityFormOf,
} from "../../src/ui/activity-form-state";
import { EvmApiError } from "../../src/ui/evm-api-client";
import {
  NO_FEEDBACK,
  type FormFeedback,
  feedbackOf,
  violationsOf,
} from "../../src/ui/form-feedback";
import { elementWith, renderMarkup, visibleText } from "./render";
import {
  errorEnvelope,
  referenceActivity,
  validationCase,
} from "./simulated-api";

function renderRejectedForm(feedback: FormFeedback): string {
  return renderMarkup(
    <ActivityForm
      feedback={feedback}
      onCancel={() => undefined}
      onChange={() => undefined}
      onSubmit={() => undefined}
      saving={false}
      values={activityFormOf(referenceActivity)}
    />,
  );
}

/** Reglas mostradas junto a un campo, en orden de aparición. */
function rulesShownFor(markup: string, field: string): string[] {
  const block = elementWith(markup, "data-field", field, "p");
  const pattern = /data-violation-rule="([^"]*)"/g;

  return [...block.matchAll(pattern)].map(([, rule]) => rule);
}

function failureOf(scenario: {
  body: { code: string; message: string; violations: readonly ContractViolation[] };
  status: number;
}): EvmApiError {
  return new EvmApiError(
    scenario.status,
    scenario.body.message,
    scenario.body.code as EvmApiError["code"],
    scenario.body.violations,
  );
}

const composite = validationCase("V9");

/**
 * ADR-009: la validación acumula. El caso compuesto del fixture infringe seis
 * reglas en una petición, y cada infracción debe llegar al campo que nombra.
 */
test("the composite case places every violation next to the field it names", () => {
  const feedback = feedbackOf(failureOf(composite), ACTIVITY_FORM_FIELDS);

  assert.equal(feedback.kind, "validation");

  const placed = composite.body.violations.filter((violation) =>
    (ACTIVITY_FORM_FIELDS as readonly string[]).includes(violation.field),
  );
  assert.equal(placed.length, 5);

  for (const violation of placed) {
    const shown = violationsOf(feedback, violation.field);
    assert.ok(
      shown.some((candidate) => candidate.rule === violation.rule),
      `Expected ${violation.rule} next to ${violation.field}`,
    );
    assert.ok(shown.every((candidate) => candidate.message.length > 0));
  }
});

/**
 * `cpi` es de solo lectura y `owner` no pertenece al esquema. Ninguno tiene
 * control en el formulario, y ADR-009 exige conservar `field` y mostrar
 * `message` sin fallar.
 */
test("a violation outside the form is reported without failing", () => {
  const feedback = feedbackOf(failureOf(composite), ACTIVITY_FORM_FIELDS);

  assert.deepEqual(
    feedback.unassigned.map((violation) => violation.field).sort(),
    ["cpi", "owner"],
  );
  assert.deepEqual(
    feedback.unassigned.map((violation) => violation.rule).sort(),
    ["read_only", "unknown"],
  );
});

test("several violations on one field are all shown", () => {
  const failure = new EvmApiError(422, "", "validation_failed", [
    { field: "bac", message: "Es obligatorio.", rule: "required" },
    { field: "bac", message: "Debe ser positivo.", rule: "positive" },
  ]);

  const shown = violationsOf(
    feedbackOf(failure, ACTIVITY_FORM_FIELDS),
    "bac",
  );

  assert.deepEqual(shown.map((violation) => violation.rule), [
    "required",
    "positive",
  ]);
});

/**
 * La clasificación mira `code`, nunca el texto. Con `message` vacío el reparto
 * por campo debe seguir ocurriendo.
 */
test("the classification does not depend on the message text", () => {
  const failure = new EvmApiError(422, "", "validation_failed", [
    { field: "ac", message: "No puede ser negativo.", rule: "non_negative" },
  ]);

  const feedback = feedbackOf(failure, ACTIVITY_FORM_FIELDS);

  assert.equal(feedback.kind, "validation");
  assert.equal(violationsOf(feedback, "ac").length, 1);
});

/**
 * ADR-009: `400` y `404` comparten envolvente con `violations` vacío, así que
 * necesitan un tratamiento genérico.
 */
test("400 and 404 mark no field", () => {
  for (const scenario of ["malformedRequest", "notFound"]) {
    const feedback = feedbackOf(
      failureOf(errorEnvelope(scenario)),
      ACTIVITY_FORM_FIELDS,
    );

    assert.equal(feedback.kind, "generic");
    assert.deepEqual(feedback.unassigned, []);
    assert.equal(feedback.notice.length > 0, true);

    for (const field of ACTIVITY_FORM_FIELDS) {
      assert.deepEqual(violationsOf(feedback, field), []);
    }
  }
});

test("a failure without an envelope is generic and still speaks", () => {
  const feedback = feedbackOf(
    new TypeError("fetch failed"),
    ACTIVITY_FORM_FIELDS,
  );

  assert.equal(feedback.kind, "generic");
  assert.ok(feedback.notice.length > 0);
});

/**
 * RF-02 exige indicar el campo y la regla incumplida. La prueba asevera la regla
 * y la presencia del mensaje, nunca su redacción: `docs/TESTING.md` prohíbe fijar
 * el texto y ADR-009 lo declara no automatizable.
 */
test("a rejected write shows every violation next to the field it names", () => {
  const feedback = feedbackOf(failureOf(composite), ACTIVITY_FORM_FIELDS);
  const markup = renderRejectedForm(feedback);

  for (const field of ACTIVITY_FORM_FIELDS) {
    const expected = violationsOf(feedback, field).map(
      (violation) => violation.rule,
    );

    assert.deepEqual(rulesShownFor(markup, field), expected);

    const block = elementWith(markup, "data-field", field, "p");
    assert.equal(block.includes('aria-invalid="true"'), expected.length > 0);

    for (const violation of violationsOf(feedback, field)) {
      assert.ok(visibleText(block).includes(violation.message));
    }
  }
});

test("a violation outside the form is shown without a field to mark", () => {
  const feedback = feedbackOf(failureOf(composite), ACTIVITY_FORM_FIELDS);
  const markup = renderRejectedForm(feedback);
  const list = elementWith(markup, "data-form-violations", "true", "ul");

  for (const violation of feedback.unassigned) {
    assert.ok(list.includes(`data-violation-field="${violation.field}"`));
    assert.ok(list.includes(`data-violation-rule="${violation.rule}"`));
    assert.ok(visibleText(list).includes(violation.message));
  }
});

test("a generic failure marks no field and still reports", () => {
  const feedback = feedbackOf(
    failureOf(errorEnvelope("malformedRequest")),
    ACTIVITY_FORM_FIELDS,
  );
  const markup = renderRejectedForm(feedback);

  for (const field of ACTIVITY_FORM_FIELDS) {
    assert.deepEqual(rulesShownFor(markup, field), []);
  }

  assert.equal(markup.includes('aria-invalid="true"'), false);
  assert.ok(visibleText(markup).includes(feedback.notice));
});

test("an untouched form has nothing to report", () => {
  assert.equal(NO_FEEDBACK.notice, "");
  assert.deepEqual(NO_FEEDBACK.unassigned, []);
  assert.deepEqual(violationsOf(NO_FEEDBACK, "bac"), []);
});
