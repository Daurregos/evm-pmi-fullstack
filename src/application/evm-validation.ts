import type { ContractViolation } from "@/shared/contract";

export type ValidatedProjectWrite = Readonly<{
  name: string;
  cutoffDate: string;
}>;

export type ValidatedActivityWrite = Readonly<{
  name: string;
  bac: number;
  plannedProgress: number;
  actualProgress: number;
  ac: number;
}>;

export type ValidationResult<T> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false; violations: readonly ContractViolation[] }>;

type WriteInput = Readonly<Record<string, unknown>>;

const projectFields = ["name", "cutoffDate"] as const;
const activityFields = [
  "name",
  "bac",
  "plannedProgress",
  "actualProgress",
  "ac",
] as const;

const projectReadOnlyFields = new Set(["id"]);
const activityReadOnlyFields = new Set([
  "id",
  "pv",
  "ev",
  "cv",
  "sv",
  "cpi",
  "spi",
  "eac",
  "vac",
]);

function violation(
  field: string,
  rule: ContractViolation["rule"],
  message: string,
): ContractViolation {
  return { field, rule, message };
}

function required(
  input: WriteInput,
  field: string,
  violations: ContractViolation[],
): boolean {
  if (input[field] === undefined || input[field] === null) {
    violations.push(violation(field, "required", "Es obligatorio."));
    return true;
  }

  return false;
}

function validateName(
  input: WriteInput,
  violations: ContractViolation[],
): string | undefined {
  if (required(input, "name", violations)) {
    return undefined;
  }

  if (typeof input.name !== "string") {
    throw new TypeError("El nombre debe haber superado la validación estructural.");
  }

  const name = input.name.trim();
  if (name.length === 0) {
    violations.push(violation("name", "required", "Es obligatorio."));
    return undefined;
  }

  return name;
}

function validateProjectExtras(
  input: WriteInput,
  violations: ContractViolation[],
): void {
  for (const field of Object.keys(input)) {
    if (projectFields.includes(field as (typeof projectFields)[number])) {
      continue;
    }

    violations.push(
      projectReadOnlyFields.has(field)
        ? violation(
            field,
            "read_only",
            "Es un campo de solo lectura y no se admite en una escritura.",
          )
        : violation(field, "unknown", "No pertenece al esquema de escritura."),
    );
  }
}

function validateActivityExtras(
  input: WriteInput,
  violations: ContractViolation[],
): void {
  for (const field of Object.keys(input)) {
    if (activityFields.includes(field as (typeof activityFields)[number])) {
      continue;
    }

    violations.push(
      activityReadOnlyFields.has(field)
        ? violation(
            field,
            "read_only",
            "Es un campo de solo lectura y no se admite en una escritura.",
          )
        : violation(field, "unknown", "No pertenece al esquema de escritura."),
    );
  }
}

function validateNumber(
  input: WriteInput,
  field: "bac" | "plannedProgress" | "actualProgress" | "ac",
  violations: ContractViolation[],
): number | undefined {
  if (required(input, field, violations)) {
    return undefined;
  }

  const value = input[field];
  if (typeof value !== "number") {
    throw new TypeError(
      `${field} debe haber superado la validación estructural.`,
    );
  }

  if (field === "bac" && value <= 0) {
    violations.push(violation(field, "positive", "Debe ser positivo."));
  }
  if (field === "ac" && value < 0) {
    violations.push(violation(field, "non_negative", "No puede ser negativo."));
  }
  if (
    (field === "plannedProgress" || field === "actualProgress") &&
    (value < 0 || value > 100)
  ) {
    violations.push(
      violation(field, "range_0_100", "Debe estar entre 0 y 100."),
    );
  }

  return value;
}

export function validateProjectWrite(
  input: WriteInput,
): ValidationResult<ValidatedProjectWrite> {
  const violations: ContractViolation[] = [];
  const name = validateName(input, violations);
  const cutoffDateRequired = required(input, "cutoffDate", violations);

  if (!cutoffDateRequired && typeof input.cutoffDate !== "string") {
    throw new TypeError(
      "cutoffDate debe haber superado la validación estructural.",
    );
  }

  validateProjectExtras(input, violations);
  if (violations.length > 0) {
    return { ok: false, violations };
  }

  return {
    ok: true,
    value: { name: name as string, cutoffDate: input.cutoffDate as string },
  };
}

export function validateActivityWrite(
  input: WriteInput,
): ValidationResult<ValidatedActivityWrite> {
  const violations: ContractViolation[] = [];
  const name = validateName(input, violations);
  const bac = validateNumber(input, "bac", violations);
  const plannedProgress = validateNumber(input, "plannedProgress", violations);
  const actualProgress = validateNumber(input, "actualProgress", violations);
  const ac = validateNumber(input, "ac", violations);

  validateActivityExtras(input, violations);
  if (violations.length > 0) {
    return { ok: false, violations };
  }

  return {
    ok: true,
    value: {
      name: name as string,
      bac: bac as number,
      plannedProgress: plannedProgress as number,
      actualProgress: actualProgress as number,
      ac: ac as number,
    },
  };
}
