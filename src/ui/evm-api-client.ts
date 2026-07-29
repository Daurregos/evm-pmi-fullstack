import type {
  ActivityRead,
  ActivityWrite,
  ContractViolation,
  ErrorCode,
  ErrorEnvelope,
  ProjectAnalysis,
  ProjectListItem,
  ProjectRead,
  ProjectWrite,
} from "@/shared/contract";

import { buildEvmApiUrl } from "@/ui/api-base-url";

/** Implementación de `fetch` que el consumidor puede sustituir. */
export type FetchLike = (
  input: string,
  init?: RequestInit,
) => Promise<Response>;

/**
 * Fallo de una operación del API. Conserva el estado HTTP y, cuando la respuesta
 * trae la envolvente de ADR-009, su `code`, su `message` y sus `violations`.
 * Quien decide sobre el fallo usa los enumerados; el texto solo se muestra.
 */
export class EvmApiError extends Error {
  readonly status: number;
  readonly code: ErrorCode | undefined;
  readonly violations: readonly ContractViolation[];

  constructor(
    status: number,
    message: string,
    code?: ErrorCode,
    violations: readonly ContractViolation[] = [],
  ) {
    super(message);
    this.name = "EvmApiError";
    this.status = status;
    this.code = code;
    this.violations = violations;
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

function violationsIn(body: ErrorEnvelope): readonly ContractViolation[] {
  return Array.isArray(body.violations) ? body.violations : [];
}

async function readFailure(response: Response): Promise<EvmApiError> {
  const body = await response.json().catch(() => undefined);

  if (isErrorEnvelope(body)) {
    return new EvmApiError(
      response.status,
      body.message,
      body.code,
      violationsIn(body),
    );
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

const NO_CONTENT = 204;

/**
 * Escritura de las operaciones publicadas. El cuerpo viaja tal como lo
 * construyó el formulario: el cliente no lo redondea ni lo completa. Un `204`
 * no trae cuerpo, así que no se intenta interpretar.
 */
async function write<T>(
  method: "DELETE" | "POST" | "PUT",
  pathname: `/${string}`,
  body: unknown,
  fetchImpl: FetchLike,
  configuredBaseUrl?: string,
): Promise<T> {
  const response = await fetchImpl(
    buildEvmApiUrl(pathname, configuredBaseUrl),
    {
      body: body === undefined ? undefined : JSON.stringify(body),
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      method,
    },
  );

  if (!response.ok) {
    throw await readFailure(response);
  }

  if (response.status === NO_CONTENT) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

/** `POST /projects`: devuelve la representación de lectura del proyecto. */
export function createProject(
  body: ProjectWrite,
  fetchImpl: FetchLike = fetch,
  configuredBaseUrl?: string,
): Promise<ProjectRead> {
  return write<ProjectRead>(
    "POST",
    "/projects",
    body,
    fetchImpl,
    configuredBaseUrl,
  );
}

/** `PUT /projects/{projectId}`: reemplaza todos los campos editables. */
export function replaceProject(
  projectId: number,
  body: ProjectWrite,
  fetchImpl: FetchLike = fetch,
  configuredBaseUrl?: string,
): Promise<ProjectRead> {
  return write<ProjectRead>(
    "PUT",
    `/projects/${String(projectId)}`,
    body,
    fetchImpl,
    configuredBaseUrl,
  );
}

/** `DELETE /projects/{projectId}`: sin cuerpo, arrastra sus actividades. */
export function deleteProject(
  projectId: number,
  fetchImpl: FetchLike = fetch,
  configuredBaseUrl?: string,
): Promise<void> {
  return write<void>(
    "DELETE",
    `/projects/${String(projectId)}`,
    undefined,
    fetchImpl,
    configuredBaseUrl,
  );
}

/** `POST /projects/{projectId}/activities`. */
export function createActivity(
  projectId: number,
  body: ActivityWrite,
  fetchImpl: FetchLike = fetch,
  configuredBaseUrl?: string,
): Promise<ActivityRead> {
  return write<ActivityRead>(
    "POST",
    `/projects/${String(projectId)}/activities`,
    body,
    fetchImpl,
    configuredBaseUrl,
  );
}

/** `PUT /projects/{projectId}/activities/{activityId}`. */
export function replaceActivity(
  projectId: number,
  activityId: number,
  body: ActivityWrite,
  fetchImpl: FetchLike = fetch,
  configuredBaseUrl?: string,
): Promise<ActivityRead> {
  return write<ActivityRead>(
    "PUT",
    `/projects/${String(projectId)}/activities/${String(activityId)}`,
    body,
    fetchImpl,
    configuredBaseUrl,
  );
}

/** `DELETE /projects/{projectId}/activities/{activityId}`: sin cuerpo. */
export function deleteActivity(
  projectId: number,
  activityId: number,
  fetchImpl: FetchLike = fetch,
  configuredBaseUrl?: string,
): Promise<void> {
  return write<void>(
    "DELETE",
    `/projects/${String(projectId)}/activities/${String(activityId)}`,
    undefined,
    fetchImpl,
    configuredBaseUrl,
  );
}
