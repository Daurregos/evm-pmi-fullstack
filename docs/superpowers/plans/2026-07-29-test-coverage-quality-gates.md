# Test Coverage Quality Gates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate console and HTML coverage for the existing Node test suites, enforce the approved per-layer four-metric thresholds in CI, and canonize the already verified contract-fixture restoration guarantee.

**Architecture:** `c8` wraps the existing executable test scripts and emits Istanbul-compatible summary and detailed JSON alongside text and HTML. A repository-owned pure TypeScript policy module aggregates raw counters for global, domain and application scopes; a thin CLI prints the report, locates uncovered domain branches and fails thresholds. OpenSpec change `configure-test-coverage` is canonical for scope and acceptance.

**Tech Stack:** Node.js 22, TypeScript 5.9, Node test runner, `tsx`, `c8` 12.0.0, Bash, PostgreSQL 17, GitHub Actions.

---

## Canonical references

- Product and domain behavior: `docs/PRD.md`
- Test levels and oracle rules: `docs/TESTING.md`
- Applicable verification clauses: `docs/adr/001-ubicacion-logica-calculo-evm.md`, `docs/adr/002-indicadores-derivados-vs-persistidos.md`, `docs/adr/003-representacion-dinero-porcentajes-redondeo.md`, `docs/adr/004-contrato-api-indicadores-no-evaluables.md`, `docs/adr/005-modelo-temporal-foto-unica-historial.md`, `docs/adr/006a-diseno-recursos-rest.md`, `docs/adr/006b-forma-respuesta-contrato-datos.md`, `docs/adr/007-estrategia-recalculo-tras-edicion.md`, `docs/adr/008-ciclo-vida-borrado-cascada.md`, `docs/adr/009-contrato-errores-api.md`
- Coverage requirements and SDD: `openspec/changes/configure-test-coverage/`
- Approved design: `docs/superpowers/specs/2026-07-29-test-coverage-quality-gates-design.md`
- Numeric and contract oracle: `contracts/evm/evm-fixture.json`

PRD, ADR, fixture and OpenAPI are closed during this implementation. Stop and
report any contradiction rather than editing them.

## File responsibilities

- Create `.c8rc.json`: define the complete `src` universe, four exact
  exclusions and four report formats.
- Modify `.gitignore`: ignore only the generated `coverage/` tree.
- Create `scripts/coverage-policy.ts`: pure parsing, aggregation, threshold and
  uncovered-branch logic.
- Create `scripts/check-coverage.ts`: filesystem and console adapter for the
  pure policy.
- Create `scripts/run-executable-tests.sh`: one shared ordered list of
  executable suites.
- Create `scripts/coverage.sh`: local/CI database preparation, c8 execution and
  policy invocation.
- Modify `scripts/test.sh`: reuse the executable-suite list without changing
  ordinary `npm test` behavior.
- Create `tests/coverage/coverage-policy.test.ts`: unit tests for policy
  semantics.
- Create `tests/coverage/coverage-config.test.ts`: structural parity across
  configuration, docs, scripts and CI.
- Modify `package.json` and `package-lock.json`: pin `c8` and publish the two
  coverage commands.
- Modify `.github/workflows/ci.yml`: execute the shared coverage gate once.
- Modify `docs/TESTING.md`: publish rationale, thresholds, command, formats and
  exclusion reasons.
- Modify `openspec/changes/configure-test-coverage/tasks.md`: track only
  verified task completion.

### Task 1: Specify pure coverage-policy behavior

**Files:**
- Create: `tests/coverage/coverage-policy.test.ts`
- Create later: `scripts/coverage-policy.ts`
- Modify: `openspec/changes/configure-test-coverage/tasks.md`

- [ ] **Step 1: Write the failing aggregation and threshold tests**

Create `tests/coverage/coverage-policy.test.ts` with synthetic counters. Keep
all four metrics identical in helpers unless a case intentionally changes one:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  evaluateCoverage,
  findUncoveredDomainBranches,
  type CoverageDetailReport,
  type FileCoverageSummary,
  type CoverageSummaryReport,
} from "../../scripts/coverage-policy";

const metrics = ["lines", "branches", "functions", "statements"] as const;

