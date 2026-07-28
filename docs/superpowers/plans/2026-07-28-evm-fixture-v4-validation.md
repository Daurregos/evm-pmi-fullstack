# EVM Fixture 4.0.0 Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Revalidate the complete EVM fixture 4.0.0 and its guide against the current PRD and ten ADR, write an evidence-backed report, and relocate the audited artifacts only if every check is clean.

**Architecture:** A temporary Node.js checker independently parses and recalculates the fixture, while a separate manual review covers prose and ADR verification claims. The report records both streams of evidence. Relocation to `contracts/evm/` and path updates are a conditional final phase that must not run if any discrepancy exists.

**Tech Stack:** JSON, Markdown, Node.js built-ins, Git

---

## Canonical paths

- Source worktree:
  `/home/unix_trycore/repositories/trycore/evm-pmi-fullstack`
- Isolated worktree:
  `/home/unix_trycore/repositories/trycore/evm-pmi-fullstack/.worktrees/evm-fixture-v4-validation`
- Approved design:
  `docs/superpowers/specs/2026-07-28-evm-fixture-v4-validation-design.md`
- Temporary checker:
  `/tmp/evm-fixture-v4-audit.mjs`
- Conditional final JSON:
  `contracts/evm/evm-fixture.json`
- Conditional final guide:
  `contracts/evm/FIXTURE.md`
- Report:
  `FIXTURE-VALIDATION-REPORT.md`

This is a documentary contract audit, not production code or a behavior fix.
TDD does not apply under `AGENTS.md`; independent recomputation and fresh
verification are the relevant controls.

### Task 1: Freeze and import the two input artifacts

**Files:**
- Create: `evm-fixture.json`
- Create: `FIXTURE.md`

- [ ] **Step 1: Record the source hashes**

Run from the source worktree:

```bash
sha256sum evm-fixture.json FIXTURE.md
```

Expected:

```text
7a47fb45deaef8827ebb7b66aa7f8444f619cd77d79377c972e998e2e719472d  evm-fixture.json
ad768de868cf0137d0ecbcb8c1bf0225bf80929647b97f2d73b7b850bb5e53c8  FIXTURE.md
```

- [ ] **Step 2: Copy the inputs into the isolated worktree**

Run:

```bash
cp --preserve=mode,timestamps /home/unix_trycore/repositories/trycore/evm-pmi-fullstack/evm-fixture.json /home/unix_trycore/repositories/trycore/evm-pmi-fullstack/.worktrees/evm-fixture-v4-validation/evm-fixture.json
cp --preserve=mode,timestamps /home/unix_trycore/repositories/trycore/evm-pmi-fullstack/FIXTURE.md /home/unix_trycore/repositories/trycore/evm-pmi-fullstack/.worktrees/evm-fixture-v4-validation/FIXTURE.md
```

- [ ] **Step 3: Prove the copies are byte-identical and parseable**

Run from the isolated worktree:

```bash
sha256sum evm-fixture.json FIXTURE.md
node -e "const fs=require('fs');const value=JSON.parse(fs.readFileSync('evm-fixture.json','utf8'));if(value.version!=='4.0.0')throw new Error('expected version 4.0.0');console.log('JSON 4.0.0: PASS')"
```

Expected: the same two hashes followed by `JSON 4.0.0: PASS`.

### Task 2: Build the independent temporary checker

**Files:**
- Create outside the repository: `/tmp/evm-fixture-v4-audit.mjs`

- [ ] **Step 1: Implement shared assertion and arithmetic helpers**

Create the checker with `apply_patch`. It must use only Node.js built-ins and
must define:

- `check(name, fn)` to emit exactly `CHECK N: PASS` or collect a detailed
  failure without stopping later checks;
- `assert`, `assertDeepEqual`, `assertKeysInOrder`, `assertClose`;
- recursive `stripDollarKeys`;
- decimal-safe comparison using integer scaling for inputs with finite decimal
  representations and rational formulas for ratios;
- half-away-from-zero presentation for two decimals and integer percentages;
- CPI/SPI evaluation, status, label and marker functions derived from the PRD,
  not from expected fixture outputs.

- [ ] **Step 2: Implement checks 1–7**

The checker must independently assert:

1. stripping `$` keys from `readResponse` yields exactly the ADR-006b blocks
   and ordered keys, including four-key CPI/SPI objects;
2. project and all activity identifiers are present JSON integers;
3. `activitiesWithEvAndZeroAc` exists with the exact spelling in
   `readResponse.summary`, `emptyProject.summary`, and `negativeChecks`;
