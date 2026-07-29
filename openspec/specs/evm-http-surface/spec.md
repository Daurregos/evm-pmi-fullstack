# evm-http-surface Specification

## Purpose
TBD - created by archiving change implement-slice-a2-http-surface. Update Purpose after archive.
## Requirements
### Requirement: Published runtime resource surface

The system SHALL expose exactly the project and nested-activity operations
published in `contracts/evm/openapi.yaml`. `GET /projects` SHALL return `200`
with a bare array of only `{id, name}` items, including `[]`. `POST /projects`
and `POST /projects/{projectId}/activities` SHALL return `201` with their read
representations. `GET /projects/{projectId}` SHALL return `200` with the
aggregate analysis. Both complete replacements SHALL return `200` with their
read representations, and both successful deletions SHALL return `204` with no
body.

The runtime surface SHALL NOT add flat activity routes or indicator resources.

#### Scenario: Populated and empty project collections

- **WHEN** the project collection is requested with fixture projects or with no
  projects
- **THEN** each response is the bare array defined respectively by
  `collectionResponse.expectedBody` or `collectionResponse.empty.expectedBody`

#### Scenario: Aggregate project read

- **WHEN** the seeded reference project is requested
- **THEN** the response is `200` and its body is exactly `readResponse` after
  recursively removing keys prefixed with `$`

#### Scenario: Creation and complete replacement

- **WHEN** a valid project or nested activity is created or completely replaced
- **THEN** creation returns `201`, replacement returns `200`, and each body is
  the applicable read representation fixed by `successResponses`

#### Scenario: Bodyless deletion

- **WHEN** an existing project or nested activity is deleted
- **THEN** the response is `204` and contains no body

#### Scenario: No invented resources

- **WHEN** the runtime route tree is inspected and unsupported flat activity or
  indicator paths are requested
- **THEN** only the four OpenAPI paths exist and the unsupported paths do not
  resolve to an API operation

### Requirement: Structural request interpretation

Every project or activity write SHALL require syntactically valid JSON with an
object root. For known fields with non-null values, the HTTP layer SHALL enforce
the types and formats published by ADR-006b and OpenAPI. Malformed JSON, a
non-object root, an incompatible known-field type or an invalid non-null
`cutoffDate` format SHALL return `400` with `code: malformed_request` and
`violations: []`.

The structural layer SHALL pass missing fields, explicit `null` and additional
properties to application validation unchanged. It SHALL NOT enforce required,
numeric range, positive, non-negative, read-only, unknown-property or name
normalization rules.

#### Scenario: Malformed or structurally incompatible JSON

- **WHEN** a write contains malformed JSON or the fixture example with
  `{"bac": "diez"}` as a known incompatible value
- **THEN** the response is `400 malformed_request`, has a human `message` and
  has an empty `violations` array

#### Scenario: Invalid project date format

- **WHEN** a non-null `cutoffDate` is not a valid RFC 3339 full-date in
  `YYYY-MM-DD` form
- **THEN** the response is `400 malformed_request` and application mutation is
  not invoked

#### Scenario: Nullable required field reaches business validation

- **WHEN** any required write field is explicitly `null`
- **THEN** the response is `422 validation_failed` with a `required` violation
  for that field rather than `400`

#### Scenario: Additional property reaches business validation

- **WHEN** a write includes a read-only or unknown property
- **THEN** the response is `422 validation_failed` with the applicable
  `read_only` or `unknown` violation rather than `400`

### Requirement: Application result and error translation

The HTTP layer SHALL translate accumulated application violations to `422
validation_failed` and absent addressed resources to `404 not_found`.
`PUT` or `DELETE` SHALL return `404` for an absent project or nested activity
and SHALL NOT create a resource at the supplied URI.

Every `400`, `404` and `422` body SHALL contain exactly `code`, a human-facing
Spanish `message`, and `violations`. Each validation violation SHALL contain
`field`, `rule` and a human-facing `message`. Public errors SHALL NOT contain
exception messages, stack traces, framework details or database details.

#### Scenario: All fixture business validations

- **WHEN** each of the thirteen `validationChecks` is submitted to its
  applicable real route
- **THEN** the response is `422`, the code is `validation_failed`, every
  expected `field` and `rule` is present with a `message`, and violation order
  and message wording are not contractual

#### Scenario: Compound validation

- **WHEN** validation case V9 is submitted
- **THEN** the response contains seven violations spanning the six closed
  rules and does not stop at the first infringement

#### Scenario: Required-field matrix

- **WHEN** the contract suite omits or sets to `null` each field listed in
  `writeSchemas`
- **THEN** every case returns `422` with `required` for the affected field

#### Scenario: Missing resource

- **WHEN** a read, replacement or deletion addresses a resource that does not
  exist in its project scope
- **THEN** the response is `404 not_found` with a human `message` and an empty
  `violations` array

#### Scenario: Public error contains no internal detail

- **WHEN** any documented error response is inspected
- **THEN** it contains only the public envelope and violation fields and no
  exception, trace, framework or database detail

### Requirement: Mutation and state semantics

A rejected write SHALL leave the persisted project analysis unchanged.
Project creation or replacement SHALL return only `ProjectRead` and SHALL NOT
trigger project-indicator recalculation. Changing only `cutoffDate` SHALL
preserve every activity and consolidated indicator. Activity creation or
replacement SHALL return `ActivityRead` with indicators derived synchronously
by A1 from the new captured values.

#### Scenario: Business rejection leaves exact state intact

- **WHEN** `readResponse` is seeded, any fixture business-invalid request is
  rejected and the project is read again
- **THEN** the subsequent aggregate response remains exactly the stripped
  `readResponse`

#### Scenario: Structural rejection leaves exact state intact

- **WHEN** `readResponse` is seeded, the incompatible BAC request is rejected
  with `400` and the project is read again
- **THEN** the subsequent aggregate response remains exactly the stripped
  `readResponse`

#### Scenario: Project mutation does not return analysis

- **WHEN** a project is created or replaced successfully
- **THEN** the response contains exactly `id`, `name` and `cutoffDate` and no
  activity, summary or derived indicator

#### Scenario: Cutoff date only relabels the project photo

- **WHEN** only `cutoffDate` is replaced through the real HTTP route
- **THEN** a subsequent aggregate read has exactly the same activities and
  summary as before the replacement

#### Scenario: Activity mutation derives its read representation

- **WHEN** an activity is created or replaced successfully
- **THEN** its response contains the five captured values, identifier and eight
  indicators produced through the existing application/domain boundary

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