function counters(total: number, covered: number): FileCoverageSummary {
  return Object.fromEntries(
    metrics.map((metric) => [
      metric,
      {
        covered,
        pct: total === 0 ? 100 : (covered / total) * 100,
        skipped: 0,
        total,
      },
    ]),
  ) as FileCoverageSummary;
}

function report(
  files: Record<string, FileCoverageSummary>,
): CoverageSummaryReport {
  return {
    total: counters(0, 0),
    ...files,
  };
}

test("aggregates counters instead of averaging file percentages", () => {
  const result = evaluateCoverage(
    report({
      "/repo/src/domain/decimal.ts": counters(1, 1),
      "/repo/src/domain/evm.ts": counters(99, 0),
      "/repo/src/application/evm-analysis.ts": counters(10, 9),
    }),
    "/repo",
  );

  assert.equal(result.scopes.domain.lines.percentage, 1);
  assert.equal(result.scopes.application.lines.percentage, 90);
  assert.equal(result.scopes.global.lines.percentage, (10 / 110) * 100);
});

test("accepts exact inclusive domain and application thresholds", () => {
  const result = evaluateCoverage(
    report({
      "/repo/src/domain/evm.ts": counters(20, 19),
      "/repo/src/application/evm-analysis.ts": counters(10, 9),
      "/repo/src/ui/dashboard.tsx": counters(10, 10),
    }),
    "/repo",
  );

  assert.deepEqual(result.violations, []);
  assert.equal(result.scopes.domain.lines.percentage, 95);
  assert.equal(result.scopes.application.lines.percentage, 90);
});

test("evaluates every metric independently", () => {
  const domain = counters(100, 100);
  domain.branches = { covered: 94, pct: 94, skipped: 0, total: 100 };
  const result = evaluateCoverage(
    report({
      "/repo/src/domain/evm.ts": domain,
      "/repo/src/application/evm-analysis.ts": counters(10, 10),
      "/repo/src/ui/dashboard.tsx": counters(10, 10),
    }),
    "/repo",
  );

  assert.deepEqual(
    result.violations.map(({ actual, metric, required, scope }) => ({
      actual,
      metric,
      required,
      scope,
    })),
    [{ actual: 94, metric: "branches", required: 95, scope: "domain" }],
  );
});

test("rejects a missing required scope", () => {
  const result = evaluateCoverage(
    report({
      "/repo/src/domain/evm.ts": counters(20, 20),
      "/repo/src/ui/dashboard.tsx": counters(20, 20),
    }),
    "/repo",
  );

  assert.deepEqual(result.violations, [
    {
      actual: null,
      metric: "scope",
      required: 90,
      scope: "application",
    },
  ]);
});

test("rejects malformed metric counters", () => {
  const malformed = report({
    "/repo/src/domain/evm.ts": counters(20, 20),
    "/repo/src/application/evm-analysis.ts": counters(20, 20),
  });
  delete (malformed["/repo/src/domain/evm.ts"] as Partial<
    FileCoverageSummary
  >).functions;

  assert.throws(
    () => evaluateCoverage(malformed, "/repo"),
    /Invalid functions coverage for .*src\/domain\/evm\.ts/,
  );
});

test("locates every uncovered domain branch alternative", () => {
  const detail: CoverageDetailReport = {
    "/repo/src/domain/evm.ts": {
      b: { "0": [1, 0], "1": [0] },
      branchMap: {
        "0": {
          locations: [
            { start: { column: 2, line: 10 } },
            { start: { column: 8, line: 12 } },
          ],
          type: "if",
        },
        "1": {
          locations: [{ start: { column: 4, line: 20 } }],
          type: "cond-expr",
        },
      },
      path: "/repo/src/domain/evm.ts",
    },
    "/repo/src/application/evm-analysis.ts": {
      b: { "0": [0] },
      branchMap: {
        "0": {
          locations: [{ start: { column: 0, line: 1 } }],
          type: "if",
        },
      },
      path: "/repo/src/application/evm-analysis.ts",
    },
  };

  assert.deepEqual(findUncoveredDomainBranches(detail, "/repo"), [
    {
      alternative: 1,
      column: 8,
      file: "src/domain/evm.ts",
      line: 12,
      type: "if",
    },
    {
      alternative: 0,
      column: 4,
      file: "src/domain/evm.ts",
      line: 20,
      type: "cond-expr",
    },
  ]);
});
```

- [ ] **Step 2: Run the focused tests and observe RED**

Run:

```bash
node --import tsx --test tests/coverage/coverage-policy.test.ts
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for
`scripts/coverage-policy.ts`. This is the required RED for OpenSpec tasks 1.1
and 1.2.

