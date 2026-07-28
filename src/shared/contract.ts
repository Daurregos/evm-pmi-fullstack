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

export type ProjectCollectionItem = Readonly<{
  id: number;
  name: string;
}>;
