import { readFileSync } from "node:fs";

import type {
  ErrorEnvelope,
  IndexResult,
  ProjectAnalysis,
  ProjectListItem,
  ProjectRead,
} from "../../src/shared/contract";

/** Los cuatro capturados numéricos que el fixture escribe en un `$input`. */
export type ActivityCapture = Readonly<{
  bac: number;
  plannedProgress: number;
  actualProgress: number;
  ac: number;
}>;

type JsonObject = { [key: string]: JsonValue };
type JsonValue = JsonObject | JsonValue[] | boolean | number | string | null;

const fixture = JSON.parse(
  readFileSync("contracts/evm/evm-fixture.json", "utf8"),
) as JsonObject;

function stripFixtureMetadata(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map(stripFixtureMetadata);
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !key.startsWith("$"))
        .map(([key, child]) => [key, stripFixtureMetadata(child)]),
    );
  }

  return value;
}

function fixtureSection(name: string): JsonObject {
  return fixture[name] as JsonObject;
}

/** `GET /projects` de `collectionResponse`. */
export const projectCollection = (fixtureSection("collectionResponse")
  .expectedBody as unknown) as readonly ProjectListItem[];

/** `GET /projects/1` una vez eliminadas las claves con prefijo `$`. */
export const referenceAnalysis = stripFixtureMetadata(
  fixture.readResponse,
) as unknown as ProjectAnalysis;

/** `GET /projects/2`: el proyecto sin actividades del PRD §7.1. */
export const emptyAnalysis = stripFixtureMetadata(
  fixture.emptyProject,
) as unknown as ProjectAnalysis;

/** Envolvente de error de `errorEnvelopes`, con su estado HTTP. */
export function errorEnvelope(scenario: string): {
  body: ErrorEnvelope;
  status: number;
} {
  const envelope = fixtureSection("errorEnvelopes")[scenario] as JsonObject;

  return {
    body: envelope.expectedBody as unknown as ErrorEnvelope,
    status: envelope.expectedStatus as number,
  };
}

function bandCase(caseId: string): JsonObject {
  const cases = fixtureSection("neutralBandChecks").cases as JsonObject[];
  const found = cases.find((candidate) => candidate.$id === caseId);

  if (found === undefined) {
    throw new Error(`Unknown neutral band case: ${caseId}`);
  }

  return found;
}

/**
 * Índices esperados de un caso de `neutralBandChecks`, donde el marcador es lo
 * único que distingue dos valores que redondean igual.
 */
export function bandCaseIndexes(caseId: string): {
  cpi: IndexResult;
  spi: IndexResult;
} {
  const expected = bandCase(caseId).$expected as JsonObject;

  return {
    cpi: expected.cpi as unknown as IndexResult,
    spi: expected.spi as unknown as IndexResult,
  };
}

/**
 * Datos capturados de un caso de `neutralBandChecks`. El fixture los escribe
 * con decimales, así que sirven de oráculo de lo que el usuario digitó.
 */
export function bandCaseInput(caseId: string): ActivityCapture {
  return bandCase(caseId).$input as unknown as ActivityCapture;
}

/** Representación de lectura de un proyecto, según `readResponse.project`. */
export const referenceProject = referenceAnalysis.project;

/** Representación de lectura de una actividad, según `readResponse`. */
export const referenceActivity = referenceAnalysis.activities[0];

/**
 * Envolvente esperada de un caso de `validationChecks`. Es el oráculo de las
 * infracciones que el cliente debe ubicar junto a su campo.
 */
export function validationCase(caseId: string): {
  body: ErrorEnvelope;
  status: number;
} {
  const cases = fixtureSection("validationChecks").cases as JsonObject[];
  const found = cases.find((candidate) => candidate.$id === caseId);

  if (found === undefined) {
    throw new Error(`Unknown validation case: ${caseId}`);
  }

  return {
    body: found.expectedBody as unknown as ErrorEnvelope,
    status: found.expectedStatus as number,
  };
}

/** Petición recibida por la API simulada. */
export interface SimulatedCall {
  /** Verbo HTTP; `GET` cuando la petición no lleva `init`. */
  readonly method: string;
  /** Ruta solicitada, sin la base. */
  readonly path: string;
  /** Cuerpo JSON enviado, o `undefined` cuando no hay cuerpo. */
  readonly body: unknown;
}

