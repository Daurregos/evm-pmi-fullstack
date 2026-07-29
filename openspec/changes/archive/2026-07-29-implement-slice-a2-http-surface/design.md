## Context

A1 already provides business validation, project and activity use cases,
fixture-backed analysis and PostgreSQL persistence. The published OpenAPI
contract describes four resource paths and eight operations, but the App Router
only exposes `/mock-api`, which serves the client fixture without invoking A1.

ADR-006a, ADR-006b, ADR-007 and ADR-009 close the remaining HTTP decisions.
This layer must translate those decisions without changing the PRD, ADRs,
OpenAPI, fixture or completed application and domain behavior.

## Goals / Non-Goals

**Goals:**

- Expose all published operations through real Next.js routes backed by A1 and
  PostgreSQL.
- Centralize structural request interpretation and the common error envelope.
- Preserve the deliberate boundary between structural `400` and business
  `422`, including nullable required fields and open properties.
- Prove the runtime contract directly from the fixture and keep rejected state
  intact.
- Replace the pending A2 request journey in the architecture document.

**Non-Goals:**

- Change product rules, persistence, domain calculations or published contract
  artifacts.
- Add routes, fields, dependencies, authentication, logging or observability.
- Replace, redirect or remove the fixture-backed `/mock-api`.
- Recalculate project analysis as part of a project mutation.

## Decisions

### Thin App Router handlers over shared infrastructure adapters

Files under `src/app/projects/` own only Next.js handler signatures, route
parameters and operation delegation. Infrastructure owns use-case composition,
request interpretation and response translation. This keeps the route tree
visibly aligned with OpenAPI while preventing eight handlers from developing
different error semantics.

Duplicating translation per route was rejected because equivalent operations
could drift. Generating handlers from OpenAPI or adding a schema library was
rejected because the small contract has two deliberate exceptions that remain
clearer in explicit code.

### Lazy reusable PostgreSQL composition

Infrastructure lazily composes one `EvmUseCases` instance from
`DrizzleEvmRepository` and the existing database client. Laziness prevents
environment access during unrelated module discovery or build steps, while the
reused pool avoids creating a new pool for every request.

### Structural validation checks only syntax, known non-null types and formats

The parser first obtains JSON and requires an object root. It checks known
fields only when present and non-null. Project names and activity names must be
strings, activity quantities must be numbers, and `cutoffDate` must be a valid
RFC 3339 full-date in `YYYY-MM-DD` form.

Missing values, explicit `null` and additional properties are passed unchanged
to A1. A1 therefore remains responsible for `required`, numeric limits,
`read_only`, `unknown` and name normalization. Structural failures never invoke
a mutation.

### One explicit response mapper

Successful values use `Response.json` with the status fixed by OpenAPI; a
successful deletion uses a bodyless `Response` with status `204`. Application
validation results map to `422 validation_failed`, and application
`not_found` results or missing analyses map to `404 not_found`. Parsing and
structural failures map to `400 malformed_request`.

The mapper creates only the public error members and fixed human-facing
messages. It never serializes a caught error, framework response, stack trace or
database detail.

### Real contract tests coexist with mock contract tests

The contract runner continues to launch the same Next.js process. Existing
tests keep exercising `/mock-api`; a new real HTTP suite seeds PostgreSQL,
calls `/projects`, and compares responses directly with the fixture. Tests
restore or isolate persisted state so operation coverage is deterministic.

The real suite compares violation identity by `field` and `rule`, requires each
message, and ignores violation order and wording. It proves state preservation
by reading the exact seeded analysis before and after rejected requests.

### ADR-007 verification is partitioned by slice

A2 verifies the server half of ADR-007: create and replace return their read
representations, deletes have no body, project mutations request no analysis,
and changing only `cutoffDate` preserves activities and summary. The three
client-flow checks belong to the already allocated B2 slice and are recorded
as explicit inherited scope in `README.md`: typing performs no request,
rejected writes do not refresh while successful writes do, and a failed
refresh retries only the read.

## Risks / Trade-offs

- [A structural check accidentally classifies business invalidity as `400`] →
  Test every fixture validation case plus absence and `null` for every required
  field, and keep the structural field list intentionally small.
- [Next.js or PostgreSQL errors leak implementation details] → Construct every
  documented error envelope explicitly and test that public bodies contain
  only the three contract members and violation members.
- [Mutation tests contaminate later cases] → Seed or reset fixture state at
  controlled test boundaries and run real contract tests serially.
- [A shared pool keeps the test process alive] → The pool belongs to the
  long-running Next.js server process, which the existing runner terminates as
  a process group.

## Migration Plan

No data or contract migration is required. Deploy the new handlers with the
existing schema and environment. Rollback consists of reverting the handler,
adapter, test and architecture commits; persisted captured data and `/mock-api`
remain compatible.

## Open Questions

None. If implementation reveals behavior not decided by the closed sources,
work stops and the unresolved question is reported instead of selecting a
framework default.
