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
