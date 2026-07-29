## 1. Application boundary

- [ ] 1.1 Define validation commands, business-result types and accumulated project/activity validators without altering shared DTOs.
- [ ] 1.2 Extend the EvmRepository port with generated-id CRUD, project lookup with activities, selector listing and scoped delete operations.
- [ ] 1.3 Add pure application adapters that normalize stored percentages for domain calculation and materialize ProjectAnalysis, ActivityRead and ProjectRead without rounding.

## 2. Drizzle persistence

- [ ] 2.1 Implement every expanded repository operation with the existing schema, mapper and PostgreSQL numeric representation.
- [ ] 2.2 Ensure project/activity replacements and deletes report absence without writing derived fields, history or activity cutoff data.
- [ ] 2.3 Keep project deletion as one database cascade operation and activity deletion scoped to its parent project.

## 3. Use cases and validation

- [ ] 3.1 Implement create, replace, delete and list project use cases with validation-before-mutation behavior.
- [ ] 3.2 Implement create, replace and delete activity use cases with project ownership checks and derived read representations.
- [ ] 3.3 Implement project-analysis use case by loading the current photo and invoking the domain module only.

## 4. Fixture-backed PostgreSQL tests

- [ ] 4.1 Add failing integration tests for all fixture validation checks, required-field absence/null coverage, normalization and state intactness.
- [ ] 4.2 Add failing integration tests for fixture analysis, each captured-field edit, name/cutoff invariance, list and single-photo semantics.
- [ ] 4.3 Add failing integration tests for cascade, sibling preservation, no derived persistence and rollback when a temporary PostgreSQL trigger fails mid-cascade.
- [ ] 4.4 Implement the minimum production changes for each RED test and run the affected tests to GREEN.

## 5. Architecture and change tracking

- [ ] 5.1 Write docs/ARCHITECTURE.md from the implemented code, covering layers, lint rules, request journey, calculation boundary, all ten ADRs and the A2/mock limitation.
- [ ] 5.2 Mark completed OpenSpec tasks immediately after their implementation and evidence are complete.

## 6. Verification

- [ ] 6.1 Run fresh integration, domain, typecheck, lint, import, contract, full-suite and build commands; inspect all output.
- [ ] 6.2 Contrast every applicable ADR verification statement and OpenSpec task with the final diff, run git diff --check and confirm only slice files are staged for commits.
- [ ] 6.3 Review final branch, commit logical changes and confirm its unpublished PR destination would be develop without merging.
