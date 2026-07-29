## Why

`develop` integrates A1, A2 and B1: the eight real HTTP operations exist and the
dashboard reads them, but the client cannot write. RF-01 and RF-02 remain
unimplemented, and the three client-side ADR-007 checks recorded in `README.md`
as inherited B2 scope have no test behind them.

## What Changes

- Add project and activity creation, editing and deletion to the dashboard over
  the eight published operations, capturing only the five activity data points.
- Add the client half of ADR-007: a mutation writes once, then a single read
  replaces table, summary and chart together; a rejected write triggers no read;
  a failed read is retried without repeating the write.
- Add ADR-009 error placement: `422` violations render next to the field named
  by `field`, several at a time, decided only by `code` and `rule`; `400`, `404`
  and envelope-less failures share a generic treatment.
- Apply the RF-01 criterion when the selected project is deleted: the dashboard
  is left with no selection.
- Extend the simulated client API with writes, programmable read failures and
  the fixture's error envelopes.
- Replace the inherited-scope note in `README.md` with what B2 delivered and the
  debt it leaves.

## Capabilities

### Modified Capabilities

- `evm-dashboard-client`: Add the editing flow, the mutation and refresh
  contract, per-field violation placement, form capture rules and the no-selection
  outcome of deleting the selected project. Replace the read-only table
  requirement, which now carries row actions but still no capture control.

## Impact

The change affects `src/ui/`, `src/app/globals.css` and `tests/client/`, plus the
B2 handoff note in `README.md`. It adds no dependency and does not modify
`docs/PRD.md`, `docs/adr/`, `contracts/evm/openapi.yaml`,
`contracts/evm/evm-fixture.json`, `src/shared/contract.ts`, `src/domain/`,
`src/application/`, `src/infrastructure/`, the real API routes or the
fixture-backed mock.
