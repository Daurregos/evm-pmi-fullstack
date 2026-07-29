## Context

B1 left the dashboard reading a single aggregate response and formatting it.
A2 published eight operations with ADR-009 error semantics. ADR-007 assigns the
client three obligations that no test covers yet, recorded in `README.md`.

The Spanish rationale, alternatives and open assumptions live in
`docs/superpowers/specs/2026-07-29-slice-b2-dashboard-editing-design.md`. This
document states the decisions that bind the implementation.

Client tests render with `react-dom/server`, so effects are not exercised at that
level. Any behavior that must be proven has to live outside React.

## Goals / Non-Goals

**Goals:**

- Implement RF-01 and RF-02 over the eight published operations.
- Make the ADR-007 sequence observable: one write, then one read, and a retry
  that cannot repeat the write.
- Place `422` violations next to their field, several at a time, deciding only
  on `code` and `rule`.
- Keep the client free of arithmetic, indicator derivation and business
  validation.

**Non-Goals:**

- Change product rules, contracts, backend behavior or the mock.
- Validate business rules, round values or interpret indicators in the client.
- Optimistic updates, undo, history or partial `PATCH` semantics.

## Decisions

### Raw strings in, contract types out

Form state holds the values as typed, in five (activity) or two (project)
strings. Conversion to `ActivityWrite` or `ProjectWrite` happens on submit and is
serialization, not validation: an empty box becomes `null`, which ADR-009 treats
as absence and answers with `rule: "required"`; a non-finite numeric text also
becomes `null`, because no JSON number represents it. Nothing is trimmed or
normalized, since ADR-009 assigns `name` trimming to the backend.

Captured percentages reach the form through `String(value)`, which preserves the
shortest representation that reproduces the number, so `49.5` neither gains nor
loses decimals. Both `PUT` operations send every editable field, per ADR-006a.

Rejected alternative: parse Spanish decimal text. It would make the client
interpret domain input and decide what "ambiguous" means.

### Two-part mutation plan, and a stale result that cannot rewrite

`mutation-flow.ts` runs a `MutationPlan` of `write` and `refresh`. The write runs
first; the refresh runs only if the write succeeded. Three outcomes: `rejected`
(no read at all), `applied` (view replaced from the read), and `stale` (write
succeeded, read failed).

The `stale` outcome carries the plan's `refresh` and drops its `write`, so
`retryRefresh` is structurally incapable of writing twice. This is the
requirement most often implemented wrong; making it unrepresentable is cheaper
than remembering it.

`DashboardPatch` is a coherent partial replacement of `projects`,
`selectedProjectId` and `analysis`, so table, summary and chart move together.
Activity mutations read `GET /projects/{projectId}`. Project mutations read
`GET /projects` and, when a project remains selected, its aggregate. Deleting
the selected project reads only the collection, satisfying both ADR-007 and the
RF-01 no-selection criterion.

Creating a project uses the `201` body only to know which project to read next;
the view still comes exclusively from the subsequent read.

### Violations are routed by `field` and classified by `code`

`form-feedback.ts` maps a failure to feedback. `validation_failed` distributes
`violations` by `field`: known form fields render inline, and anything else —a
read-only field, an unknown property, a future `rule`— renders in a general list
that keeps `field` and shows `message` without failing. `malformed_request`,
`not_found`, a missing envelope and a network failure share a generic notice.
`message` is displayed and never inspected, because ADR-009 declares it
non-automatable.

### Native dialogs, one stateful component

Forms live in a native `<dialog>` mounted only while editing; `showModal()` and
`close()` run in an effect so the browser provides top layer, focus retention
and `Esc`. That effect is the only new untestable surface at the client level, so
`modal.tsx` holds nothing else. `dashboard-view.tsx` remains the only stateful
component and delegates every transition to a tested module.

### The table gains row actions but no capture control

RF-02 edits and deletions start where the activities are. The table takes an
optional actions column, rendered only when handlers are supplied, and still
contains no input, form or select. This replaces B1's read-only table
requirement.

## Risks / Trade-offs

- The `<dialog>` effect is unverified at the client level, like the selector
  `change` of B1. Mitigated by keeping the component trivial and by the browser
  check against the real backend.
- Assumptions listed in the Spanish design document —confirmation on delete,
  selecting the created project, keeping the selection when another project is
  deleted, and how long the stale notice persists— are client-side choices that
  the PRD does not fix.

## Migration Plan

No data or contract migration. The change is additive in `src/ui/` and modifies
one existing client test that asserted the absence of editing affordances.

## Open Questions

None blocking. The unresolved product ambiguity of ADR-003 recorded in
`README.md` is unrelated to this slice.
