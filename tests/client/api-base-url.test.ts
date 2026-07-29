import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildEvmApiUrl,
  resolveEvmApiBaseUrl,
} from "../../src/ui/api-base-url";

test("uses the mock prefix when no public base is configured", (context) => {
  const previous = process.env.NEXT_PUBLIC_EVM_API_BASE_URL;
  delete process.env.NEXT_PUBLIC_EVM_API_BASE_URL;
  context.after(() => {
    if (previous === undefined) {
      delete process.env.NEXT_PUBLIC_EVM_API_BASE_URL;
    } else {
      process.env.NEXT_PUBLIC_EVM_API_BASE_URL = previous;
    }
  });

  assert.equal(resolveEvmApiBaseUrl(), "/mock-api");
  assert.equal(buildEvmApiUrl("/projects"), "/mock-api/projects");
});

test("normalizes a configured relative base", () => {
  assert.equal(resolveEvmApiBaseUrl(" /backend/ "), "/backend");
  assert.equal(buildEvmApiUrl("/projects", "/backend/"), "/backend/projects");
  assert.equal(buildEvmApiUrl("/projects", "/"), "/projects");
});

test("normalizes a configured absolute base", () => {
  const configured = "https://api.example.test/v1/";
  assert.equal(
    buildEvmApiUrl("/projects", configured),
    "https://api.example.test/v1/projects",
  );
});
