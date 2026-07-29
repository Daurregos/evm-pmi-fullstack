import { readFileSync } from "node:fs";

import type {
  ErrorEnvelope,
  IndexResult,
  ProjectAnalysis,
  ProjectListItem,
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

export interface SimulatedApiOptions {
  /** Análisis servido por identificador de proyecto. */
  readonly analysisByProjectId?: Readonly<Record<string, ProjectAnalysis>>;
  /** Colección servida en `GET /projects`. */
  readonly collection?: readonly ProjectListItem[];
  /** Escenario de `errorEnvelopes` con el que responder toda petición. */
  readonly failWithScenario?: string;
}

export interface SimulatedApi {
  /** Rutas solicitadas, en orden. */
  readonly requests: readonly string[];
  readonly fetch: (input: string) => Promise<Response>;
}

const notFoundBody = errorEnvelope("notFound");

/**
 * API simulada que sirve el fixture sobre las rutas de ADR-006a. Sustituye al
 * mock HTTP en el nivel de cliente sin levantar Next.
 */
export function createSimulatedApi(
  options: SimulatedApiOptions = {},
): SimulatedApi {
  const collection = options.collection ?? projectCollection;
  const analysisByProjectId = options.analysisByProjectId ?? {
    1: referenceAnalysis,
    2: emptyAnalysis,
  };
  const requests: string[] = [];

  return {
    requests,
    async fetch(input: string): Promise<Response> {
      requests.push(input);

      if (options.failWithScenario !== undefined) {
        const failure = errorEnvelope(options.failWithScenario);
        return Response.json(failure.body, { status: failure.status });
      }

      const { pathname } = new URL(input, "http://simulated.test");

      if (pathname.endsWith("/projects")) {
        return Response.json(collection, { status: 200 });
      }

      const projectId = pathname.slice(pathname.lastIndexOf("/") + 1);
      const analysis = analysisByProjectId[projectId];

      if (analysis === undefined) {
        return Response.json(notFoundBody.body, {
          status: notFoundBody.status,
        });
      }

      return Response.json(analysis, { status: 200 });
    },
  };
}
