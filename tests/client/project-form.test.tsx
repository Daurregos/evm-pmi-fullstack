import assert from "node:assert/strict";
import { test } from "node:test";

import { EvmApiError } from "../../src/ui/evm-api-client";
import { NO_FEEDBACK, feedbackOf } from "../../src/ui/form-feedback";
import { ProjectForm } from "../../src/ui/project-form";
import {
  PROJECT_FORM_FIELDS,
  blankProjectForm,
  projectFormOf,
  projectWriteOf,
  withProjectValue,
} from "../../src/ui/project-form-state";
import { attributeValues, elementWith, renderMarkup } from "./render";
import { referenceProject, validationCase } from "./simulated-api";

function renderProjectForm(feedback = NO_FEEDBACK): string {
  return renderMarkup(
    <ProjectForm
      feedback={feedback}
      onCancel={() => undefined}
      onChange={() => undefined}
      onSubmit={() => undefined}
      saving={false}
      values={projectFormOf(referenceProject)}
    />,
  );
}

/** RF-01: el proyecto solo tiene nombre y fecha de corte editables. */
test("the project write carries both editable fields", () => {
  const write = projectWriteOf(projectFormOf(referenceProject));

  assert.deepEqual(Object.keys(write).sort(), ["cutoffDate", "name"]);
  assert.equal(write.name, referenceProject.name);
  assert.equal(write.cutoffDate, referenceProject.cutoffDate);
});

test("the edited field replaces its value and leaves the rest alone", () => {
  const values = withProjectValue(
    projectFormOf(referenceProject),
    "cutoffDate",
    "2026-07-31",
  );

  assert.equal(values.cutoffDate, "2026-07-31");
  assert.equal(values.name, referenceProject.name);
});

test("an empty box travels as absent", () => {
  assert.deepEqual(projectWriteOf(blankProjectForm()), {
    cutoffDate: null,
    name: null,
  });
});

test("the form covers name and cut-off date", () => {
  assert.deepEqual([...PROJECT_FORM_FIELDS].sort(), ["cutoffDate", "name"]);
});

test("the rendered form captures both fields with the served values", () => {
  const markup = renderProjectForm();

  assert.deepEqual(attributeValues(markup, "name"), [...PROJECT_FORM_FIELDS]);
  assert.ok(
    elementWith(markup, "data-field", "name", "p").includes(
      `value="${referenceProject.name}"`,
    ),
  );

  const cutoff = elementWith(markup, "data-field", "cutoffDate", "p");
  assert.ok(cutoff.includes('type="date"'));
  assert.ok(cutoff.includes(`value="${referenceProject.cutoffDate}"`));
});

/** V1 y V2 del fixture: nombre vacío y fecha de corte nula, ambos `required`. */
for (const caseId of ["V1", "V2"]) {
  test(`the ${caseId} violation is shown next to the field it names`, () => {
    const expected = validationCase(caseId);
    const [violation] = expected.body.violations;
    const feedback = feedbackOf(
      new EvmApiError(
        expected.status,
        expected.body.message,
        expected.body.code,
        expected.body.violations,
      ),
      PROJECT_FORM_FIELDS,
    );

    const block = elementWith(
      renderProjectForm(feedback),
      "data-field",
      violation.field,
      "p",
    );

    assert.ok(block.includes(`data-violation-rule="${violation.rule}"`));
    assert.ok(block.includes('aria-invalid="true"'));
  });
}
