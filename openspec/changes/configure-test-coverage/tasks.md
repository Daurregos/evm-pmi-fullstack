## 1. Specify the coverage policy in tests

- [x] 1.1 Add failing unit tests for counter aggregation, path scopes, inclusive four-metric thresholds, empty scopes and malformed summaries.
- [x] 1.2 Add failing unit tests that locate zero-count domain branch alternatives from detailed coverage data.
- [ ] 1.3 Add a failing structural test for the complete source universe, four justified exclusions, four reporters, ignored output and the shared CI command.

## 2. Implement collection and enforcement

- [ ] 2.1 Add a pinned `c8` development dependency and configure all-source TypeScript collection with text, HTML, JSON summary and detailed JSON reporters.
- [ ] 2.2 Implement the pure coverage policy module and CLI that print layer percentages, list uncovered domain branches and fail every violated threshold.
- [ ] 2.3 Add the one-command coverage script with local/CI PostgreSQL preparation and run the existing structure, client, integration and contract suites under one coverage environment.
- [ ] 2.4 Generate the first real report, audit its source paths and HTML, and add meaningful fixture- or decision-backed tests for any approved threshold gap without lowering thresholds or expanding exclusions.

## 3. Publish the quality gate

- [ ] 3.1 Expand the existing Coverage section of `docs/TESTING.md` with the command, report formats, differentiated thresholds, branch rationale and every exclusion with its reason.
- [ ] 3.2 Update CI to retain lint, import and type gates and invoke the same coverage command once against its PostgreSQL service.
- [ ] 3.3 Confirm README remains unchanged and record its obsolete truncate instruction for the closing report.

## 4. Verify and close the change

- [ ] 4.1 Run fresh policy tests, lint, import lint, typecheck, coverage, build and `git diff --check`, reading the complete outputs.
- [ ] 4.2 Run the contract suite, mutate canonical data manually through the real backend, and rerun the suite without external cleanup.
- [ ] 4.3 Temporarily raise one threshold above its actual result, demonstrate a nonzero policy exit, restore the approved value and rerun the green gate.
- [ ] 4.4 Audit reported files, HTML, actual percentages, uncovered domain branches, exclusions, ADR verification statements, OpenSpec requirements, diff territory and commit contents.
- [ ] 4.5 Archive the verified OpenSpec change, preserve the isolated worktree and branch, and prepare the final report and develop-targeted PR status without merging.