- [ ] **Step 3: Mark only the proven RED tasks**

Change tasks 1.1 and 1.2 to `[x]` only after the failure is observed and
recorded. Do not mark task 1.3 yet.

### Task 2: Implement aggregation, thresholds and branch discovery

**Files:**
- Create: `scripts/coverage-policy.ts`
- Test: `tests/coverage/coverage-policy.test.ts`
- Modify: `openspec/changes/configure-test-coverage/tasks.md`

- [ ] **Step 1: Implement the pure policy module**

Create `scripts/coverage-policy.ts`:

```ts
import { relative, sep } from "node:path";

export const metricNames = [
  "lines",
  "branches",
  "functions",
  "statements",
] as const;

export type MetricName = (typeof metricNames)[number];
export type MetricCounter = {
  covered: number;
  pct: number;
  skipped: number;
  total: number;
};
export type FileCoverageSummary = Record<MetricName, MetricCounter>;
export type CoverageSummaryReport = Record<string, FileCoverageSummary>;
export type BranchLocation = { start: { column: number; line: number } };
export type CoverageDetailReport = Record<
  string,
  {
    b: Record<string, number[]>;
    branchMap: Record<
      string,
      { locations: BranchLocation[]; type: string }
    >;
    path: string;
  }
>;

type ScopeName = "domain" | "application" | "global";
type ScopeMetrics = Record<
  MetricName,
  MetricCounter & { percentage: number }
>;
export type CoverageViolation = {
  actual: number | null;
  metric: MetricName | "scope";
  required: number;
  scope: ScopeName;
};
export type UncoveredBranch = {
  alternative: number;
  column: number;
  file: string;
  line: number;
  type: string;
};

const thresholds: Record<ScopeName, number> = {
  application: 90,
  domain: 95,
  global: 80,
};

function portableRelative(root: string, filename: string): string {
  return relative(root, filename).split(sep).join("/");
}

function validateCounter(
  filename: string,
  metric: MetricName,
  value: MetricCounter | undefined,
): MetricCounter {
  if (
    !value ||
    !Number.isFinite(value.total) ||
    !Number.isFinite(value.covered) ||
    !Number.isFinite(value.skipped) ||
    value.total < 0 ||
    value.covered < 0 ||
    value.covered > value.total
  ) {
    throw new Error(`Invalid ${metric} coverage for ${filename}`);
  }
  return value;
}

function aggregate(
  entries: Array<[string, FileCoverageSummary]>,
): ScopeMetrics {
  return Object.fromEntries(
    metricNames.map((metric) => {
      const counts = entries.reduce(
        (result, [filename, summary]) => {
          const value = validateCounter(filename, metric, summary[metric]);
          result.covered += value.covered;
          result.skipped += value.skipped;
          result.total += value.total;
          return result;
        },
        { covered: 0, skipped: 0, total: 0 },
      );
      return [
        metric,
        {
          ...counts,
          pct: counts.total === 0 ? 100 : (counts.covered / counts.total) * 100,
          percentage:
            counts.total === 0 ? 100 : (counts.covered / counts.total) * 100,
        },
      ];
    }),
  ) as ScopeMetrics;
}

export function evaluateCoverage(
  report: CoverageSummaryReport,
  root: string,
): {
  scopes: Record<ScopeName, ScopeMetrics>;
  violations: CoverageViolation[];
} {
  const files = Object.entries(report).filter(([filename]) => filename !== "total");
  const scopedEntries: Record<ScopeName, typeof files> = {
    application: files.filter(([filename]) =>
      portableRelative(root, filename).startsWith("src/application/"),
    ),
    domain: files.filter(([filename]) =>
      portableRelative(root, filename).startsWith("src/domain/"),
    ),
    global: files,
  };
  const scopes = Object.fromEntries(
    Object.entries(scopedEntries).map(([scope, entries]) => [
      scope,
      aggregate(entries),
    ]),
  ) as Record<ScopeName, ScopeMetrics>;
  const violations: CoverageViolation[] = [];

  for (const scope of ["domain", "application", "global"] as const) {
    const entries = scopedEntries[scope];
    if (entries.length === 0) {
      violations.push({
        actual: null,
        metric: "scope",
        required: thresholds[scope],
        scope,
      });
      continue;
    }
    for (const metric of metricNames) {
      const actual = scopes[scope][metric].percentage;
      if (actual < thresholds[scope]) {
        violations.push({
          actual,
          metric,
          required: thresholds[scope],
          scope,
        });
      }
    }
  }

  return { scopes, violations };
}

export function findUncoveredDomainBranches(
  report: CoverageDetailReport,
  root: string,
): UncoveredBranch[] {
  return Object.values(report)
    .filter(({ path }) =>
      portableRelative(root, path).startsWith("src/domain/"),
    )
    .flatMap((coverage) =>
      Object.entries(coverage.b).flatMap(([branchId, counts]) => {
        const branch = coverage.branchMap[branchId];
        if (!branch) {
          throw new Error(`Missing branch map entry ${branchId} for ${coverage.path}`);
        }
        return counts.flatMap((count, alternative) => {
          if (count !== 0) return [];
          const location = branch.locations[alternative]?.start;
          if (!location) {
            throw new Error(
              `Missing branch location ${branchId}.${alternative} for ${coverage.path}`,
            );
          }
          return [{
            alternative,
            column: location.column,
            file: portableRelative(root, coverage.path),
            line: location.line,
            type: branch.type,
          }];
        });
      }),
    )
    .sort((left, right) =>
      left.file.localeCompare(right.file) ||
      left.line - right.line ||
      left.column - right.column ||
      left.alternative - right.alternative
    );
}
```

