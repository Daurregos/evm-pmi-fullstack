import assert from "node:assert/strict";
import { test } from "node:test";

import { GET as getSwaggerPage } from "@/app/api-docs/route";
import { GET as getSwaggerAsset } from "@/app/api-docs/assets/[asset]/route";
import { GET as getOpenApi } from "@/app/api-docs/openapi.yaml/route";

test("the Swagger page points only to local canonical resources", async () => {
  const response = getSwaggerPage();
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.match(body, /url: "\/api-docs\/openapi\.yaml"/);
  assert.match(body, /\/api-docs\/assets\/swagger-ui-bundle\.js/);
});

test("the canonical OpenAPI handler serves the repository contract", async () => {
  const response = await getOpenApi();
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /application\/vnd\.oai\.openapi/,
  );
  assert.match(body, /^openapi: 3\.1\.0/m);
});

test("the asset handler serves its allowlist and rejects every other name", async () => {
  for (const asset of [
    "swagger-ui.css",
    "swagger-ui-bundle.js",
    "swagger-ui-standalone-preset.js",
  ]) {
    const response = await getSwaggerAsset(new Request("http://localhost"), {
      params: Promise.resolve({ asset }),
    });

    assert.equal(response.status, 200, asset);
    assert.equal(
      response.headers.get("cache-control"),
      "public, max-age=86400, immutable",
    );
    assert.ok((await response.arrayBuffer()).byteLength > 0);
  }

  const missing = await getSwaggerAsset(new Request("http://localhost"), {
    params: Promise.resolve({ asset: "package.json" }),
  });
  assert.equal(missing.status, 404);
  assert.equal(await missing.text(), "");
});
