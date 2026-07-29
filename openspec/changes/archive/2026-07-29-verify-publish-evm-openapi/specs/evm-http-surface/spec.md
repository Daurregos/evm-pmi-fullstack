## ADDED Requirements

### Requirement: Automated contract and runtime parity audit

The contract suite SHALL assert that `contracts/evm/openapi.yaml` declares
OpenAPI 3.1 and `info.version: 1.0.0`, contains no
`x-decisions-missing`, publishes exactly the eight implemented operations with
their applicable request and response schemas, and has no component schema
unreachable from a published operation.

#### Scenario: Closed operation matrix

- **WHEN** the contract and real route tree are audited
- **THEN** their four resource paths and eight operations agree on method,
  `operationId`, write schema, success response and applicable 400, 404 and 422
  responses

#### Scenario: No stale contract artifacts

- **WHEN** contract metadata, extensions and component-schema references are
  inspected
- **THEN** the fixed versions are present, no pending-decision extension
  remains and every component schema is reachable from `paths`

## MODIFIED Requirements

### Requirement: Fixture-backed real contract verification

The contract test suite SHALL exercise the real HTTP routes against PostgreSQL
and SHALL load expected values directly from
`contracts/evm/evm-fixture.json`. It SHALL NOT recalculate fixture expectations
with production logic or modify the fixture during red-green cycles. Existing
mock route tests SHALL remain in the suite.

The suite SHALL initialize a validator that supports OpenAPI 3.1 from
`contracts/evm/openapi.yaml`. It SHALL validate at least one real success
response for each of the eight published operations by `operationId` and status
code, including an independently asserted empty HTTP body for both 204
responses. It SHALL also validate real 400, 404 and 422 bodies representing the
three fixture error envelopes.

#### Scenario: Real and mock surfaces are both verified

- **WHEN** the contract test command runs
- **THEN** it executes fixture-backed assertions for `/projects` and retains
  the existing assertions for `/mock-api/projects`

#### Scenario: Fixture is the direct oracle

- **WHEN** contract expectations for reads, collections, success statuses,
  validation or errors are inspected
- **THEN** they originate directly from the corresponding fixture blocks and
  are not independently recalculated by the test

#### Scenario: Every success response validates against OpenAPI 3.1

- **WHEN** one successful real request is executed for each published
  operation
- **THEN** the response body and status validate for its `operationId`, and
  each successful delete also has an exactly empty raw body

#### Scenario: Every public error envelope validates against OpenAPI 3.1

- **WHEN** fixture-backed real requests produce 400 malformed_request, 404
  not_found and 422 validation_failed
- **THEN** each body and status validates against the applicable published
  operation response