- [ ] **Step 2: Run the focused tests and observe GREEN**

Run:

```bash
node --import tsx --test tests/coverage/coverage-policy.test.ts
```

Expected: 6 tests, 6 pass, 0 fail.

- [ ] **Step 3: Run typecheck and lint on the new unit**

Run:

```bash
npm run typecheck
npm run lint -- --no-cache
```

Expected: both commands exit 0. If TypeScript rejects mutation of the synthetic
`branches` field, type the helper return as `FileCoverageSummary`; do not weaken
production types.

- [ ] **Step 4: Commit the policy unit**

```bash
git add scripts/coverage-policy.ts tests/coverage/coverage-policy.test.ts openspec/changes/configure-test-coverage/tasks.md
git commit -m "test(coverage): define differentiated policy"
```

Expected: one logical commit containing policy, its tests and checked tasks
1.1–1.2.

### Task 3: Specify and implement collection configuration

**Files:**
- Create: `.c8rc.json`
- Modify: `.gitignore`
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `scripts/run-executable-tests.sh`
- Create: `scripts/coverage.sh`
- Modify: `scripts/test.sh`
- Create: `scripts/check-coverage.ts`
- Create: `tests/coverage/coverage-config.test.ts`
- Modify: `openspec/changes/configure-test-coverage/tasks.md`

- [ ] **Step 1: Add the structural configuration test before the files**

Create `tests/coverage/coverage-config.test.ts`:

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const expectedExclusions = [
  "src/app/mock-api/**",
  "src/application/evm-repository.ts",
  "src/infrastructure/mock/**",
  "src/shared/contract.ts",
];

test("coverage configuration measures all own executable source", () => {
  const config = JSON.parse(readFileSync(".c8rc.json", "utf8")) as {
    all: boolean;
    exclude: string[];
    extension: string[];
    include: string[];
    reporter: string[];
    "reports-dir": string;
  };
  assert.equal(config.all, true);
  assert.deepEqual(config.include, ["src/**/*.ts", "src/**/*.tsx"]);
  assert.deepEqual(config.extension, [".ts", ".tsx"]);
  assert.deepEqual([...config.exclude].sort(), expectedExclusions);
  assert.deepEqual([...config.reporter].sort(), [
    "html",
    "json",
    "json-summary",
    "text",
  ]);
  assert.equal(config["reports-dir"], "coverage");
});

