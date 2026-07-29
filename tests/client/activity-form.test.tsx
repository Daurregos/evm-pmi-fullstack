import assert from "node:assert/strict";
import { test } from "node:test";

import {
  ACTIVITY_FORM_FIELDS,
  activityFormOf,
  activityWriteOf,
  blankActivityForm,
  withActivityValue,
} from "../../src/ui/activity-form-state";
import { bandCaseInput, referenceActivity } from "./simulated-api";

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
