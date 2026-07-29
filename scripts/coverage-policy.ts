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
      const percentage =
        counts.total === 0 ? 100 : (counts.covered / counts.total) * 100;
      return [metric, { ...counts, pct: percentage, percentage }];
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
  const files = Object.entries(report).filter(
    ([filename]) => filename !== "total",
  );
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
          throw new Error(
            `Missing branch map entry ${branchId} for ${coverage.path}`,
          );
        }
        return counts.flatMap((count, alternative) => {
          if (count !== 0) return [];
          const location = branch.locations[alternative]?.start;
          if (!location) {
            throw new Error(
              `Missing branch location ${branchId}.${alternative} for ${coverage.path}`,
            );
          }
          return [
            {
              alternative,
              column: location.column,
              file: portableRelative(root, coverage.path),
              line: location.line,
              type: branch.type,
            },
          ];
        });
      }),
    )
    .sort(
      (left, right) =>
        left.file.localeCompare(right.file) ||
        left.line - right.line ||
        left.column - right.column ||
        left.alternative - right.alternative,
    );
}
