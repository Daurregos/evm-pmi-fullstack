## Why

The published EVM contract still has no real HTTP implementation: the only
executable routes are the fixture-backed client mock. Slice A2 must expose the
already completed A1 use cases through the exact OpenAPI surface and error
semantics decided by ADR-006a, ADR-006b, ADR-007 and ADR-009.

## What Changes

- Add all eight real project and nested-activity operations from the published
  OpenAPI contract.
- Add shared HTTP translation for JSON interpretation, structural validation,
  application results, success responses and the common error envelope.
- Add fixture-backed contract tests against the real routes and PostgreSQL
  while preserving the existing `/mock-api` double and client tests.
- Complete only the pending A2 request journey in `docs/ARCHITECTURE.md`.

## Capabilities

### New Capabilities

- `evm-http-surface`: Runtime behavior of the real project and nested-activity
  routes, including success responses, structural/business error separation
  and fixture-backed state preservation.

### Modified Capabilities

- `evm-application-persistence`: Replace the documented A2/mock limitation with
  the implemented end-to-end HTTP request journey.

## Impact

The change affects `src/app/projects/`, HTTP composition and translation under
`src/infrastructure/`, contract tests and their runner, and the pending journey
in `docs/ARCHITECTURE.md`. It adds no dependency and does not modify the PRD,
ADRs, OpenAPI, fixture, domain, application, shared contract, UI or mock API.
