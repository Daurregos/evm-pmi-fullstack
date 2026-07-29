import type { UseCaseResult } from "@/application/evm-use-cases";
import type { ErrorEnvelope } from "@/shared/contract";

function errorResponse(
  status: 400 | 404 | 422,
  body: ErrorEnvelope,
): Response {
  return Response.json(body, { status });
}

export function malformedRequest(): Response {
  return errorResponse(400, {
    code: "malformed_request",
    message: "La petición no pudo interpretarse.",
    violations: [],
  });
}

export function notFound(): Response {
  return errorResponse(404, {
    code: "not_found",
    message: "El recurso no existe.",
    violations: [],
  });
}

export function jsonSuccess(value: unknown, status: 200 | 201): Response {
  return Response.json(value, { status });
}

export function applicationResultResponse<T>(
  result: UseCaseResult<T>,
  status: 200 | 201 | 204,
): Response {
  if (result.ok) {
    return status === 204
      ? new Response(null, { status })
      : jsonSuccess(result.value, status);
  }

  if (result.kind === "not_found") {
    return notFound();
  }

  return errorResponse(422, {
    code: "validation_failed",
    message: "La entrada contiene errores.",
    violations: result.violations,
  });
}
