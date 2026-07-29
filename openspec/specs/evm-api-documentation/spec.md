# evm-api-documentation Specification

## Purpose
TBD - created by archiving change verify-publish-evm-openapi. Update Purpose after archive.
## Requirements
### Requirement: Canonical OpenAPI document route

The application SHALL expose `GET /api-docs/openapi.yaml` with the exact bytes
of `contracts/evm/openapi.yaml` and an OpenAPI-compatible YAML media type. It
SHALL read the repository contract as the single source and SHALL NOT maintain
a generated, public-directory or embedded copy.

#### Scenario: Served contract equals repository contract

- **WHEN** `/api-docs/openapi.yaml` is requested while the application is
  running
- **THEN** the response is 200 and its bytes equal
  `contracts/evm/openapi.yaml`

#### Scenario: Contract edit needs no documentation copy

- **WHEN** the canonical contract changes and the application serves the next
  request
- **THEN** the served document reflects that file without synchronizing a
  second YAML artifact

### Requirement: Self-hosted interactive Swagger UI

The application SHALL expose Swagger UI at `GET /api-docs`. The interface SHALL
load `/api-docs/openapi.yaml`, SHALL use only Swagger UI resources served by
the same application and SHALL enable execution of the published operations
against the same origin.

#### Scenario: Documentation opens with the environment running

- **WHEN** a consumer opens `/api-docs`
- **THEN** the HTML, configured OpenAPI document, JavaScript and CSS all return
  successful responses without requiring an external CDN

#### Scenario: Published operations are executable

- **WHEN** Swagger UI loads the canonical document
- **THEN** it exposes the eight project and nested-activity operations with
  “Try it out” targeting the running application origin

### Requirement: Restricted documentation assets

The documentation asset route SHALL serve only the enumerated Swagger UI
JavaScript and CSS files with their correct media types. Any other asset name
SHALL return 404 and SHALL NOT expose an arbitrary filesystem path.

#### Scenario: Required assets are available

- **WHEN** the JavaScript and CSS URLs referenced by `/api-docs` are requested
- **THEN** every resource returns 200 with its expected media type

#### Scenario: Unknown asset is rejected

- **WHEN** an asset name outside the closed list is requested
- **THEN** the route returns 404 without reading or exposing another file
