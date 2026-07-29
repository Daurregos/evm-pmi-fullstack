import assert from "node:assert/strict";
import { test } from "node:test";

import { ActivityForm } from "../../src/ui/activity-form";
import {
  ACTIVITY_FORM_FIELDS,
  activityFormOf,
  activityWriteOf,
  blankActivityForm,
  withActivityValue,
} from "../../src/ui/activity-form-state";
import { NO_FEEDBACK } from "../../src/ui/form-feedback";
import { attributeValues, elementWith, renderMarkup } from "./render";
import { bandCaseInput, referenceActivity } from "./simulated-api";

/** Los ocho indicadores derivados del PRD §3, que nunca son editables. */
const INDICATORS = [
  "pv",
  "ev",
  "cv",
  "sv",
  "cpi",
  "spi",
  "eac",
  "vac",
] as const;

function renderActivityForm(
  values = activityFormOf(referenceActivity),
  feedback = NO_FEEDBACK,
): string {
  return renderMarkup(
    <ActivityForm
      feedback={feedback}
      onCancel={() => undefined}
      onChange={() => undefined}
      onSubmit={() => undefined}
      saving={false}
      values={values}
    />,
  );
}

/**
 * RF-02 y ADR-006a: la escritura reemplaza los cinco datos capturados y solo
 * esos. Un sexto campo sería `read_only` o `unknown` para el backend.
 */
test("the activity write carries exactly the five captured data points", () => {
  const write = activityWriteOf(activityFormOf(referenceActivity));

  assert.deepEqual(Object.keys(write).sort(), [
    "ac",
    "actualProgress",
    "bac",
    "name",
    "plannedProgress",
  ]);
  assert.equal(write.name, referenceActivity.name);
  assert.equal(write.bac, referenceActivity.bac);
  assert.equal(write.plannedProgress, referenceActivity.plannedProgress);
  assert.equal(write.actualProgress, referenceActivity.actualProgress);
  assert.equal(write.ac, referenceActivity.ac);
});

/**
 * PRD §7.4 y ADR-003: el redondeo pertenece a la presentación. Un formulario que
 * precargara `50,55 %` como `51` destruiría lo que la persona registró.
 */
test("a captured percentage with decimals reaches the form unrounded", () => {
  const input = bandCaseInput("B5");
  const values = activityFormOf({
    ...referenceActivity,
    actualProgress: input.actualProgress,
    plannedProgress: input.plannedProgress,
  });

  assert.equal(values.plannedProgress, String(input.plannedProgress));
  assert.equal(values.actualProgress, String(input.actualProgress));
  assert.equal(
    activityWriteOf(values).actualProgress,
    input.actualProgress,
  );
});

test("the edited field replaces its value and leaves the rest alone", () => {
  const values = withActivityValue(
    activityFormOf(referenceActivity),
    "ac",
    "123.45",
  );

  assert.equal(values.ac, "123.45");
  assert.equal(values.name, referenceActivity.name);
  assert.equal(activityWriteOf(values).ac, 123.45);
});

/**
 * ADR-009 trata un `null` explícito en un campo obligatorio como ausencia de
 * valor y responde `422` con `rule: "required"`. El cliente no decide eso: solo
 * declara que no hay valor.
 */
test("an empty box travels as absent", () => {
  const write = activityWriteOf(blankActivityForm());

  assert.deepEqual(write, {
    ac: null,
    actualProgress: null,
    bac: null,
    name: null,
    plannedProgress: null,
  });
});

test("the form covers the five fields and no indicator", () => {
  assert.deepEqual([...ACTIVITY_FORM_FIELDS].sort(), [
    "ac",
    "actualProgress",
    "bac",
    "name",
    "plannedProgress",
  ]);
});

/** RF-02: ningún indicador es editable, así que no tiene control de captura. */
test("the rendered form offers a control for the five data points and none else", () => {
  const markup = renderActivityForm();

  assert.deepEqual(attributeValues(markup, "name"), [
    ...ACTIVITY_FORM_FIELDS,
  ]);

  for (const indicator of INDICATORS) {
    assert.equal(
      markup.includes(`name="${indicator}"`),
      false,
      `${indicator} must not be captured`,
    );
  }
});

test("the control shows the captured percentage with its decimals", () => {
  const input = bandCaseInput("B5");
  const markup = renderActivityForm(
    activityFormOf({
      ...referenceActivity,
      actualProgress: input.actualProgress,
      plannedProgress: input.plannedProgress,
    }),
  );

  const planned = elementWith(markup, "data-field", "plannedProgress", "p");

  assert.ok(planned.includes(`value="${String(input.plannedProgress)}"`));
  assert.equal(planned.includes('value="51"'), false);
});
