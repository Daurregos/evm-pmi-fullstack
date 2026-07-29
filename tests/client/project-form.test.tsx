import assert from "node:assert/strict";
import { test } from "node:test";

import {
  PROJECT_FORM_FIELDS,
  blankProjectForm,
  projectFormOf,
  projectWriteOf,
  withProjectValue,
} from "../../src/ui/project-form-state";
import { referenceProject } from "./simulated-api";

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
