import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export type JsonObject = { [key: string]: JsonValue };
export type JsonValue =
  | JsonObject
  | JsonValue[]
  | boolean
  | number
  | string
  | null;

export interface MockFixture extends JsonObject {
  collectionResponse: FixtureResponse;
  emptyProject: JsonObject;
  errorEnvelopes: Record<string, FixtureResponse>;
  readResponse: JsonObject;
  successResponses: Record<string, FixtureResponse>;
}

export interface FixtureResponse extends JsonObject {
  expectedBody: JsonValue;
  expectedStatus: number;
}

export function loadFixture(): MockFixture {
  const fixturePath = resolve(
    process.cwd(),
    "contracts/evm/evm-fixture.json",
  );

  return JSON.parse(readFileSync(fixturePath, "utf8")) as MockFixture;
}

export function stripFixtureMetadata(value: JsonValue): JsonValue {
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
