export const errorCodes = [
  "malformed_request",
  "not_found",
  "validation_failed",
] as const;

export type ErrorCode = (typeof errorCodes)[number];
