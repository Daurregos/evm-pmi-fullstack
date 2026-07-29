# evm-application-persistence Specification

## Purpose
Define la persistencia de datos EVM capturados, los casos de uso de análisis y
la validación de negocio que preservan los límites de dominio y arquitectura.
## Requirements
### Requirement: Captured-only EVM persistence
The system SHALL persist projects with a single current cutoffDate and
activities with only identity, project membership, name, BAC, planned progress,
actual progress and AC. It SHALL reconstruct PostgreSQL numeric values with the
domain Decimal constructor in one mapper and SHALL NOT persist EVM indicators,
interpretations, summary values, history or an activity cutoff.

#### Scenario: Replacing captured data
- **WHEN** a valid project or activity replacement is requested
- **THEN** the repository replaces only its editable captured fields and returns
  the resulting current record

#### Scenario: Derived values remain absent from storage
- **WHEN** the persistence model and a captured-data write are inspected
- **THEN** neither contains PV, EV, CV, SV, CPI, SPI, EAC, VAC, interpretation,
  activity state, project summary, activity cutoff or historical version

### Requirement: Project and activity use cases
The system SHALL provide application use cases to create, replace and delete a
project; create, replace and delete an activity within a project; list project
selectors; and obtain one project analysis. A valid create SHALL return the
generated resource representation, a valid replacement SHALL return the current
representation, and a delete SHALL report whether the addressed resource
existed. These application results SHALL NOT assign HTTP status codes or error
envelopes.

#### Scenario: Single current project photo
- **WHEN** a project is created or replaced with a valid cutoffDate
- **THEN** its current date is the only date stored for the project and no
  operation exposes a prior version

#### Scenario: Activity belongs to its project
- **WHEN** an activity is created, replaced or deleted through a project
- **THEN** the operation addresses that project membership and cannot act on an
  activity outside it

#### Scenario: Project listing
- **WHEN** projects are listed
- **THEN** each entry contains only the identifier and name needed by the
  selector

### Requirement: Authoritative EVM analysis from captured values
The project-analysis use case SHALL load the current project and its activities,
normalize stored 0–100 percentages to internal fractions, invoke the domain EVM
functions, and materialize the published project, activities and summary. It
SHALL calculate no EVM formula outside the domain module and SHALL preserve
unrounded values in its numeric output.

#### Scenario: Captured edit changes the associated analysis
- **WHEN** BAC, planned progress, actual progress or AC of an existing activity
  is replaced with a valid fixture-backed value
- **THEN** the subsequent project analysis contains the corresponding derived
  result from the domain module

#### Scenario: Name and cutoff preserve indicators
- **WHEN** only an activity name or its project's cutoffDate is replaced
- **THEN** the subsequent EVM indicators and project summary remain equal to
  their pre-replacement values

#### Scenario: Empty project analysis
- **WHEN** analysis is requested for a current project with no activities
- **THEN** its summary is the domain result for an empty project, including
  non-evaluable indicators where applicable

### Requirement: Accumulated business validation
The system SHALL validate project and activity writes before persistence. It
SHALL accumulate every independent required, positive, non_negative,
range_0_100, read_only and unknown infringement; preserve an unknown property
name in field; trim lateral spaces from name; preserve interior spaces; and
return all violations without mutating state. Explicit null for a required field
SHALL produce required.

#### Scenario: Compound invalid activity
- **WHEN** an activity write contains an empty name, zero BAC, out-of-range
  planned and actual progress, negative AC, a read-only CPI and an unknown
  property
- **THEN** the result contains seven violations across the six defined rules
  without requiring a particular violation order

#### Scenario: Whitespace-only name
- **WHEN** a write contains a name made only of lateral whitespace
- **THEN** validation returns required for name and does not persist a change

#### Scenario: Rejected write leaves state intact
- **WHEN** a write has one or more business violations
- **THEN** the repository receives no mutation and a subsequent read returns the
  pre-existing state

### Requirement: Atomic project composition deletion
The system SHALL rely on the PostgreSQL foreign key cascade to remove a project
and its activities in one atomic deletion. Deleting an activity SHALL preserve
its project and sibling activities. A failure during the project cascade SHALL
leave the project and every activity present after the failed statement.

#### Scenario: Project cascade leaves no orphan
- **WHEN** a project with multiple activities is deleted successfully
- **THEN** the project and all of its activities are absent and no activity row
  remains with its project identifier

#### Scenario: Activity deletion preserves siblings
- **WHEN** one activity of a project with multiple activities is deleted
- **THEN** the project and every other activity remain present

#### Scenario: Cascade failure rolls back completely
- **WHEN** PostgreSQL raises an error while deleting an activity during a
  project cascade
- **THEN** the delete reports failure and the project and all of its activities
  remain present

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