4. every validation case is `422`, has the common body members and valid
   violation members, uses only the five closed `rule` values, and V9 includes
   all six violations from one request while covering all five rules;
5. error envelopes cover exactly `400`, `404`, and `422` with the common
   `code`, `message`, `violations` shape;
6. PRD §7.5 rules and fixture cases cover one another, including required
   project fields, required activity name, positive BAC, non-negative AC,
   both range-constrained percentages and read-only derived input;
7. activities cover all five PRD §7.3 states and the four CPI/SPI
   evaluability combinations.

- [ ] **Step 3: Implement checks 8–9**

For each activity, derive PV, EV, CV, SV, CPI, SPI, EAC and VAC solely from
`bac`, `plannedProgress`, `actualProgress`, and `ac`. Derive consolidated
results only after summing BAC, PV, EV and AC. Compare all expected values,
status values, labels, displays, progress, the zero-AC counter, empty-project
semantics and negative oracles.

Presentation assertions must cover:

- two decimals for monetary and index displays;
- integer project progress;
- exact half-away-from-zero at a7 `cpi.value = 0.625`;
- inclusive raw-value neutral band;
- markers only when an out-of-band raw value rounds to 0.99 or 1.01;
- B1–B7 contrast cases and absence of markers on monetary values.

- [ ] **Step 4: Syntax-check the checker**

Run:

```bash
node --check /tmp/evm-fixture-v4-audit.mjs
```

Expected: no output and exit code `0`.

### Task 3: Run and inspect every automated check

**Files:**
- Read: `evm-fixture.json`
- Read: `/tmp/evm-fixture-v4-audit.mjs`

- [ ] **Step 1: Execute the complete checker**

Run from the isolated worktree:

```bash
node /tmp/evm-fixture-v4-audit.mjs evm-fixture.json
```

Expected format: one result for each `CHECK 1` through `CHECK 9`, followed by a
failure total. A clean result is exactly nine `PASS` lines and
`FAILURES: 0`. Any failure is evidence for the report and does not authorize
relocation.

- [ ] **Step 2: Inspect rather than suppress every failure**

For each failure, record:

- JSON path;
- actual value or key set;
- expected value or key set;
- PRD or ADR source;
- whether the discrepancy is contractual, numeric, presentation, metadata or
  documentation.

Continue through checks 1–9 even if an earlier check fails.

### Task 4: Revalidate all prose and ADR verification claims

**Files:**
- Read: `FIXTURE.md`
- Read: `evm-fixture.json`
- Read: `docs/PRD.md`
- Read: `docs/adr/001-ubicacion-logica-calculo-evm.md`
- Read: `docs/adr/002-indicadores-derivados-vs-persistidos.md`
- Read: `docs/adr/003-representacion-dinero-porcentajes-redondeo.md`
- Read: `docs/adr/004-contrato-api-indicadores-no-evaluables.md`
- Read: `docs/adr/005-modelo-temporal-foto-unica-historial.md`
- Read: `docs/adr/006a-diseno-recursos-rest.md`
- Read: `docs/adr/006b-forma-respuesta-contrato-datos.md`
- Read: `docs/adr/007-estrategia-recalculo-tras-edicion.md`
- Read: `docs/adr/008-ciclo-vida-borrado-cascada.md`
- Read: `docs/adr/009-contrato-errores-api.md`

- [ ] **Step 1: Audit `FIXTURE.md` from its first line to its last**

Check every count, key name, JSON path, numeric value, state, label, coverage
claim, negative oracle, usage instruction and future-use statement. Verify that
every named key exists and that no claim exceeds what the JSON, PRD or ADR
supports. Review `$comment`, `$trap`, `$notes` and other fixture metadata as
prose too.

- [ ] **Step 2: Build the ten-row ADR support matrix**

For each ADR, distinguish:

- evidence that the fixture actually supplies;
- runtime behavior that the fixture can only serve as an oracle for;
- any verification claim that cannot be satisfied with the fixture content.

Run:

```bash
rg -n 'evm-fixture\.json' docs/adr
```

Expected before conditional relocation: eleven occurrences across all ten ADR,
with ADR-006b containing two.

- [ ] **Step 3: Audit path references in the required sources**

Run:

```bash
rg -n 'evm-fixture\.json|FIXTURE\.md' docs/PRD.md docs/adr docs/ASSUMPTIONS.md
```

Record the exact references. Do not edit them until the complete audit result
is known.

### Task 5: Regenerate the validation report

**Files:**
- Create: `FIXTURE-VALIDATION-REPORT.md`

- [ ] **Step 1: Write the report from the new evidence**

Use `apply_patch` to create the 4.0.0 report. It must include:

- date and exact sources;
- an unqualified clean or discrepant conclusion;
- a table with all eleven requested checks, explicit `COINCIDE` or
  `DISCREPANCIA`, and exact references;
- every discrepancy found, including metadata and guide prose;
- independent arithmetic results for all activities and the consolidated
  project;
- the ten-row ADR support matrix;
- exact checker, hash, search and Git evidence;
- the conditional relocation decision.

- [ ] **Step 2: Include the new file in whitespace verification**

Run:

```bash
git add -N -- FIXTURE-VALIDATION-REPORT.md
git diff --check -- FIXTURE-VALIDATION-REPORT.md
```

Expected: no output from `git diff --check`.

### Task 6: Apply the conditional location decision

**Files if and only if the report is clean:**
- Create: `contracts/evm/evm-fixture.json`
- Create: `contracts/evm/FIXTURE.md`
- Delete from branch root: `evm-fixture.json`
- Delete from branch root: `FIXTURE.md`
- Modify: the ten files under `docs/adr/` that reference the fixture
- Modify only if a matching reference exists: `docs/PRD.md`
- Modify only if a matching reference exists: `docs/ASSUMPTIONS.md`

- [ ] **Step 1: Gate on the full result**

If any automated or manual discrepancy exists, skip every remaining step in
this task. Leave `evm-fixture.json` and `FIXTURE.md` at the branch root, do not
edit path references, and proceed directly to Task 7.

- [ ] **Step 2: Relocate byte-identical clean artifacts**

Only for a clean result, run:

```bash
mkdir -p contracts/evm
mv evm-fixture.json contracts/evm/evm-fixture.json
mv FIXTURE.md contracts/evm/FIXTURE.md
```

- [ ] **Step 3: Update required canonical references**

Use `apply_patch` to replace applicable bare fixture references in the ten ADR
with `contracts/evm/evm-fixture.json`. Audit PRD and `ASSUMPTIONS.md` and edit
only matching references. Do not rewrite historical Superpowers plans or specs.

- [ ] **Step 4: Prove relocation preserved content**

Run:

```bash
sha256sum contracts/evm/evm-fixture.json contracts/evm/FIXTURE.md
node /tmp/evm-fixture-v4-audit.mjs contracts/evm/evm-fixture.json
rg -n 'evm-fixture\.json|FIXTURE\.md' docs/PRD.md docs/adr docs/ASSUMPTIONS.md
```

Expected hashes are the Task 1 hashes; the checker must reproduce the complete
audit result; every applicable current reference must use the final path.

### Task 7: Fresh verification, scope audit and logical commit

**Files:**
- Verify every file changed by Tasks 1–6

- [ ] **Step 1: Inspect the complete diff and whitespace**

Run:

```bash
git diff --check
git status --short --branch
git diff --stat
git diff
```

Expected: no whitespace errors; only the report, the two fixture artifacts,
conditional ADR path updates, and the approved plan are in scope.

- [ ] **Step 2: Recheck every requested requirement against evidence**

Read the original eleven checks and point each one to:

- a fresh checker result or manual review record;
- the corresponding report row;
- the exact PRD or ADR source.

Confirm that the conditional relocation decision matches the presence or
absence of discrepancies.

- [ ] **Step 3: Stage only this audit**

Use explicit paths. For a discrepant result:

```bash
git add FIXTURE-VALIDATION-REPORT.md docs/superpowers/plans/2026-07-28-evm-fixture-v4-validation.md
```

The two worktree-root copies remain untracked audit inputs in this branch when
the result is discrepant; the source-worktree originals remain untouched.

For a clean result:

```bash
git add FIXTURE-VALIDATION-REPORT.md contracts/evm/evm-fixture.json contracts/evm/FIXTURE.md docs/adr docs/superpowers/plans/2026-07-28-evm-fixture-v4-validation.md
```

- [ ] **Step 4: Verify the staged scope**

Run:

```bash
git diff --cached --check
git diff --cached --stat
git status --short
```

Expected: no whitespace errors and no unrelated local file.

- [ ] **Step 5: Commit the verified audit**

For a discrepant result:

```bash
git commit -m "docs: report EVM fixture v4 discrepancies"
```

For a clean result:

```bash
git commit -m "docs: validate and locate EVM fixture v4"
```

- [ ] **Step 6: Verify the final local branch state**

Run:

```bash
git status --short --branch
git log --oneline --decorate -3
```

Expected for a clean result: clean worktree, local branch ahead of
`origin/develop`, and no pull request created or merged. Expected for a
discrepant result: the same branch state plus only the two untracked audit
input copies, which must be reported as preserved local files.
