export type WriteInput = Readonly<Record<string, unknown>>;

export type ParsedWrite =
  | Readonly<{ ok: true; value: WriteInput }>
  | Readonly<{ ok: false }>;

type FieldType = "number" | "string";

const projectTypes: Readonly<Record<string, FieldType>> = {
  name: "string",
  cutoffDate: "string",
};

const activityTypes: Readonly<Record<string, FieldType>> = {
  name: "string",
  bac: "number",
  plannedProgress: "number",
  actualProgress: "number",
  ac: "number",
};

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function isFullDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year === 0 || month < 1 || month > 12) {
    return false;
  }

  const daysInMonth = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  return day >= 1 && day <= daysInMonth[month - 1]!;
}

async function parse(
  request: Request,
  types: Readonly<Record<string, FieldType>>,
  validateDate: boolean,
): Promise<ParsedWrite> {
  let value: unknown;
  try {
    value = await request.json();
  } catch {
    return { ok: false };
  }

  if (!isObject(value)) {
    return { ok: false };
  }

  for (const [field, expectedType] of Object.entries(types)) {
    const candidate = value[field];
    if (candidate === undefined || candidate === null) {
      continue;
    }

    if (
      expectedType === "number"
        ? typeof candidate !== "number" || !Number.isFinite(candidate)
        : typeof candidate !== "string"
    ) {
      return { ok: false };
    }
  }

  if (
    validateDate &&
    typeof value.cutoffDate === "string" &&
    !isFullDate(value.cutoffDate)
  ) {
    return { ok: false };
  }

  return { ok: true, value };
}

export function parseProjectWrite(request: Request): Promise<ParsedWrite> {
  return parse(request, projectTypes, true);
}

export function parseActivityWrite(request: Request): Promise<ParsedWrite> {
  return parse(request, activityTypes, false);
}
