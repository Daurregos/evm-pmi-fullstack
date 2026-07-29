import assert from "node:assert/strict";
import { test } from "node:test";

import {
  parseActivityWrite,
  parseProjectWrite,
} from "@/infrastructure/http/request";
import {
  applicationResultResponse,
  jsonSuccess,
  malformedRequest,
  notFound,
} from "@/infrastructure/http/response";

function jsonRequest(value: unknown): Request {
  return new Request("http://localhost/projects", {
    body: JSON.stringify(value),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
}

test("project parsing accepts a real full date and optional absent fields", async () => {
  assert.deepEqual(
    await parseProjectWrite(jsonRequest({ cutoffDate: "2024-02-29" })),
    { ok: true, value: { cutoffDate: "2024-02-29" } },
  );
  assert.deepEqual(
    await parseProjectWrite(jsonRequest({ cutoffDate: null, name: undefined })),
    { ok: true, value: { cutoffDate: null } },
  );
});

for (const cutoffDate of [
  "not-a-date",
  "0000-01-01",
  "2026-00-01",
  "2026-13-01",
  "2023-02-29",
  "2024-04-31",
]) {
  test(`project parsing rejects the impossible date ${cutoffDate}`, async () => {
    assert.deepEqual(
      await parseProjectWrite(jsonRequest({ cutoffDate, name: "Proyecto" })),
      { ok: false },
    );
  });
}

test("request parsing rejects malformed JSON and non-object bodies", async () => {
  const malformed = new Request("http://localhost/projects", {
    body: "{",
    method: "POST",
  });

  assert.deepEqual(await parseProjectWrite(malformed), { ok: false });
  assert.deepEqual(await parseProjectWrite(jsonRequest(null)), { ok: false });
  assert.deepEqual(await parseProjectWrite(jsonRequest([])), { ok: false });
});

test("request parsing rejects incompatible field types and non-finite numbers", async () => {
  assert.deepEqual(
    await parseProjectWrite(jsonRequest({ cutoffDate: 42, name: "Proyecto" })),
    { ok: false },
  );
  assert.deepEqual(
    await parseActivityWrite(jsonRequest({ bac: "100", name: "Actividad" })),
    { ok: false },
  );
  assert.deepEqual(
    await parseActivityWrite(
      new Request("http://localhost/activities", {
        body: '{"bac":1e400}',
        method: "POST",
      }),
    ),
    { ok: false },
  );
});

test("activity parsing accepts captured fields without date validation", async () => {
  const value = {
    ac: 90,
    actualProgress: 40,
    bac: 100,
    cutoffDate: "not-an-activity-field",
    name: "Actividad",
    plannedProgress: 50,
  };

  assert.deepEqual(await parseActivityWrite(jsonRequest(value)), {
    ok: true,
    value,
  });
});

test("response translation emits every published envelope and success shape", async () => {
  const success = jsonSuccess({ id: 1 }, 201);
  assert.equal(success.status, 201);
  assert.deepEqual(await success.json(), { id: 1 });

  const noContent = applicationResultResponse(
    { ok: true, value: undefined },
    204,
  );
  assert.equal(noContent.status, 204);
  assert.equal(await noContent.text(), "");

  const missing = applicationResultResponse(
    { kind: "not_found", ok: false },
    200,
  );
  assert.equal(missing.status, 404);
  assert.deepEqual(await missing.json(), {
    code: "not_found",
    message: "El recurso no existe.",
    violations: [],
  });

  const validation = applicationResultResponse(
    {
      kind: "validation",
      ok: false,
      violations: [
        { field: "name", message: "Es obligatorio.", rule: "required" },
      ],
    },
    200,
  );
  assert.equal(validation.status, 422);
  assert.equal((await validation.json()).code, "validation_failed");

  assert.equal(malformedRequest().status, 400);
  assert.equal(notFound().status, 404);
});
