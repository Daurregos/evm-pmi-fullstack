import type {
  ErrorCode,
  ErrorEnvelope,
  ProjectAnalysis,
  ProjectListItem,
} from "@/shared/contract";

import { buildEvmApiUrl } from "@/ui/api-base-url";

/** Implementación de `fetch` que el consumidor puede sustituir. */
export type FetchLike = (input: string) => Promise<Response>;

/**
 * Fallo de una lectura del API. Conserva el estado HTTP y, cuando la respuesta
 * trae la envolvente de ADR-009, su `code` y su `message`.
 */
export class EvmApiError extends Error {
  readonly status: number;
  readonly code: ErrorCode | undefined;

  constructor(status: number, message: string, code?: ErrorCode) {
    super(message);
    this.name = "EvmApiError";
    this.status = status;
    this.code = code;
  }
}

function isErrorEnvelope(body: unknown): body is ErrorEnvelope {
  return (
    typeof body === "object" &&
    body !== null &&
    typeof (body as { code?: unknown }).code === "string" &&
    typeof (body as { message?: unknown }).message === "string"
  );
}

async function readFailure(response: Response): Promise<EvmApiError> {
  const body = await response.json().catch(() => undefined);

  if (isErrorEnvelope(body)) {
    return new EvmApiError(response.status, body.message, body.code);
  }

  return new EvmApiError(
    response.status,
    `El servicio respondió ${String(response.status)} sin una envolvente de error.`,
  );
}

async function readJson<T>(
  pathname: `/${string}`,
  fetchImpl: FetchLike,
  configuredBaseUrl?: string,
): Promise<T> {
  const response = await fetchImpl(
    buildEvmApiUrl(pathname, configuredBaseUrl),
  );

  if (!response.ok) {
    throw await readFailure(response);
  }

  return (await response.json()) as T;
}

/** `GET /projects`: alimenta el selector con `id` y `name`. */
export function fetchProjectList(
  fetchImpl: FetchLike = fetch,
  configuredBaseUrl?: string,
): Promise<readonly ProjectListItem[]> {
  return readJson<readonly ProjectListItem[]>(
    "/projects",
    fetchImpl,
    configuredBaseUrl,
  );
}

/**
 * `GET /projects/{projectId}`: la única lectura que abastece tabla,
 * consolidado, estado visual y gráfica según ADR-006a.
 */
export function fetchProjectAnalysis(
  projectId: number,
  fetchImpl: FetchLike = fetch,
  configuredBaseUrl?: string,
): Promise<ProjectAnalysis> {
  return readJson<ProjectAnalysis>(
    `/projects/${String(projectId)}`,
    fetchImpl,
    configuredBaseUrl,
  );
}
