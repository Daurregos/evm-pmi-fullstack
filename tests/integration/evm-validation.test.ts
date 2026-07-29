import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  validateActivityWrite,
  validateProjectWrite,
} from "@/application/evm-validation";

type FixtureViolation = Readonly<{
  field: string;
  rule: string;
  message: string;
}>;

type ValidationCase = Readonly<{
  $id: string;
  resource: "project" | "activity";
  request: Readonly<Record<string, unknown>>;
  expectedBody: Readonly<{ violations: readonly FixtureViolation[] }>;
}>;

type Fixture = Readonly<{
  writeSchemas: Readonly<{
    project: Readonly<{ fields: readonly string[] }>;
    activity: Readonly<{ fields: readonly string[] }>;
  }>;
  validationChecks: Readonly<{ cases: readonly ValidationCase[] }>;
}>;

const fixture = JSON.parse(
  readFileSync(
    new URL(
      "../../contracts/evm/evm-fixture.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as Fixture;

function fieldRules(
  violations: readonly { field: string; rule: string }[],
): Set<string> {
  return new Set(violations.map(({ field, rule }) => `${field}:${rule}`));
}

for (const validationCase of fixture.validationChecks.cases) {
  test(`matches fixture validation case ${validationCase.$id}`, () => {
    const result =
      validationCase.resource === "project"
        ? validateProjectWrite(validationCase.request)
        : validateActivityWrite(validationCase.request);

    assert.equal(result.ok, false);
    if (result.ok) {
      return;
    }

    assert.deepEqual(
      fieldRules(result.violations),
      fieldRules(validationCase.expectedBody.violations),
    );
    assert.equal(
      result.violations.every(({ message }) => message.length > 0),
      true,
    );
  });
}

const validProject = {
  name: "Proyecto válido",
  cutoffDate: "2026-06-30",
};

const validActivity = {
  name: "Actividad válida",
  bac: 1000,
  plannedProgress: 50,
  actualProgress: 40,
  ac: 500,
};

for (const field of fixture.writeSchemas.project.fields) {
  test(`rejects missing project field ${field}`, () => {
    const request = { ...validProject };
    delete request[field as keyof typeof request];

    const result = validateProjectWrite(request);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.deepEqual(fieldRules(result.violations), new Set([`${field}:required`]));
    }
  });

  test(`rejects null project field ${field}`, () => {
    const result = validateProjectWrite({ ...validProject, [field]: null });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.deepEqual(fieldRules(result.violations), new Set([`${field}:required`]));
    }
  });
}

for (const field of fixture.writeSchemas.activity.fields) {
  test(`rejects missing activity field ${field}`, () => {
    const request = { ...validActivity };
    delete request[field as keyof typeof request];

    const result = validateActivityWrite(request);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.deepEqual(fieldRules(result.violations), new Set([`${field}:required`]));
    }
  });

  test(`rejects null activity field ${field}`, () => {
    const result = validateActivityWrite({ ...validActivity, [field]: null });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.deepEqual(fieldRules(result.violations), new Set([`${field}:required`]));
    }
  });
}

test("normalizes lateral name whitespace while preserving interior whitespace", () => {
  const result = validateActivityWrite({
    ...validActivity,
    name: "  Actividad  con   espacios  ",
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.name, "Actividad  con   espacios");
  }
});
