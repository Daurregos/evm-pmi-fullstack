## 1. Simulated API and failing client tests

- [ ] 1.1 Extend `tests/client/simulated-api.ts` with the eight operations: methods and bodies recorded in order, `successResponses` statuses, bodyless `204`, error envelopes from `validationChecks` and programmable read failures, without changing the existing read behavior.
- [ ] 1.2 Add failing tests for the three ADR-007 checks: typing issues no request, a rejected mutation issues no read while a successful one does, and a failed refresh is retried with exactly one write and two reads.
- [ ] 1.3 Add failing tests for the form: the activity write contains exactly the five captured properties, editing preloads unrounded percentages, and no indicator has a control.
- [ ] 1.4 Add failing tests for violation placement: the composite fixture case shows every violation next to its field with the out-of-form ones reported generically, and `400`/`404`/envelope-less failures mark no field.
- [ ] 1.5 Add a failing test for RF-01: deleting the selected project reads only the collection and leaves no selection or analysis.

## 2. Form state and serialization

- [ ] 2.1 Implement `src/ui/activity-form-state.ts` with the five raw string fields, blank and preloaded construction, field update and conversion to `ActivityWrite`.
- [ ] 2.2 Implement `src/ui/project-form-state.ts` with name and cut-off date under the same rules.
- [ ] 2.3 Confirm both modules contain no arithmetic, no rounding, no business validation and no import of the HTTP client.

## 3. Error feedback

- [ ] 3.1 Extend `EvmApiError` with the envelope `violations` and keep the envelope-less path intact.
- [ ] 3.2 Implement `src/ui/form-feedback.ts`, routing violations by `field` and classifying by `code` only, with a general bucket that preserves unknown fields and rules.

## 4. HTTP writes

- [ ] 4.1 Extend `src/ui/evm-api-client.ts` with the six write operations over `FetchLike` with request init, JSON headers, and no body parsing on `204`.
- [ ] 4.2 Add tests for verbs, resolved routes, request bodies, returned representations and `violations` on rejection.

## 5. Mutation flow

- [ ] 5.1 Implement `src/ui/mutation-flow.ts` with the two-part plan, the three outcomes and a `stale` result that only exposes the refresh.
- [ ] 5.2 Implement `src/ui/dashboard-mutations.ts` with one plan per operation and the reads each one is allowed to issue, including the no-selection outcome of deleting the selected project.
- [ ] 5.3 Run the client suite until sections 1 through 5 pass.

## 6. Interface

- [ ] 6.1 Implement `src/ui/modal.tsx` and `src/ui/form-field.tsx` with per-field messages, `aria-invalid` and `aria-describedby`.
- [ ] 6.2 Implement `src/ui/activity-form.tsx` and `src/ui/project-form.tsx` as presentational forms over the state modules.
- [ ] 6.3 Add the optional actions column to `src/ui/activities-table.tsx` and update the client test that asserted the absence of editing affordances.
- [ ] 6.4 Wire `src/ui/dashboard.tsx` and `src/ui/dashboard-view.tsx`: editor state, submission, out-of-date notice and read-only retry, keeping every transition in a tested module.
- [ ] 6.5 Add the styles the new markup needs to `src/app/globals.css`, without importing CSS from any component.

## 7. Completion evidence

- [ ] 7.1 Update `src/ui/README.md`, `tests/client/README.md` and the B2 handoff section of `README.md` with what the slice delivered and the debt it leaves.
- [ ] 7.2 Run fresh `npm test`, `npm run lint`, `npm run build`, `openspec validate --strict` and `git diff --check`, and read the complete output.
- [ ] 7.3 Verify in the browser against the real backend with `NEXT_PUBLIC_EVM_API_BASE_URL=/`: create, edit and delete an activity and confirm the consolidated view moves.
- [ ] 7.4 Contrast every ADR-007 and ADR-009 client verification statement with a named test, check each task against the diff, and report evidence, limitations and preserved local files.