test("coverage output and commands are published", () => {
  const ignored = readFileSync(".gitignore", "utf8").split("\n");
  const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
    scripts: Record<string, string>;
  };
  assert.ok(ignored.includes("coverage/"));
  assert.equal(packageJson.scripts["test:coverage"], "bash scripts/coverage.sh");
  assert.equal(
    packageJson.scripts["test:coverage-policy"],
    "node --import tsx --test 'tests/coverage/*.test.ts'",
  );
});
```

- [ ] **Step 2: Run the structural test and observe RED**

Run:

```bash
node --import tsx --test tests/coverage/coverage-config.test.ts
```

Expected: FAIL because `.c8rc.json` does not exist. Mark OpenSpec task 1.3
complete only after this RED is observed.

- [ ] **Step 3: Install the pinned collector**

Run:

```bash
npm install --save-dev --save-exact c8@12.0.0
```

Expected: `package.json` contains `"c8": "12.0.0"` and the lockfile records the
same version. Do not run `npm audit fix`; dependency-upgrade scope is separate.

- [ ] **Step 4: Add exact c8 configuration and ignore**

Create `.c8rc.json`:

```json
{
  "all": true,
  "clean": true,
  "exclude-after-remap": true,
  "extension": [".ts", ".tsx"],
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": [
    "src/app/mock-api/**",
    "src/application/evm-repository.ts",
    "src/infrastructure/mock/**",
    "src/shared/contract.ts"
  ],
  "reporter": ["text", "html", "json-summary", "json"],
  "reports-dir": "coverage",
  "temp-directory": "coverage/tmp"
}
```

Append exactly `coverage/` to `.gitignore`.

- [ ] **Step 5: Publish package commands**

Add these scripts to `package.json` without changing the existing commands:

```json
"test:coverage": "bash scripts/coverage.sh",
"test:coverage-policy": "node --import tsx --test 'tests/coverage/*.test.ts'"
```

- [ ] **Step 6: Share the executable suite order**

Create executable `scripts/run-executable-tests.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

npm run test:coverage-policy
npm run test:structure
npm run test:client
npm run test:integration
npm run test:contract
```

Modify `scripts/test.sh` to:

```bash
#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

docker compose up -d --wait
npm run db:migrate
npm run typecheck
bash scripts/run-executable-tests.sh
```

Run `chmod +x scripts/run-executable-tests.sh`; this is a mode change, not a
content rewrite.

- [ ] **Step 7: Add the console policy adapter**

Create `scripts/check-coverage.ts`:

```ts
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
      violation.actual === null ? "ámbito sin archivos" : format(violation.actual);
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
```

- [ ] **Step 8: Add the one-command orchestrator**

Create executable `scripts/coverage.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ "${CI:-}" != "true" ]]; then
  docker compose up -d --wait
fi

