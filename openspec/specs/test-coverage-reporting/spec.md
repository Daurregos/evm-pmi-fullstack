# test-coverage-reporting Specification

## Purpose
TBD - created by archiving change configure-test-coverage. Update Purpose after archive.
## Requirements
### Requirement: One-command four-metric coverage report

The repository SHALL provide one npm command that prepares PostgreSQL as
needed, runs every executable test level in the current Node test runner, and
generates coverage for lines, branches, functions and statements. The command
SHALL print a console report and SHALL generate an HTML report at
`coverage/index.html` together with machine-readable summary and detailed
reports.

#### Scenario: Local coverage generation

- **WHEN** a developer runs the coverage command from a prepared clone
- **THEN** all executable suites pass and the console, HTML, summary JSON and
  detailed JSON reports describe the same execution

#### Scenario: A suite fails

- **WHEN** any executable suite exits unsuccessfully during collection
- **THEN** the coverage command exits unsuccessfully and does not approve an
  incomplete report

### Requirement: Complete executable-source universe

Coverage SHALL include every `.ts` and `.tsx` file under `src` with zero
coverage when it is not executed. It SHALL exclude only non-executable source
types and the fixture-backed `/mock-api` test double:
`src/application/evm-repository.ts`, `src/shared/contract.ts`,
`src/app/mock-api/**` and `src/infrastructure/mock/**`.

Configuration, tests, migrations, scripts, documentation and generated
non-source artifacts SHALL remain outside the measured `src` universe. No
executable product source SHALL be excluded to satisfy a threshold.

#### Scenario: Own file is never imported

- **WHEN** an executable source file under `src` is not reached by any suite
- **THEN** it appears in the report with uncovered counters rather than being
  omitted

#### Scenario: Published exclusions are audited

- **WHEN** coverage configuration and `docs/TESTING.md` are compared
- **THEN** they contain the same four explicit exclusions and a reason for
  each, with no threshold-motivated exclusion

### Requirement: Differentiated inclusive thresholds

The coverage policy SHALL aggregate raw counters rather than average file
percentages. It SHALL require at least 95% for lines, branches, functions and
statements in `src/domain/`, at least 90% for every metric in
`src/application/`, and at least 80% for every metric globally.

Each metric SHALL be evaluated independently and inclusively. A required scope
with no files, a malformed report or any percentage below its threshold SHALL
make the command exit unsuccessfully.

#### Scenario: Exact threshold passes

- **WHEN** every aggregated metric equals or exceeds the applicable threshold
- **THEN** the policy gate succeeds

#### Scenario: One metric is below its threshold

- **WHEN** any single scope and metric is below the applicable threshold
- **THEN** the policy gate fails and identifies the scope, metric, actual
  percentage and required percentage

#### Scenario: Required scope is empty

- **WHEN** the report contains no files for domain or application
- **THEN** the policy gate fails instead of treating the empty scope as fully
  covered

### Requirement: Layer publication and uncovered domain branches

The coverage command SHALL print a stable table containing the actual four
coverage percentages for domain, application and global scope. It SHALL inspect
the detailed coverage report and list every uncovered branch alternative in
`src/domain/` with file, line, column, branch type and alternative index.

#### Scenario: Domain branch is not taken

- **WHEN** a domain branch counter is zero
- **THEN** the command reports its remapped source location and the missing
  alternative without excluding it or lowering the threshold

#### Scenario: Domain has no uncovered branches

- **WHEN** every domain branch counter is positive
- **THEN** the command explicitly reports that no domain branches are missing

### Requirement: Coverage strategy remains behavioral

`docs/TESTING.md` SHALL retain the principle that coverage is an indicator and
behavioral verification is the objective. It SHALL add the differentiated
thresholds, their layer-specific rationale, the importance of branch coverage,
the report command and formats, and every exclusion with its reason.

#### Scenario: Testing guidance is inspected

- **WHEN** a contributor reads the Coverage section
- **THEN** it explains both the numerical gates and why passing them does not
  replace fixture-backed and ADR-backed assertions
