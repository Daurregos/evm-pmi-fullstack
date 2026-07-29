## Context

The repository uses Node's built-in test runner through several npm scripts.
The executable suites span pure TypeScript, React components, PostgreSQL and a
Next.js process started by the contract runner. CI invokes those suites
separately and does not currently collect coverage.

The current base already restores the fixture in `beforeEach` for both real
contract files. That implementation was verified by deleting the canonical
project through the backend between two successful 67-test contract runs.
This change must preserve that behavior, make it canonical, and introduce
coverage without changing the runner or any closed product artifact.

## Goals / Non-Goals

**Goals:**

- Generate line, branch, function and statement coverage in console and HTML
  through one command.
- Include every own executable source file, including unexecuted files.
- Enforce 95% per metric for domain, 90% for application and 80% globally.
- Print actual layer percentages and source locations for uncovered domain
  branches.
- Apply the same command and thresholds in CI.
- Keep every exclusion explicit, minimal and documented.
- Preserve deterministic fixture restoration for the whole real contract
  suite.

**Non-Goals:**

- Change product, domain, persistence or HTTP behavior.
- Modify PRD, ADR, fixture, OpenAPI or README.
- Replace `node --test`.
- Treat a percentage as a substitute for behavioral or ADR verification.
- Add tests or exclusions whose only purpose is increasing a metric.

## Decisions

### Collect with `c8` across the existing process tree

The coverage command will run the existing executable test scripts under
`c8`. V8 coverage propagates to Node descendants and `c8` remaps the result to
the TypeScript sources. Reporters `text`, `html`, `json-summary` and `json`
provide the required human and machine-readable outputs.

Native `node --test` coverage was rejected because it does not directly supply
the required HTML and statement metric. Migrating to Vitest was rejected
because it would replace the approved runner and enlarge the change.

### Define the measured universe before exclusions

Coverage uses `all: true` and includes `src/**/*.ts` and `src/**/*.tsx`.
Explicit exclusions are limited to `src/app/mock-api/**`,
`src/infrastructure/mock/**`, `src/application/evm-repository.ts` and
`src/shared/contract.ts`. The first two form the fixture-backed test double;
the last two contain types only. Configuration, scripts, tests, migrations and
generated non-source artifacts are outside `src` and therefore outside the
universe.

### Enforce aggregate counters with repository-owned policy code

A small TypeScript policy module will aggregate `covered` and `total` counters
from `coverage-summary.json` rather than average file percentages. It will
evaluate statements, branches, functions and lines independently for global,
domain and application scopes. Missing required scopes and malformed reports
will fail.

The CLI will also read `coverage-final.json` and print every zero-count branch
alternative under `src/domain/` using its remapped source location. The policy
module remains pure enough to test with synthetic reports before wiring the
CLI.

Using only `c8` global or per-file thresholds was rejected because neither
models the required directory aggregates. Separate coverage runs per layer
were rejected because they would multiply suite cost and risk inconsistent
inputs.

### Keep environment preparation outside the covered process

The coverage shell script will start Docker Compose only when `CI` is not
true, then always migrate PostgreSQL. It will launch only the executable suites
under `c8`; typecheck and lint remain independent quality gates because they do
not execute product behavior.

CI will retain installation, lint, import rules and typecheck, then call the
same `npm run test:coverage` command against its PostgreSQL service. Existing
individual test steps will be replaced to avoid duplicate suite execution.

### Preserve contract restoration instead of adding another reset

The two real contract files already acquire the shared advisory lock and run
the same truncate-plus-seed preparation before each test. The implementation
will be preserved. A specification scenario and final clean/mutate/rerun
verification supply regression evidence without duplicating reset logic or
editing README.

## Risks / Trade-offs

- **Child processes may not flush V8 coverage** → Run an early measurement and
  audit that Next-served source appears in JSON and HTML before relying on the
  percentages.
- **Source maps may attribute compiled code incorrectly** → Compare every
  reported path with the real `src` tree and inspect representative HTML
  pages.
- **A strong global number may hide a weak layer** → Aggregate and enforce
  domain and application separately.
- **An unimported file may disappear** → Use `all: true` with explicit source
  includes.
- **Exclusions may drift** → Test the exact configuration and document the
  same list in `docs/TESTING.md`.
- **Coverage can lengthen CI** → Execute each suite once, inside the coverage
  command.

## Migration Plan

1. Add failing policy and configuration tests.
2. Add the pinned coverage dependency, configuration, policy module and CLI.
3. Add the single orchestration command and confirm actual reports.
4. If approved thresholds reveal uncovered behavior, add meaningful tests
   against the authoritative fixture or applicable decision; never lower a
   threshold.
5. Update CI and `docs/TESTING.md`.
6. Demonstrate the green gate, a temporary red threshold, restoration, and the
   contract clean/mutate/rerun sequence.
7. Archive the OpenSpec change only after all evidence is fresh.

Rollback removes the coverage dependency, command, policy and CI step while
leaving product/runtime behavior unchanged. Generated `coverage/` is ignored
and can be discarded at any time.

## Open Questions

None. The user approved continuing on the current `origin/develop`, as well as
the design and implementation plan.
