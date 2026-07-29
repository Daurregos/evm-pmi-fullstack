import assert from "node:assert/strict";
import {
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { relative, resolve } from "node:path";
import { test } from "node:test";

const projectRoot = process.cwd();
const routeRoot = resolve(projectRoot, "src/app/projects");
const httpRoot = resolve(projectRoot, "src/infrastructure/http");
const mockRouteRoot = resolve(projectRoot, "src/app/mock-api");

function filesBelow(directory: string): string[] {
  return readdirSync(directory)
    .flatMap((entry) => {
      const path = resolve(directory, entry);
      return statSync(path).isDirectory() ? filesBelow(path) : [path];
    })
    .sort();
}

function source(path: string): string {
  return readFileSync(resolve(projectRoot, path), "utf8");
}

test("the real route tree contains exactly the four OpenAPI paths", () => {
  const routeFiles = filesBelow(routeRoot)
    .filter((path) => path.endsWith("route.ts"))
    .map((path) => relative(routeRoot, path));

  assert.deepEqual(routeFiles, [
    "[projectId]/activities/[activityId]/route.ts",
    "[projectId]/activities/route.ts",
    "[projectId]/route.ts",
    "route.ts",
  ]);
});

test("each real route exports only its published operations", () => {
  const expectedOperations: Record<string, string[]> = {
    "src/app/projects/route.ts": ["GET", "POST"],
    "src/app/projects/[projectId]/route.ts": ["DELETE", "GET", "PUT"],
    "src/app/projects/[projectId]/activities/route.ts": ["POST"],
    "src/app/projects/[projectId]/activities/[activityId]/route.ts": [
      "DELETE",
      "PUT",
    ],
  };

  for (const [path, expected] of Object.entries(expectedOperations)) {
    const operations = [
      ...source(path).matchAll(/export async function (DELETE|GET|POST|PUT)/g),
    ]
      .map((match) => match[1] as string)
      .sort();
    assert.deepEqual(operations, expected, path);
  }
});

test("real routes depend on server behavior only through infrastructure", () => {
  for (const path of filesBelow(routeRoot)) {
    const contents = readFileSync(path, "utf8");
    assert.doesNotMatch(
      contents,
      /@\/(?:application|domain|shared|ui)\//,
      relative(projectRoot, path),
    );
    assert.doesNotMatch(
      contents,
      /from ["'](?:drizzle-orm|pg|next)/,
      relative(projectRoot, path),
    );
  }
});

test("project PUT replaces captured fields without requesting analysis", () => {
  const contents = source("src/app/projects/[projectId]/route.ts");
  const putHandler = contents.match(
    /export async function PUT[\s\S]*?(?=export async function DELETE)/,
  )?.[0];

  assert.ok(putHandler);
  assert.match(putHandler, /replaceProject/);
  assert.doesNotMatch(putHandler, /getProjectAnalysis/);
});

test("HTTP translation contains no EVM calculation", () => {
  const serverFiles = [...filesBelow(routeRoot), ...filesBelow(httpRoot)];

  for (const path of serverFiles) {
    const contents = readFileSync(path, "utf8");
    assert.doesNotMatch(
      contents,
      /deriveActivity|consolidateProject|classifyIndex|calculateState/,
      relative(projectRoot, path),
    );
    assert.doesNotMatch(
      contents,
      /@\/domain\//,
      relative(projectRoot, path),
    );
  }
});

test("the fixture-backed mock stays isolated from real HTTP adapters", () => {
  const mockFiles = filesBelow(mockRouteRoot);

  assert.deepEqual(
    mockFiles.map((path) => relative(mockRouteRoot, path)),
    ["projects/[projectId]/route.ts", "projects/route.ts"],
  );

  for (const path of mockFiles) {
    const contents = readFileSync(path, "utf8");
    assert.match(contents, /@\/infrastructure\/mock\/responses/);
    assert.doesNotMatch(contents, /@\/infrastructure\/http\//);
    assert.doesNotMatch(
      contents,
      /export (?:async )?function (DELETE|POST|PUT)\b/,
    );
  }
});
