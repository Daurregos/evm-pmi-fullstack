## MODIFIED Requirements

### Requirement: Current architecture view

The repository SHALL contain a concise `docs/ARCHITECTURE.md` that describes
only the implemented layer boundaries, the executable
`GET /projects/{projectId}` end-to-end journey, the unique EVM calculation
boundary and a routing table to the ten accepted ADRs. It SHALL identify the
real App Router handlers as the HTTP entry point and SHALL preserve `/mock-api`
as the fixture-backed client double rather than presenting it as the production
request path.

#### Scenario: Architecture reader follows the implemented request

- **WHEN** a reader opens `docs/ARCHITECTURE.md`
- **THEN** they can follow the real route through application, repository,
  PostgreSQL and domain and back to the HTTP DTO, identify the dependency rules
  and calculation boundary, distinguish `/mock-api` as a retained test double,
  and find all ten ADR references without encountering the former A2 pending
  marker
