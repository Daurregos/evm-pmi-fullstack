import type { ErrorCode } from "./errors";

export type Violation = Readonly<{
  field: string;
  rule: string;
  message: string;
}>;

export type ErrorEnvelope = Readonly<{
  code: ErrorCode;
  message: string;
  violations: readonly Violation[];
}>;

export type ProjectListItem = Readonly<{
  id: number;
  name: string;
}>;
