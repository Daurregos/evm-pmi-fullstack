## MODIFIED Requirements

### Requirement: Magnitude-first project consolidation

The system SHALL consolidate by summing activity BAC, PV, EV and AC before
deriving variations, ratios, projections, interpretation and project progress.

#### Scenario: Reference project summary

- **WHEN** the eight reference activities are consolidated
- **THEN** every field of `readResponse.summary`, including `progress` and
  `activitiesWithEvAndZeroAc`, equals the fixture

#### Scenario: Incorrect consolidation strategies are rejected

- **WHEN** the reference project is consolidated
- **THEN** consolidated CPI is not `negativeChecks.cpiAsAverageOfIndices`
- **AND** consolidated EAC is not
  `negativeChecks.eacAsSumOfActivityEacs`
- **AND** consolidated EAC is not `negativeChecks.eacFromRoundedCpi`
- **AND** consolidated CPI is not
  `negativeChecks.cpiExcludingZeroAcActivity`

#### Scenario: Empty project

- **WHEN** a project has no activities
- **THEN** its result equals `emptyProject.summary`, including zero magnitudes,
  non-evaluable ratios, projections and progress, and a zero warning count
