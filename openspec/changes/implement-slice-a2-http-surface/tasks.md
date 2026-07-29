## 1. Contract-first HTTP tests

- [x] 1.1 Extend the contract runner so one Next.js process exercises both the retained mock suite and serial real-route tests against migrated PostgreSQL.
- [x] 1.2 Add fixture-backed failing tests for the project collection, exact aggregate read, all success statuses and bodies, bodyless deletes, complete replacements, missing resources and absence of invented routes.
- [x] 1.3 Add fixture-backed failing tests for malformed JSON, incompatible known types and date formats, all thirteen validation checks, the required-field missing/null matrix, public error shape and violation accumulation without message or order coupling.
- [x] 1.4 Add failing state-intact tests that seed `readResponse`, reject structural and business-invalid writes, and prove the subsequent aggregate read is exactly unchanged.

## 2. Shared HTTP translation

- [x] 2.1 Add lazy infrastructure composition of `EvmUseCases` with the existing database client and `DrizzleEvmRepository`.
- [x] 2.2 Implement structural JSON parsing that checks only object shape, known non-null types and `cutoffDate` format while passing null, absence and extra properties to A1.
- [x] 2.3 Implement success and `400`/`404`/`422` response translation with only the public envelope fields and bodyless `204` support.

## 3. Real App Router surface

- [x] 3.1 Implement `GET` and `POST /projects` and `GET`, `PUT` and `DELETE /projects/{projectId}` as thin use-case adapters.
- [x] 3.2 Implement `POST /projects/{projectId}/activities` and `PUT` and `DELETE /projects/{projectId}/activities/{activityId}` as thin use-case adapters.
- [x] 3.3 Run the focused contract suite until every real and mock HTTP scenario passes, then run typecheck, lint and the structural review to confirm no formulas, invented routes or forbidden dependencies were introduced.

## 4. Architecture documentation

- [x] 4.1 Replace only the pending A2 request journey and mock substitution marker in `docs/ARCHITECTURE.md` with the implemented route-to-domain-to-response flow, retaining the mock as the client double.
- [x] 4.2 Verify the architecture document still covers all ten ADRs and no closed source or excluded product directory changed.

## 5. Completion evidence

- [x] 5.1 Contrast every verification statement in ADR-006a, ADR-006b, ADR-007 and ADR-009 with a named automated test, add the focused `cutoffDate` preservation coverage, and record the three client-flow checks as inherited B2 scope in `README.md`.
- [ ] 5.2 Run fresh `npm test`, `npm run lint`, `npm run build`, OpenSpec validation and `git diff --check`, and inspect the complete outputs.
- [ ] 5.3 Review every OpenSpec task and requirement against the final diff, confirm commits contain only slice-owned files, preserve main-worktree local files, and report branch/PR state and exclusions.
