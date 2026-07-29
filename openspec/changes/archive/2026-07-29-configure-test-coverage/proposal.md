## Why

Manual dashboard checks can mutate the shared PostgreSQL seed before the
contract suite runs, and the project currently has no published coverage
report or enforceable coverage floor. The contract preparation is already
resilient in the current base; this change makes that guarantee canonical and
adds final, layer-aware quality gates after the approved dashboard and OpenAPI
work.

## What Changes

- Specify and preserve fixture restoration for every real contract test so
  external mutations cannot cause false `404` failures.
- Add one command that runs the executable suites and generates console, HTML,
  summary JSON and detailed JSON coverage reports.
- Measure lines, branches, functions and statements for all own executable
  source, including files with no execution.
- Enforce 95% for every metric in `src/domain/`, 90% in
  `src/application/`, and 80% globally.
- Report uncovered domain branches with source locations.
- Exclude only the fixture-backed `/mock-api` double and source files composed
  exclusively of types; document every exclusion.
- Run the same coverage command and thresholds in CI.
- Expand `docs/TESTING.md` without changing its principle that coverage is an
  indicator rather than the testing objective.
- Preserve `README.md` unchanged and carry its obsolete cleanup instruction
  into the closing report.

## Capabilities

### New Capabilities

- `test-coverage-reporting`: Reproducible four-metric collection, HTML and
  console publication, differentiated threshold enforcement, justified
  exclusions, layer summaries and uncovered-domain-branch reporting.

### Modified Capabilities

- `project-scaffold`: Extend the PostgreSQL CI quality gate so the shared
  coverage command and differentiated thresholds must pass.
- `evm-http-surface`: Make restoration of the canonical fixture an explicit
  preparation guarantee for every real contract test.

## Impact

The change affects test scripts, coverage configuration and policy code,
policy tests, `package.json` and its lockfile, `.gitignore`,
`.github/workflows/ci.yml`, `docs/TESTING.md`, and the two named OpenSpec
capabilities. It adds a pinned development dependency for V8/Istanbul coverage.
It does not change product behavior, HTTP routes, database schema, PRD, ADR,
fixture, OpenAPI or README.
