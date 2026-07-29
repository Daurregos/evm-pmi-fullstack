import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  evaluateCoverage,
  findUncoveredDomainBranches,
  metricNames,
  type CoverageDetailReport,
  type CoverageSummaryReport,
} from "./coverage-policy";

const root = process.cwd();
const coverageRoot = resolve(root, "coverage");

async function readJson<T>(filename: string): Promise<T> {
  try {
    return JSON.parse(await readFile(filename, "utf8")) as T;
  } catch (error) {
    throw new Error(`Cannot read coverage report ${filename}`, { cause: error });
  }
}

function format(value: number): string {
  return `${value.toFixed(2)}%`;
}

async function main(): Promise<void> {
  const summary = await readJson<CoverageSummaryReport>(
    resolve(coverageRoot, "coverage-summary.json"),
  );
  const detail = await readJson<CoverageDetailReport>(
    resolve(coverageRoot, "coverage-final.json"),
  );
  await access(resolve(coverageRoot, "index.html"));

  const result = evaluateCoverage(summary, root);
  console.log("| Capa | Líneas | Ramas | Funciones | Sentencias |");
  console.log("|---|---:|---:|---:|---:|");
  for (const scope of ["domain", "application", "global"] as const) {
    const row = metricNames.map((metric) =>
      format(result.scopes[scope][metric].percentage),
    );
    console.log(`| ${scope} | ${row.join(" | ")} |`);
  }

  const branches = findUncoveredDomainBranches(detail, root);
  if (branches.length === 0) {
    console.log("\nRamas de dominio sin cubrir: ninguna.");
  } else {
    console.log("\nRamas de dominio sin cubrir:");
    for (const branch of branches) {
      console.log(
        `- ${branch.file}:${branch.line}:${branch.column} ` +
          `${branch.type} alternativa ${branch.alternative}`,
      );
    }
  }

  for (const violation of result.violations) {
    const actual =
      violation.actual === null
        ? "ámbito sin archivos"
        : format(violation.actual);
    console.error(
      `Cobertura insuficiente: ${violation.scope}.${violation.metric} ` +
        `${actual}; mínimo ${format(violation.required)}.`,
    );
  }
  if (result.violations.length > 0) process.exitCode = 1;
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
