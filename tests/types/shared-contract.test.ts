import { execFile } from "node:child_process";
import { rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { test } from "node:test";

import {
  loadFixture,
  stripFixtureMetadata,
} from "../../src/infrastructure/mock/fixture";

const generatedProbePath = resolve(
  "tests/types/.shared-contract-fixture.generated.ts",
);

function runTypeScriptProbe(): Promise<void> {
  return new Promise((resolveProbe, rejectProbe) => {
    execFile(
      process.execPath,
      [
        resolve("node_modules/typescript/bin/tsc"),
        "--noEmit",
        "--pretty",
        "false",
        "--target",
        "ES2022",
        "--module",
        "esnext",
        "--moduleResolution",
        "bundler",
        "--skipLibCheck",
        "--strict",
        generatedProbePath,
      ],
      { cwd: process.cwd() },
      (error, stdout, stderr) => {
        if (error) {
          rejectProbe(
            new Error(`${stdout}${stderr}`.trim() || error.message, {
              cause: error,
            }),
          );
          return;
        }

        resolveProbe();
      },
    );
  });
}

test("the stripped fixture read payload satisfies ProjectAnalysis", async () => {
  const payload = stripFixtureMetadata(loadFixture().readResponse);
  const source = [
    'import type { ProjectAnalysis } from "../../src/shared/contract";',
    `const payload = ${JSON.stringify(payload)} as const satisfies ProjectAnalysis;`,
    "void payload;",
    "",
  ].join("\n");

  await writeFile(generatedProbePath, source, "utf8");

  try {
    await runTypeScriptProbe();
  } finally {
    await rm(generatedProbePath, { force: true });
  }
});