npm run db:migrate
rm -rf -- coverage
./node_modules/.bin/c8 bash scripts/run-executable-tests.sh
node --import tsx scripts/check-coverage.ts
```

Run `chmod +x scripts/coverage.sh`.

The explicit deletion targets only the ignored, reproducible `coverage/`
artifact within the current worktree.

- [ ] **Step 9: Run focused tests and ordinary suite**

Run:

```bash
npm run test:coverage-policy
npm test
```

Expected: policy tests pass; ordinary type, structure, client, integration and
contract tests retain their baseline results.

- [ ] **Step 10: Commit collection and enforcement**

```bash
git add .c8rc.json .gitignore package.json package-lock.json scripts/check-coverage.ts scripts/coverage-policy.ts scripts/coverage.sh scripts/run-executable-tests.sh scripts/test.sh tests/coverage/coverage-config.test.ts openspec/changes/configure-test-coverage/tasks.md
git commit -m "build(coverage): collect and enforce layer gates"
```

Expected: OpenSpec tasks 1.3 and 2.1–2.3 are checked only after their literal
tests are green.

### Task 4: Measure the real suite and close behavioral gaps

**Files:**
- Inspect: `coverage/coverage-summary.json`
- Inspect: `coverage/coverage-final.json`
- Inspect: `coverage/index.html`
- Potentially modify: tests under `tests/domain/`, `tests/integration/`,
  `tests/client/` or `tests/contract/` only when an authoritative behavior is
  missing
- Modify: `openspec/changes/configure-test-coverage/tasks.md`

- [ ] **Step 1: Generate the first real report**

Run:

```bash
npm run test:coverage
```

Expected: all suites execute and the command either passes all approved gates
or fails with exact scope/metric diagnostics. Save the complete console output
for final evidence.

- [ ] **Step 2: Audit the measured universe**

Run:

```bash
node -e 'const r=require("./coverage/coverage-summary.json"); console.log(Object.keys(r).filter(k=>k!=="total").sort().join("\n"))'
test -s coverage/index.html
```

Expected: every executable `.ts`/`.tsx` under `src` appears except the four
published exclusions; no `tests/`, `scripts/`, `.next/`, configuration or
dependency file appears; HTML is nonempty.

- [ ] **Step 3: Classify any domain or application gap**

For each missing branch printed by the policy:

1. locate the owning function in `src/domain/` or `src/application/`;
2. map it to `docs/PRD.md`, an applicable ADR verification clause and, when
   represented, a direct fixture case;
3. confirm the gap is reachable approved behavior rather than a generated
   artifact; and
4. add a failing behavioral assertion at its proper test level.

Do not edit source merely to improve coverage. Do not recalculate fixture
expectations. Do not lower 95/90/80 or add exclusions.

- [ ] **Step 4: Observe RED for each meaningful missing behavior**

Run the exact focused test file, for example:

```bash
node --import tsx --test tests/domain/evm.test.ts
```

Expected: the newly added assertion fails for the uncovered approved branch.
If the report already meets every threshold and every domain branch is covered,
record “no behavioral coverage gap” and make no test-only commit.

- [ ] **Step 5: Make only the authoritative test pass**

Use literal expected values from `contracts/evm/evm-fixture.json` when the
fixture represents the case. Re-run the focused test until green, then rerun:

```bash
npm run test:coverage
```

Expected: all gates pass. If `src/domain/` remains under 95%, stop and report
the exact uncovered branches; never weaken the policy.

- [ ] **Step 6: Commit meaningful gap coverage if any**

```bash
git add tests/domain tests/integration tests/client tests/contract openspec/changes/configure-test-coverage/tasks.md
git commit -m "test: cover approved decision branches"
```

Skip this commit entirely when no behavioral test was needed. Mark OpenSpec
task 2.4 only after source paths, JSON and HTML have been audited.

### Task 5: Publish documentation and CI parity

**Files:**
- Modify: `docs/TESTING.md`
- Modify: `.github/workflows/ci.yml`
- Modify: `tests/coverage/coverage-config.test.ts`
- Modify: `openspec/changes/configure-test-coverage/tasks.md`
- Verify unchanged: `README.md`

- [ ] **Step 1: Extend the structural test before docs and CI**

Append to `tests/coverage/coverage-config.test.ts`:

```ts
test("CI and testing guidance publish the same gate", () => {
  const ci = readFileSync(".github/workflows/ci.yml", "utf8");
  const testing = readFileSync("docs/TESTING.md", "utf8");
  assert.match(ci, /- run: npm run test:coverage/);
  assert.doesNotMatch(ci, /- run: npm run test:(?:structure|client|integration|contract)$/m);
  for (const value of ["95 %", "90 %", "80 %", "ramas", "coverage/index.html"]) {
    assert.ok(testing.includes(value), value);
  }
  for (const exclusion of expectedExclusions) {
    assert.ok(testing.includes(`\`${exclusion}\``), exclusion);
  }
});
```

- [ ] **Step 2: Run the focused test and observe RED**

Run:

```bash
npm run test:coverage-policy
```

Expected: configuration tests fail because CI and `docs/TESTING.md` do not yet
publish the new gate.

- [ ] **Step 3: Expand the existing Coverage section**

Keep the first two existing paragraphs in `docs/TESTING.md`. Append:

```markdown
### Informe reproducible

`npm run test:coverage` prepara PostgreSQL cuando se ejecuta localmente,
aplica las migraciones, corre los niveles ejecutables con el runner Node
vigente y publica el resumen en consola. El informe navegable queda en
`coverage/index.html`; `coverage/coverage-summary.json` y
`coverage/coverage-final.json` soportan la puerta y el diagnóstico.

Se miden líneas, ramas, funciones y sentencias. Las ramas son especialmente
importantes en EVM: la evaluabilidad de CPI y SPI, la banda inclusiva, los
marcadores y la diferencia entre cero definido y no evaluable pueden compartir
líneas mientras toman decisiones distintas.

### Umbrales

| Ámbito | Líneas | Ramas | Funciones | Sentencias |
|---|---:|---:|---:|---:|
| `src/domain/` | 95 % | 95 % | 95 % | 95 % |
| `src/application/` | 90 % | 90 % | 90 % | 90 % |
| Global | 80 % | 80 % | 80 % | 80 % |