export interface SimulatedApiOptions {
  /** Análisis servido por identificador de proyecto. */
  readonly analysisByProjectId?: Readonly<Record<string, ProjectAnalysis>>;
  /** Colección servida en `GET /projects`. */
  readonly collection?: readonly ProjectListItem[];
  /** Escenario de `errorEnvelopes` con el que responder toda petición. */
  readonly failWithScenario?: string;
  /**
   * Escenario con el que rechazar toda escritura: un caso de
   * `validationChecks` —`V1`…`V13`— o un escenario de `errorEnvelopes`.
   */
  readonly writeFailure?: string;
  /**
   * Número de lecturas de análisis que fallan por red antes de responder. Sirve
   * para provocar el refresco fallido de ADR-007.
   */
  readonly failingReads?: number;
  /** Análisis servido después de una escritura exitosa. */
  readonly analysisAfterWrite?: ProjectAnalysis;
  /** Colección servida después de una escritura exitosa. */
  readonly collectionAfterWrite?: readonly ProjectListItem[];
  /** Cuerpo del `201` de `POST /projects`. */
  readonly createdProject?: ProjectRead;
}

export interface SimulatedApi {
  /** Rutas solicitadas, en orden. */
  readonly requests: readonly string[];
  /** Peticiones recibidas con su verbo y su cuerpo, en orden. */
  readonly calls: readonly SimulatedCall[];
  readonly fetch: (input: string, init?: RequestInit) => Promise<Response>;
}

const notFoundBody = errorEnvelope("notFound");

function failureBody(scenario: string): {
  body: ErrorEnvelope;
  status: number;
} {
  const cases = fixtureSection("validationChecks").cases as JsonObject[];

  return cases.some((candidate) => candidate.$id === scenario)
    ? validationCase(scenario)
    : errorEnvelope(scenario);
}

function requestBody(init: RequestInit | undefined): unknown {
  return typeof init?.body === "string"
    ? (JSON.parse(init.body) as unknown)
    : undefined;
}

/**
 * API simulada que sirve el fixture sobre las rutas de ADR-006a, incluidas las
 * ocho operaciones publicadas. Sustituye al mock HTTP en el nivel de cliente sin
 * levantar Next: las escrituras devuelven los estados y las formas de
 * `successResponses`, y los rechazos, las envolventes del fixture.
 */
export function createSimulatedApi(
  options: SimulatedApiOptions = {},
): SimulatedApi {
  const analysisByProjectId = options.analysisByProjectId ?? {
    1: referenceAnalysis,
    2: emptyAnalysis,
  };
  const requests: string[] = [];
  const calls: SimulatedCall[] = [];
  let written = false;
  let pendingReadFailures = options.failingReads ?? 0;

  function collectionNow(): readonly ProjectListItem[] {
    return written && options.collectionAfterWrite !== undefined
      ? options.collectionAfterWrite
      : (options.collection ?? projectCollection);
  }

  function analysisNow(projectId: string): ProjectAnalysis | undefined {
    return written && options.analysisAfterWrite !== undefined
      ? options.analysisAfterWrite
      : analysisByProjectId[projectId];
  }

  function writeResponse(method: string, pathname: string): Response {
    if (method === "DELETE") {
      return new Response(null, { status: 204 });
    }

    const created = method === "POST";
    const status = created ? 201 : 200;

    if (pathname.includes("/activities")) {
      return Response.json(referenceActivity, { status });
    }

    return Response.json(options.createdProject ?? referenceProject, {
      status,
    });
  }

  return {
    calls,
    requests,
    async fetch(input: string, init?: RequestInit): Promise<Response> {
      const method = init?.method ?? "GET";
      const { pathname } = new URL(input, "http://simulated.test");

      requests.push(input);
      calls.push({ body: requestBody(init), method, path: pathname });

      if (options.failWithScenario !== undefined) {
        const failure = errorEnvelope(options.failWithScenario);
        return Response.json(failure.body, { status: failure.status });
      }

      if (method !== "GET") {
        if (options.writeFailure !== undefined) {
          const failure = failureBody(options.writeFailure);
          return Response.json(failure.body, { status: failure.status });
        }

        written = true;
        return writeResponse(method, pathname);
      }

      if (pathname.endsWith("/projects")) {
        return Response.json(collectionNow(), { status: 200 });
      }

      if (pendingReadFailures > 0) {
        pendingReadFailures = pendingReadFailures - 1;
        throw new TypeError("fetch failed");
      }

      const projectId = pathname.slice(pathname.lastIndexOf("/") + 1);
      const analysis = analysisNow(projectId);

      if (analysis === undefined) {
        return Response.json(notFoundBody.body, {
          status: notFoundBody.status,
        });
      }

      return Response.json(analysis, { status: 200 });
    },
  };
}
