# evm-domain-calculation Specification

## Purpose

Definir el cálculo EVM puro por actividad y proyecto, incluida su forma,
taxonomía, precisión, presentación y consolidación verificables contra el
fixture contractual.

## Requirements

### Requirement: Pure and reusable EVM derivation

The system SHALL derive EVM results through one pure magnitude primitive that
accepts BAC, PV, EV and AC, and activity and project derivation SHALL delegate
to that same primitive without database, framework, HTTP or ORM dependencies.

#### Scenario: Activity delegates calculated magnitudes

- **WHEN** an activity provides BAC, planned progress, actual progress and AC
  as internal decimals
- **THEN** activity derivation calculates PV and EV without intermediate
  quantization and obtains every remaining result through the magnitude
  primitive

#### Scenario: Project delegates consolidated magnitudes

- **WHEN** a project contains zero or more activities
- **THEN** project derivation sums BAC, PV, EV and AC and obtains every
  remaining shared result through the same magnitude primitive

### Requirement: Fixture-backed activity results

The system SHALL derive the eight EVM indicators, activity state and CPI/SPI
interpretations for every activity represented in
`contracts/evm/evm-fixture.json`.

#### Scenario: Eight reference activities

- **WHEN** domain derivation receives the captured BAC, planned progress,
  actual progress and AC from each record in `readResponse.activities`
- **THEN** PV, EV, CV, SV, CPI, SPI, EAC and VAC equal the values stored for
  that activity in the fixture

#### Scenario: Activity state taxonomy

- **WHEN** the eight reference activities exercise the five cases defined by
  the applicable product taxonomy
- **THEN** the derived internal state distinguishes not started, planned
  without progress, progress without cost, cost without progress, and progress
  with cost

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

### Requirement: Stable index shape and evaluability

The system SHALL always return CPI and SPI objects containing `value`,
`display`, `status` and `label`; only `value` and `display` SHALL be nullable,
and non-evaluability SHALL remain a business result rather than an error.

#### Scenario: Defined zero CPI

- **WHEN** EV is zero and AC is positive
- **THEN** CPI value is zero, display is `0,00`, status is `unfavorable`, label
  is Spanish, and EAC and VAC are non-evaluable

#### Scenario: Non-evaluable CPI

- **WHEN** AC is zero
- **THEN** CPI value and display are null, status is `not_evaluable`, and label
  is `no evaluable`

#### Scenario: Four evaluability combinations

- **WHEN** the fixture cases combine evaluable and non-evaluable CPI and SPI
- **THEN** the domain produces all four combinations without propagating an
  activity's non-evaluability to a project ratio derived from evaluable totals

### Requirement: Unrounded classification and bounded markers

The system SHALL classify CPI and SPI from their unrounded values against the
inclusive neutral band and SHALL add a boundary marker only when presentation
rounding hides that the complete value lies outside the band.

#### Scenario: Seven neutral-band checks

- **WHEN** domain derivation receives every `$input` in
  `neutralBandChecks.cases`
- **THEN** CPI and SPI equal each case's `$expected` value, display, status and
  Spanish label

#### Scenario: Inclusive boundaries

- **WHEN** an index is exactly 0.99 or 1.01
- **THEN** it is neutral and its display has no marker

#### Scenario: Hidden boundary crossing

- **WHEN** an index outside the band rounds to the visible lower or upper
  boundary
- **THEN** its display begins with `<` or `>` respectively while any other
  displayed index has no marker

### Requirement: Decimal presentation guarantees

The system SHALL use the single decimal presentation policy owned by
`src/domain/decimal.ts`, SHALL round exact ties away from zero and SHALL not
quantize intermediate domain results.

#### Scenario: Required tie cases

- **WHEN** presentation receives 1.005, -1.005 and 0.625
- **THEN** the displayed decimal values are respectively 1.01, -1.01 and 0.63

#### Scenario: JSON number round trip

- **WHEN** a decimal value crosses the same Decimal-to-number-to-Decimal round
  trip covered by the temporary probe
- **THEN** the resulting observable value satisfies the probe's approved
  equality expectation

### Requirement: Enforced source isolation

The system SHALL lint source boundaries and Decimal policy across `src/` while
excluding `scripts/` and `contracts/` from those prohibitions, and CI SHALL run
both lint and import checks.

#### Scenario: Forbidden domain dependency

- **WHEN** a real domain source file temporarily imports a forbidden layer
- **THEN** `npm run lint` fails with the configured boundary rule

#### Scenario: Restored valid source

- **WHEN** the temporary forbidden import is reverted
- **THEN** lint, import checks and typecheck pass without retaining the probe

#### Scenario: Decimal policy outside its owner

- **WHEN** a source file other than `src/domain/decimal.ts` invokes a forbidden
  Decimal configuration or presentation method on a domain Decimal
- **THEN** lint reports the Decimal policy violation without rejecting a
  homonymous method on a non-Decimal value
