export type ErrorCode =
  | "malformed_request"
  | "not_found"
  | "validation_failed";

export type ViolationRule =
  | "required"
  | "positive"
  | "non_negative"
  | "range_0_100"
  | "read_only"
  | "unknown";

export type ContractViolation = Readonly<{
  field: string;
  rule: ViolationRule;
  message: string;
}>;

export type ErrorEnvelope = Readonly<{
  code: ErrorCode;
  message: string;
  violations: readonly ContractViolation[];
}>;

export type ProjectListItem = Readonly<{
  id: number;
  name: string;
}>;

export type ProjectWrite = Readonly<{
  name: string | null;
  cutoffDate: string | null;
}>;

export type ProjectRead = Readonly<{
  id: number;
  name: string;
  cutoffDate: string;
}>;

export type ActivityWrite = Readonly<{
  name: string | null;
  bac: number | null;
  plannedProgress: number | null;
  actualProgress: number | null;
  ac: number | null;
}>;

export type IndexStatus =
  | "unfavorable"
  | "neutral"
  | "favorable"
  | "not_evaluable";

export type IndexResult = Readonly<{
  value: number | null;
  display: string | null;
  status: IndexStatus;
  label: string;
}>;

export type ActivityRead = Readonly<{
  id: number;
  name: string;
  bac: number;
  plannedProgress: number;
  actualProgress: number;
  ac: number;
  pv: number;
  ev: number;
  cv: number;
  sv: number;
  cpi: IndexResult;
  spi: IndexResult;
  eac: number | null;
  vac: number | null;
}>;

export type ProjectSummary = Readonly<{
  bac: number;
  pv: number;
  ev: number;
  ac: number;
  cv: number;
  sv: number;
  cpi: IndexResult;
  spi: IndexResult;
  eac: number | null;
  vac: number | null;
  progress: number | null;
  activitiesWithEvAndZeroAc: number;
}>;

export type ProjectAnalysis = Readonly<{
  project: ProjectRead;
  activities: readonly ActivityRead[];
  summary: ProjectSummary;
}>;