Dominio exige el valor mayor porque el fixture enumera sus casos y el nivel
debe ser exhaustivo. Aplicación conserva una puerta alta sobre orquestación y
validación sin confundir adaptadores con reglas. El global impide grandes
zonas sin ejecutar sin imponer uniformidad artificial a todas las capas.
Cualquier métrica bajo su umbral rompe el comando y CI.

### Exclusiones

Solo quedan fuera del universo `src/**/*.{ts,tsx}`:

- `src/app/mock-api/**`: Route Handlers del doble que sirve el fixture.
- `src/infrastructure/mock/**`: implementación del mismo doble `/mock-api`.
- `src/application/evm-repository.ts`: puerto compuesto solo por tipos.
- `src/shared/contract.ts`: DTO y enumerados TypeScript sin implementación.

Configuración, scripts, migraciones, pruebas, documentos y artefactos
generados no pertenecen a `src` y no son código propio ejercitable del
producto. No se excluye código para alcanzar un umbral.
```

- [ ] **Step 4: Replace duplicate CI test steps with the shared command**

Keep checkout, Node setup, `npm ci`, lint, import lint and typecheck. Replace
the migration and four separate test lines in `.github/workflows/ci.yml` with:

```yaml
      - run: npm run test:coverage
```

The workflow's `CI=true` environment supplied by GitHub Actions makes
`scripts/coverage.sh` reuse the declared PostgreSQL service.

- [ ] **Step 5: Run structural policy tests and inspect README**

Run:

```bash
npm run test:coverage-policy
git diff --exit-code origin/develop -- README.md
```

Expected: all policy/config tests pass and README has no diff. Record this
line for the final report without editing it:
`truncate table projects restart identity cascade`.

- [ ] **Step 6: Commit publication**

```bash
git add .github/workflows/ci.yml docs/TESTING.md tests/coverage/coverage-config.test.ts openspec/changes/configure-test-coverage/tasks.md
git commit -m "ci: publish differentiated coverage gates"
```

Expected: OpenSpec tasks 3.1–3.3 are checked.

### Task 6: Prove contract isolation and threshold failure

**Files:**
- Temporarily modify and restore: `scripts/coverage-policy.ts`
- Verify unchanged: `README.md`
- Modify: `openspec/changes/configure-test-coverage/tasks.md`

- [ ] **Step 1: Run a clean contract suite**

Run:

```bash
npm run test:contract
```

Expected: 67 tests, 67 pass, 0 fail.

- [ ] **Step 2: Start the backend and mutate canonical state**

Run in one terminal:

```bash
npm run dev -- --hostname 127.0.0.1 --port 3100
```

After readiness, run in another:

```bash
curl --fail-with-body -sS -o /tmp/evm-coverage-delete-body -w '%{http_code}\n' -X DELETE http://127.0.0.1:3100/projects/1
```

Expected: `204`. Stop the development server with `Ctrl-C`; do not run seed or
truncate manually.

- [ ] **Step 3: Prove automatic restoration**

Run:

```bash
npm run test:contract
```

Expected: 67 tests, 67 pass, 0 fail despite the preceding delete.

- [ ] **Step 4: Record the current actual global threshold and make a temporary red**

Read the actual global metric table from:

```bash
node --import tsx scripts/check-coverage.ts
```

Temporarily change only:

```ts
const thresholds: Record<ScopeName, number> = {
  application: 90,
  domain: 95,
  global: 101,
};
```

Run:

```bash
node --import tsx scripts/check-coverage.ts
```

Expected: nonzero exit and four `global` violations, proving every metric is
enforced. The impossible temporary value is never committed.

- [ ] **Step 5: Restore the approved global threshold and prove green**

Restore `global: 80`, then run:

```bash
node --import tsx scripts/check-coverage.ts
git diff --exit-code HEAD -- scripts/coverage-policy.ts
```

Expected: exit 0 from both commands. Mark OpenSpec tasks 4.2 and 4.3 only now.

### Task 7: Fresh full verification and requirement audit

**Files:**
- Inspect: all change files and `coverage/`
- Modify: `openspec/changes/configure-test-coverage/tasks.md`
- Do not modify: `docs/PRD.md`, `docs/adr/`, `contracts/evm/`,
  `README.md`

- [ ] **Step 1: Run fresh project gates**

Run literally, in order:

```bash
npm run lint
npm run lint:imports
npm run typecheck
npm run test:coverage
npm run build
```

Expected: every command exits 0. Read complete output, including coverage table
and uncovered domain branch list.

- [ ] **Step 2: Verify generated artifacts**

Run:

```bash
test -s coverage/index.html
test -s coverage/coverage-summary.json
test -s coverage/coverage-final.json
node -e 'const r=require("./coverage/coverage-summary.json"); const files=Object.keys(r).filter(k=>k!=="total"); if(!files.some(k=>k.includes("/src/domain/"))) process.exit(1); if(!files.some(k=>k.includes("/src/application/"))) process.exit(1); console.log(files.length)'
```

Expected: all three files are nonempty and the report contains both required
layers.

- [ ] **Step 3: Audit source authority and requirements**

For every requirement and scenario in:

```bash
openspec show configure-test-coverage --json --deltas-only
```

identify direct evidence in configuration, tests, command output, CI or docs.
Contrast the result with `docs/TESTING.md` and every applicable ADR
`Verificación` section. Confirm the fixture remains the direct oracle where
represented and that no closed artifact changed.

- [ ] **Step 4: Verify formatting, territory and commit contents**

Run:

```bash
git diff --check origin/develop...HEAD
git diff --name-status origin/develop...HEAD
git diff --exit-code origin/develop -- docs/PRD.md docs/adr contracts/evm README.md
git status --short --branch
git log --oneline --decorate origin/develop..HEAD
```

Expected: no whitespace errors; only planned territory; closed artifacts and
README unchanged; generated `coverage/` absent from status; logical commits
only.

- [ ] **Step 5: Mark verified tasks and commit the evidence state**

Check OpenSpec tasks 4.1–4.4 only after all preceding outputs are fresh. Then:

```bash
git add openspec/changes/configure-test-coverage/tasks.md
git commit -m "docs(coverage): record verified quality gates"
```

Expected: tasks 1.1 through 4.4 are checked; task 4.5 remains open until
archival.

### Task 8: Archive OpenSpec and prepare branch handoff

**Files:**
- Move through OpenSpec archive:
  `openspec/changes/configure-test-coverage/`
- Modify through archive:
  `openspec/specs/test-coverage-reporting/spec.md`
  `openspec/specs/project-scaffold/spec.md`
  `openspec/specs/evm-http-surface/spec.md`
- Verify: `.github/workflows/ci.yml`

- [ ] **Step 1: Invoke the archive workflow**

Use `openspec-archive-change` and archive only
`configure-test-coverage` after confirming every implementation task except
the archive task is checked and all verification remains green.

- [ ] **Step 2: Validate the archived specs**

Run:

```bash
openspec validate --specs --strict
find openspec/changes/archive -maxdepth 1 -type d -name '*-configure-test-coverage' -print
git diff --check
```

Expected: strict validation passes and exactly one dated archive directory is
reported.

- [ ] **Step 3: Mark archival complete and commit**

Update archived `tasks.md` so task 4.5 is checked, if the archive workflow does
not preserve the final check automatically, then run:

```bash
git add openspec/specs openspec/changes/archive
git commit -m "docs(openspec): archive test coverage gates"
```

Expected: archive and canonical spec deltas are one logical commit.

- [ ] **Step 4: Run final post-archive verification**

Run:

```bash
openspec validate --specs --strict
npm run test:coverage
git diff --check origin/develop...HEAD
git status --short --branch
```

Expected: strict specs, all tests and all coverage gates pass; the branch is
clean and remains based on `origin/develop`.

- [ ] **Step 5: Prepare the closing report**

Report:

- branch and worktree path;
- exact domain, application and global percentages for lines, branches,
  functions and statements;
- every exclusion and its reason;
- every uncovered domain branch, or explicitly none;
- 67/67 clean and 67/67 post-mutation contract evidence;
- temporary threshold-failure evidence and restored green gate;
- lint, typecheck, build and coverage results;
- README unchanged plus the removable truncate line;
- preserved untracked files in the principal worktree; and
- PR status and target `develop`.

Do not create or merge a PR unless separately authorized. Do not remove the
worktree or branch before confirmed integration.
