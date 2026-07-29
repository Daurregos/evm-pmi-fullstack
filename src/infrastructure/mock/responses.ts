import {
  type FixtureResponse,
  type JsonValue,
  loadFixture,
  stripFixtureMetadata,
} from "@/infrastructure/mock/fixture";

export interface MockHttpResponse {
  body: JsonValue;
  status: number;
}

export function jsonMockResponse(response: MockHttpResponse): Response {
  return Response.json(response.body, {
    headers: {
      "x-mock-instance": process.env.MOCK_INSTANCE_ID ?? "",
    },
    status: response.status,
  });
}

const fixture = loadFixture();
const mockScenarios = [
  "malformedRequest",
  "notFound",
  "validationFailed",
] as const;

function fromFixture(response: FixtureResponse): MockHttpResponse {
  return {
    body: response.expectedBody,
    status: response.expectedStatus,
  };
}

function errorOverride(request: Request): MockHttpResponse | undefined {
  const scenario = request.headers.get("x-mock-scenario");

  if (
    scenario !== null &&
    mockScenarios.some((candidate) => candidate === scenario)
  ) {
    return fromFixture(fixture.errorEnvelopes[scenario]);
  }

  return undefined;
}

export function selectProjectCollectionResponse(
  request: Request,
): MockHttpResponse {
  return errorOverride(request) ?? fromFixture(fixture.collectionResponse);
}

export function selectProjectResponse(
  request: Request,
  projectId: string,
): MockHttpResponse {
  const override = errorOverride(request);
  if (override) {
    return override;
  }

  if (projectId === "1") {
    return {
      body: stripFixtureMetadata(fixture.readResponse),
      status: fixture.successResponses.getProject.expectedStatus,
    };
  }

  if (projectId === "2") {
    return {
      body: stripFixtureMetadata(fixture.emptyProject),
      status: fixture.successResponses.getProject.expectedStatus,
    };
  }

  return fromFixture(fixture.errorEnvelopes.notFound);
}
