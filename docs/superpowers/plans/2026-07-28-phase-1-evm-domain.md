# Phase 1 EVM Domain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar el dominio EVM puro contra el fixture, cerrar las reglas
de lint/CI de fase 0 y retirar la sonda decimal solo después de trasladar su
evidencia.

**Architecture:** `deriveFromMagnitudes` será la única primitiva de fórmulas,
estado e interpretación. `deriveActivity` calculará PV/EV desde fracciones y
delegará; `consolidateProject` reutilizará los resultados de actividad, sumará
BAC/PV/EV/AC y delegará los totales a la misma primitiva.

**Tech Stack:** TypeScript 5.9, Node Test Runner, tsx, decimal.js 10.6, ESLint 9
flat config, OpenSpec, GitHub Actions.

---

## Fuentes y estructura objetivo

Leer antes de ejecutar:

- `docs/PRD.md`
- `docs/TESTING.md`
- `docs/adr/001-ubicacion-logica-calculo-evm.md`
- `docs/adr/003-representacion-dinero-porcentajes-redondeo.md`
- `docs/adr/004-contrato-api-indicadores-no-evaluables.md`
- `docs/adr/006b-forma-respuesta-contrato-datos.md`
- `contracts/evm/evm-fixture.json`
- `openspec/changes/phase-1-evm-domain/`

No modificar ninguna fuente cerrada. La estructura final será:

- `src/domain/decimal.ts`: constructor configurado, redondeo y formato de dos
  decimales.
- `src/domain/evm.ts`: tipos, primitiva, actividad y consolidación; ninguna
  dependencia externa salvo el módulo decimal.
- `tests/domain/decimal.test.ts`: garantías de presentación y round-trip.
- `tests/domain/evm.test.ts`: fixture, taxonomía, banda, consolidación y
  negativos.
- `tests/domain/architecture.test.ts`: fronteras y política Decimal.
- `eslint.config.mjs`: reglas restringidas a `src/`.
- `.github/workflows/ci.yml`: lint, imports, tipos y suites.

### Task 1: Integrar el WIP y cerrar fase 0

**Files:**

- Merge: `chore/phase-0-lint-rules-wip`
- Create from merge: `eslint.config.mjs`
- Create from merge: `tests/domain/architecture.test.ts`
- Create from merge: `tests/domain/decimal.test.ts`
- Modify: `.github/workflows/ci.yml`
- Modify: `README.md`
- Modify: `openspec/changes/phase-0-project-scaffold/tasks.md`
- Preserve: `src/domain/evm.ts`
- Delete from merge: `src/domain/derive-activity.ts`
- Delete from merge: `src/domain/derive-magnitudes.ts`
- Delete from merge: `src/domain/derive-project.ts`
- Delete from merge: `src/domain/evm-types.ts`

- [ ] **Step 1: Start the explicit merge without committing**

Run:

```bash
git status --short --branch
git merge --no-ff --no-commit chore/phase-0-lint-rules-wip
```

Expected: merge starts from commit
`ed0107f745fe6bbd231f4db254a235e6b4f47a47`; conflicts may appear in phase-0
tasks and scaffold files.

- [ ] **Step 2: Resolve the merge against the current scaffold**

Keep the current versions of:

```text
src/application/evm-repository.ts
src/domain/decimal.ts
src/domain/evm.ts
src/shared/contract.ts
```

Remove the obsolete parallel signatures introduced by the WIP:

```text
src/domain/derive-activity.ts
src/domain/derive-magnitudes.ts
src/domain/derive-project.ts
src/domain/evm-types.ts
```

Preserve `eslint.config.mjs`, `tests/domain/architecture.test.ts` and
`tests/domain/decimal.test.ts`. In
`openspec/changes/phase-0-project-scaffold/tasks.md`, retain completed
checkboxes only for work that the following commands verify.

- [ ] **Step 3: Verify the merged lint rules**

Append this explicit exclusion check to
`tests/domain/architecture.test.ts`:

```ts
test("scripts and contracts are outside source prohibitions", async () => {
  for (const filePath of ["scripts/seed.ts", "contracts/probe.ts"]) {
    const config = await eslint.calculateConfigForFile(filePath);
    assert.notEqual(config?.rules?.["phase0/source-boundaries"]?.[0], 2);
    assert.notEqual(config?.rules?.["phase0/decimal-policy"]?.[0], 2);
  }
});
```

Run:

```bash
npm run lint
npm run lint:imports
npm run typecheck
```

Expected: all three exit 0. `npm run lint:imports` executes
`tests/domain/architecture.test.ts` and demonstrates every required forbidden
direction, explicit exclusion of `scripts/` and `contracts/`, plus allowed
homonymous non-Decimal calls.

- [ ] **Step 4: Add lint and import checks to CI**

Modify `.github/workflows/ci.yml` so these exact steps appear after `npm ci` and
before typecheck:

```yaml
      - run: npm run lint
      - run: npm run lint:imports
      - run: npm run typecheck
```

Run:

```bash
rg -n "npm run (lint|lint:imports|typecheck)" .github/workflows/ci.yml
```

Expected: one line for each command, in that order.

- [ ] **Step 5: Demonstrate a real forbidden domain import**

Temporarily add this line at the top of `src/domain/evm.ts`:

```ts
import "@/infrastructure/database/schema";
```

Run:

```bash
npm run lint
```

Expected: non-zero exit with `no-restricted-imports` or
`phase0/source-boundaries` naming the forbidden domain-to-infrastructure
dependency.

Remove exactly that temporary import and run:

```bash
npm run lint
git diff -- src/domain/evm.ts
```

Expected: lint exits 0 and the diff for `src/domain/evm.ts` is empty.

- [ ] **Step 6: Complete and archive phase 0 before formulas exist**

Replace the obsolete blocking table under `## Deuda conocida` in `README.md`
with this heading and introduction, retaining the genuinely non-blocking list:

```md
## Seguimiento técnico

Deuda no bloqueante posterior al andamiaje:
```

Run the phase-0 commands literally:

```bash
npm run lint
npm run lint:imports
npm run typecheck
npm test
git diff --check
openspec validate phase-0-project-scaffold --type change --strict --no-interactive
```

Expected: every command exits 0. Review the phase-0 spec and tasks, mark only
proven tasks complete, then use `openspec-archive-change` for
`phase-0-project-scaffold`. Verify the archive before continuing:

```bash
openspec list --json
rg --files openspec/changes/archive | rg "phase-0-project-scaffold"
git diff --check
```

Expected: phase 0 is no longer active and its dated archive exists.

- [ ] **Step 7: Commit the merge and phase-0 closure**

Stage only the merge resolution, CI and phase-0 archive:

```bash
git add eslint.config.mjs tests/domain/architecture.test.ts tests/domain/decimal.test.ts .github/workflows/ci.yml README.md openspec/changes openspec/specs src/application/evm-repository.ts src/domain/decimal.ts src/domain/evm.ts src/shared/contract.ts
git diff --cached --check
git diff --cached --name-only
git commit
```

Expected: the merge commit preserves `ed0107f` as a parent and contains no EVM
formula implementation.

### Task 2: Trasladar la sonda decimal

**Files:**

- Modify: `tests/domain/decimal.test.ts`
- Modify: `eslint.config.mjs`
- Modify: `README.md`
- Delete: `scripts/verify-decimal.mjs`
- Modify: `openspec/changes/phase-1-evm-domain/tasks.md`

- [ ] **Step 1: Add the required decimal characterization tests**

Replace `tests/domain/decimal.test.ts` with this complete characterization
suite:

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  Decimal,
  roundForPresentation,
} from "../../src/domain/decimal";

const fixture = JSON.parse(
  readFileSync(
    new URL("../../contracts/evm/evm-fixture.json", import.meta.url),
    "utf8",
  ),
) as {
  readResponse: {
    summary: {
      cpi: { value: number };
      eac: number;
      vac: number;
      progress: number;
    };
  };
};

test("configures the shared Decimal constructor with precision 40", () => {
  assert.equal(Decimal.precision, 40);
  assert.equal(Decimal.rounding, Decimal.ROUND_HALF_UP);
});

for (const [input, expected] of [
  ["1.005", "1.01"],
  ["-1.005", "-1.01"],
  ["0.625", "0.63"],
] as const) {
  test(`rounds ${input} to ${expected} away from zero`, () => {
    assert.equal(roundForPresentation(input).toString(), expected);
  });
}

test("preserves approved fixture values through a JSON number round trip", () => {
  const { summary } = fixture.readResponse;
  for (const value of [
    summary.cpi.value,
    summary.eac,
    summary.vac,
    summary.progress,
  ]) {
    const wireNumber = JSON.parse(JSON.stringify(new Decimal(value).toNumber()));
    assert.equal(new Decimal(wireNumber).toNumber(), value);
  }
});
```

- [ ] **Step 2: Run the decimal tests**

Run:

```bash
node --import tsx --test tests/domain/decimal.test.ts
```

Expected: all constructor, three tie and round-trip tests pass. These are
characterization tests of the already approved decimal module; they do not
authorize changes to rounding policy.

- [ ] **Step 3: Remove the redundant probe**

Delete:

```text
scripts/verify-decimal.mjs
```

Remove `scripts/verify-decimal.mjs` from the `globalIgnores` array in
`eslint.config.mjs` and remove its now-completed bullet from `README.md`.

Run:

```bash
test ! -e scripts/verify-decimal.mjs
rg -n "verify-decimal" package.json eslint.config.mjs scripts .github README.md || true
npm run test:structure
git diff --check
```

Expected: the file is absent, no executable suite or CI reference remains, and
the domain tests pass.

- [ ] **Step 4: Commit the probe retirement**

```bash
git add tests/domain/decimal.test.ts scripts/verify-decimal.mjs eslint.config.mjs README.md
git diff --cached --check
git commit -m "test: replace decimal viability probe"
```

Expected: one test-focused commit containing only the transferred evidence and
probe deletion.

### Task 3: Crear el núcleo EVM mediante TDD

**Files:**

- Create: `tests/domain/evm.test.ts`
- Modify: `src/domain/evm.ts`
- Modify: `src/domain/decimal.ts`

- [ ] **Step 1: Write the failing public-API test**

Create `tests/domain/evm.test.ts` with the fixture loader and first assertion:

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { Decimal } from "../../src/domain/decimal";
import * as evm from "../../src/domain/evm";

const fixture = JSON.parse(
  readFileSync(
    new URL("../../contracts/evm/evm-fixture.json", import.meta.url),
    "utf8",
  ),
);

test("exports the three pure domain operations", () => {
  assert.equal(typeof evm.deriveFromMagnitudes, "function");
  assert.equal(typeof evm.deriveActivity, "function");
  assert.equal(typeof evm.consolidateProject, "function");
});
```

- [ ] **Step 2: Run the API test and observe RED**

Run:

```bash
node --import tsx --test tests/domain/evm.test.ts
```

Expected: FAIL because `export declare function` produces no runtime exports.

- [ ] **Step 3: Replace declarations with minimal runtime functions**

In `src/domain/evm.ts`, replace the erased declarations with exported functions
that preserve the existing signatures and initially throw
`new Error("not implemented")`. Do not commit this intermediate state.

Run the same test. Expected: PASS because the three functions now exist.

- [ ] **Step 4: Add a failing primitive behavior test**

Append:

```ts
test("derives defined zero and non-evaluable indexes from magnitudes", () => {
  const result = evm.deriveFromMagnitudes(
    new Decimal(5000),
    new Decimal(1000),
    new Decimal(0),
    new Decimal(1500),
  );

  assert.equal(result.cpi.value?.toNumber(), 0);
  assert.equal(result.cpi.display, "0,00");
  assert.equal(result.cpi.status, "unfavorable");
  assert.equal(result.cpi.label, "sobre presupuesto");
  assert.equal(result.spi.value?.toNumber(), 0);
  assert.equal(result.eac, null);
  assert.equal(result.vac, null);
  assert.equal(result.state, "cost_without_progress");
});
```

Run:

```bash
node --import tsx --test tests/domain/evm.test.ts
```

Expected: FAIL with `not implemented`.

- [ ] **Step 5: Implement decimal formatting**

Add to `src/domain/decimal.ts`:

```ts
export function formatForPresentation(value: Decimal.Value): string {
  const [whole, fraction = ""] = roundForPresentation(value)
    .toString()
    .split(".");
  return `${whole},${fraction.padEnd(2, "0")}`;
}
```

This is the only formatter. It does not call `toFixed` outside the decimal
module and preserves the existing `roundForPresentation`.

- [ ] **Step 6: Implement the primitive and focused types**

Replace `src/domain/evm.ts` with:

```ts
import {
  Decimal,
  formatForPresentation,
  roundForPresentation,
} from "./decimal";

const LOW = new Decimal("0.99");
const HIGH = new Decimal("1.01");

export type IndexStatus =
  | "favorable"
  | "neutral"
  | "unfavorable"
  | "not_evaluable";

export type ActivityState =
  | "not_started"
  | "planned_without_progress"
  | "progress_without_cost"
  | "cost_without_progress"
  | "progress_with_cost";

export type IndexResult = Readonly<{
  value: Decimal | null;
  display: string | null;
  status: IndexStatus;
  label: string;
}>;

export type EvmResult = Readonly<{
  pv: Decimal;
  ev: Decimal;
  cv: Decimal;
  sv: Decimal;
  cpi: IndexResult;
  spi: IndexResult;
  eac: Decimal | null;
  vac: Decimal | null;
  state: ActivityState;
}>;

export type ActivityInput = Readonly<{
  bac: Decimal;
  plannedProgress: Decimal;
  actualProgress: Decimal;
  ac: Decimal;
}>;

export type ProjectResult = Readonly<
  Omit<EvmResult, "state"> & {
    bac: Decimal;
    ac: Decimal;
    progress: Decimal | null;
    activitiesWithEvAndZeroAc: number;
  }
>;

type IndexKind = "cpi" | "spi";
type DefinedIndexStatus = Exclude<IndexStatus, "not_evaluable">;

const labels: Readonly<
  Record<IndexKind, Readonly<Record<DefinedIndexStatus, string>>>
> = {
  cpi: {
    unfavorable: "sobre presupuesto",
    neutral: "en presupuesto",
    favorable: "eficiente en costos",
  },
  spi: {
    unfavorable: "atrasado",
    neutral: "en cronograma",
    favorable: "adelantado",
  },
};

function activityState(pv: Decimal, ev: Decimal, ac: Decimal): ActivityState {
  if (ev.gt(0)) {
    return ac.eq(0) ? "progress_without_cost" : "progress_with_cost";
  }
  if (ac.gt(0)) return "cost_without_progress";
  if (pv.gt(0)) return "planned_without_progress";
  return "not_started";
}

function classify(value: Decimal): DefinedIndexStatus {
  if (value.lt(LOW)) return "unfavorable";
  if (value.gt(HIGH)) return "favorable";
  return "neutral";
}

function indexResult(kind: IndexKind, value: Decimal | null): IndexResult {
  if (value === null) {
    return {
      value: null,
      display: null,
      status: "not_evaluable",
      label: "no evaluable",
    };
  }

  const status = classify(value);
  const rounded = roundForPresentation(value);
  const baseDisplay = formatForPresentation(value);
  const display =
    status === "unfavorable" && rounded.eq(LOW)
      ? `<${baseDisplay}`
      : status === "favorable" && rounded.eq(HIGH)
        ? `>${baseDisplay}`
        : baseDisplay;

  return { value, display, status, label: labels[kind][status] };
}

export function deriveFromMagnitudes(
  bac: Decimal,
  pv: Decimal,
  ev: Decimal,
  ac: Decimal,
): EvmResult {
  const cpiValue = ac.eq(0) ? null : ev.div(ac);
  const spiValue = pv.eq(0) ? null : ev.div(pv);
  const eac =
    cpiValue === null || cpiValue.eq(0) ? null : bac.div(cpiValue);

  return {
    pv,
    ev,
    cv: ev.minus(ac),
    sv: ev.minus(pv),
    cpi: indexResult("cpi", cpiValue),
    spi: indexResult("spi", spiValue),
    eac,
    vac: eac === null ? null : bac.minus(eac),
    state: activityState(pv, ev, ac),
  };
}

export function deriveActivity(input: ActivityInput): EvmResult {
  const pv = input.bac.times(input.plannedProgress);
  const ev = input.bac.times(input.actualProgress);
  return deriveFromMagnitudes(input.bac, pv, ev, input.ac);
}

export function consolidateProject(
  activities: readonly ActivityInput[],
): ProjectResult {
  let bac = new Decimal(0);
  let pv = new Decimal(0);
  let ev = new Decimal(0);
  let ac = new Decimal(0);
  let activitiesWithEvAndZeroAc = 0;

  for (const activity of activities) {
    const derived = deriveActivity(activity);
    bac = bac.plus(activity.bac);
    pv = pv.plus(derived.pv);
    ev = ev.plus(derived.ev);
    ac = ac.plus(activity.ac);
    if (derived.ev.gt(0) && activity.ac.eq(0)) {
      activitiesWithEvAndZeroAc += 1;
    }
  }

  const { state: _state, ...derived } = deriveFromMagnitudes(bac, pv, ev, ac);
  return {
    bac,
    ac,
    ...derived,
    progress: bac.eq(0) ? null : ev.div(bac).times(100),
    activitiesWithEvAndZeroAc,
  };
}
```

- [ ] **Step 7: Run primitive tests and lint**

```bash
node --import tsx --test tests/domain/evm.test.ts
npm run lint
npm run typecheck
```

Expected: the API and defined-zero tests pass; lint and typecheck exit 0.

### Task 4: Probar todas las actividades, estados y banda

**Files:**

- Modify: `tests/domain/evm.test.ts`
- Modify if a failing case requires it: `src/domain/evm.ts`

- [ ] **Step 1: Add fixture helper functions**

Add these helpers and fixture types to `tests/domain/evm.test.ts`:

```ts
type FixtureIndex = {
  value: number | null;
  display: string | null;
  status: evm.IndexStatus;
  label: string;
};

const stateByFixture = {
  SIN_INICIAR: "not_started",
  SIN_AVANCE_CON_PLAN_VIGENTE: "planned_without_progress",
  AVANCE_CON_AC_CERO: "progress_without_cost",
  COSTO_SIN_AVANCE: "cost_without_progress",
  AVANCE_CON_COSTO: "progress_with_cost",
} as const satisfies Record<string, evm.ActivityState>;

type FixtureActivity = {
  $id: string;
  $state: keyof typeof stateByFixture;
  bac: number;
  plannedProgress: number;
  actualProgress: number;
  ac: number;
  pv: number;
  ev: number;
  cv: number;
  sv: number;
  cpi: FixtureIndex;
  spi: FixtureIndex;
  eac: number | null;
  vac: number | null;
};

function activityInput(activity: {
  bac: number;
  plannedProgress: number;
  actualProgress: number;
  ac: number;
}): evm.ActivityInput {
  return {
    bac: new Decimal(activity.bac),
    plannedProgress: new Decimal(activity.plannedProgress).div(100),
    actualProgress: new Decimal(activity.actualProgress).div(100),
    ac: new Decimal(activity.ac),
  };
}

function assertDecimal(
  actual: Decimal | null,
  expected: number | null,
  field: string,
): void {
  assert.equal(actual?.toNumber() ?? null, expected, field);
}

function assertIndex(
  actual: evm.IndexResult,
  expected: FixtureIndex,
  field: string,
): void {
  assertDecimal(actual.value, expected.value, `${field}.value`);
  assert.equal(actual.display, expected.display, `${field}.display`);
  assert.equal(actual.status, expected.status, `${field}.status`);
  assert.equal(actual.label, expected.label, `${field}.label`);
}
```

- [ ] **Step 2: Add and run the eight-activity test**

```ts
test("matches all eight activity results from the fixture", () => {
  const activities = fixture.readResponse.activities as FixtureActivity[];
  assert.equal(activities.length, 8);

  for (const activity of activities) {
    const result = evm.deriveActivity(activityInput(activity));
    for (const field of ["pv", "ev", "cv", "sv"] as const) {
      assertDecimal(result[field], activity[field], `${activity.$id}.${field}`);
    }
    assertIndex(result.cpi, activity.cpi, `${activity.$id}.cpi`);
    assertIndex(result.spi, activity.spi, `${activity.$id}.spi`);
    assertDecimal(result.eac, activity.eac, `${activity.$id}.eac`);
    assertDecimal(result.vac, activity.vac, `${activity.$id}.vac`);
    assert.equal(result.state, stateByFixture[activity.$state]);
  }
});
```

Run:

```bash
node --import tsx --test tests/domain/evm.test.ts
```

Expected: observe RED if any fixture field, state, null or label differs. Modify
only `src/domain/evm.ts` until the full activity test passes.

- [ ] **Step 3: Assert the five states and four evaluability combinations**

```ts
test("covers five states and four CPI/SPI evaluability combinations", () => {
  const activities = fixture.readResponse.activities as FixtureActivity[];
  assert.deepEqual(
    new Set(activities.map((activity) => stateByFixture[activity.$state])),
    new Set([
      "not_started",
      "planned_without_progress",
      "progress_without_cost",
      "cost_without_progress",
      "progress_with_cost",
    ]),
  );

  const expected = new Set(
    activities.map(
      ({ cpi, spi }) =>
        `${cpi.value === null ? "N" : "E"}-${spi.value === null ? "N" : "E"}`,
    ),
  );
  const actual = new Set(
    activities.map((activity) => {
      const result = evm.deriveActivity(activityInput(activity));
      return `${result.cpi.value === null ? "N" : "E"}-${
        result.spi.value === null ? "N" : "E"
      }`;
    }),
  );
  assert.deepEqual(actual, expected);
  assert.equal(actual.size, 4);
});
```

Run the focused test file. Expected: PASS and `actual.size` equals 4.

- [ ] **Step 4: Add and run all seven neutral-band cases**

```ts
test("matches all seven unrounded neutral-band checks", () => {
  const cases = fixture.neutralBandChecks.cases;
  assert.equal(cases.length, 7);

  for (const bandCase of cases) {
    const result = evm.deriveActivity(activityInput(bandCase.$input));
    assertIndex(result.cpi, bandCase.$expected.cpi, `${bandCase.$id}.cpi`);
    assertIndex(result.spi, bandCase.$expected.spi, `${bandCase.$id}.spi`);
  }
});
```

Run:

```bash
node --import tsx --test tests/domain/evm.test.ts
```

Expected: observe RED if classification uses rounded values or markers leak;
adjust only the classification/presentation helper until all seven cases pass.

- [ ] **Step 5: Commit activity derivation**

```bash
git add src/domain/decimal.ts src/domain/evm.ts tests/domain/evm.test.ts
git diff --cached --check
git commit -m "feat: derive EVM activity results"
```

Expected: commit contains the primitive, activity path, types, formatting and
their red-green evidence.

### Task 5: Implementar consolidación y negativos

**Files:**

- Modify: `tests/domain/evm.test.ts`
- Modify if required: `src/domain/evm.ts`

- [ ] **Step 1: Add the failing summary assertion**

```ts
test("matches the fixture project summary after summing magnitudes", () => {
  const activities = fixture.readResponse.activities as FixtureActivity[];
  const summary = fixture.readResponse.summary;
  const result = evm.consolidateProject(activities.map(activityInput));

  for (const field of ["bac", "pv", "ev", "ac", "cv", "sv"] as const) {
    assertDecimal(result[field], summary[field], `summary.${field}`);
  }
  assertIndex(result.cpi, summary.cpi, "summary.cpi");
  assertIndex(result.spi, summary.spi, "summary.spi");
  assertDecimal(result.eac, summary.eac, "summary.eac");
  assertDecimal(result.vac, summary.vac, "summary.vac");
  assertDecimal(result.progress, summary.progress, "summary.progress");
  assert.equal(
    result.activitiesWithEvAndZeroAc,
    summary.activitiesWithEvAndZeroAc,
  );
});
```

Run:

```bash
node --import tsx --test tests/domain/evm.test.ts
```

Expected: observe RED if project totals, progress or warning count differ. Fix
only `consolidateProject` and reuse `deriveFromMagnitudes`.

- [ ] **Step 2: Add the empty-project test**

```ts
test("matches the empty project summary", () => {
  const result = evm.consolidateProject([]);
  const summary = fixture.emptyProject.summary;

  for (const field of ["bac", "pv", "ev", "ac", "cv", "sv"] as const) {
    assertDecimal(result[field], summary[field], `empty.${field}`);
  }
  assertIndex(result.cpi, summary.cpi, "empty.cpi");
  assertIndex(result.spi, summary.spi, "empty.spi");
  assert.equal(result.eac, null);
  assert.equal(result.vac, null);
  assert.equal(result.progress, null);
  assert.equal(result.activitiesWithEvAndZeroAc, 0);
});
```

Run the focused file. Expected: PASS with stable index objects whose nullable
members are null.

- [ ] **Step 3: Add the three explicit negative assertions**

```ts
test("rejects fixture negative consolidation strategies explicitly", () => {
  const result = evm.consolidateProject(
    (fixture.readResponse.activities as FixtureActivity[]).map(activityInput),
  );
  const negative = fixture.negativeChecks;

  assert.notEqual(
    result.cpi.value?.toNumber(),
    negative.cpiAsAverageOfIndices,
  );
  assert.notEqual(result.eac?.toNumber(), negative.eacAsSumOfActivityEacs);
  assert.notEqual(result.eac?.toNumber(), negative.eacFromRoundedCpi);
});
```

Run:

```bash
node --import tsx --test tests/domain/evm.test.ts
```

Expected: PASS. Manually mutate each assertion's actual expression to its
corresponding `negativeChecks` value one at a time and observe the assertion
fail, then restore it. Do not alter the fixture or production code for this
demonstration.

- [ ] **Step 4: Verify one primitive is called by both paths**

Run:

```bash
rg -n "deriveFromMagnitudes\\(" src/domain/evm.ts
rg -n "deriveActivity\\(" src/domain/evm.ts
```

Expected: one primitive declaration plus exactly one call from activity and one
from project; project obtains per-activity PV/EV through `deriveActivity`.

- [ ] **Step 5: Commit project consolidation**

```bash
git add src/domain/evm.ts tests/domain/evm.test.ts
git diff --cached --check
git commit -m "feat: consolidate EVM project results"
```

Expected: focused commit with summary, empty project and negative evidence.

### Task 6: Completar OpenSpec y verificación integral

**Files:**

- Modify: `openspec/changes/phase-1-evm-domain/tasks.md`
- Archive: `openspec/changes/phase-1-evm-domain/`
- Modify on archive: `openspec/specs/evm-domain-calculation/spec.md`

- [ ] **Step 1: Run isolated domain evidence**

```bash
node --import tsx --test tests/domain/decimal.test.ts tests/domain/evm.test.ts
npm run test:structure
```

Expected: all domain and structural tests pass without Docker, PostgreSQL, Next
or HTTP.

- [ ] **Step 2: Run full project verification freshly**

```bash
npm run lint
npm run lint:imports
npm run typecheck
npm test
npm run build
git diff --check
```

Expected: every command exits 0. Read complete output; do not infer build or
full-suite status from narrower commands.

- [ ] **Step 3: Audit ADR-001 explicitly**

Record evidence for both claims in its `Verificación` section:

```text
1. Domain results and use-case boundary:
   tests/domain/evm.test.ts loads contracts/evm/evm-fixture.json directly and
   proves activity, summary, empty project, taxonomy, band and negatives.
   Integration use-case behavior remains outside this slice as defined by
   docs/TESTING.md.
2. No duplicate formulas or classification:
   tests/domain/architecture.test.ts plus ESLint prove forbidden dependency
   directions; source review confirms formulas/classification exist only in
   src/domain/evm.ts and both consumers call deriveFromMagnitudes.
```

Run:

```bash
rg -n "deriveFromMagnitudes|deriveActivity|consolidateProject|0\\.99|1\\.01" src tests/domain
rg -n "cpi|spi|eac|vac" src/app src/ui src/infrastructure src/application
```

Expected: formulas and thresholds occur only in domain/tests; other layers do
not duplicate calculation or classification.

- [ ] **Step 4: Complete and validate the change tasks**

Check every OpenSpec box only after its evidence exists, then run:

```bash
openspec instructions apply --change phase-1-evm-domain --json
openspec validate phase-1-evm-domain --type change --strict --no-interactive
git diff --check
```

Expected: 18/18 tasks complete, apply state `all_done`, strict validation
passes.

- [ ] **Step 5: Review the final diff and commits**

```bash
git status --short --branch
git log --oneline --decorate --graph origin/develop..HEAD
git diff --stat origin/develop...HEAD
git diff --name-only origin/develop...HEAD
git diff -- contracts/evm docs/PRD.md docs/TESTING.md docs/adr
```

Expected: no closed source changed; only phase-1 domain, lint/CI, probe removal,
OpenSpec and plan/design files appear. Preserve all untracked files in the main
worktree.

- [ ] **Step 6: Archive phase 1 and commit the historical record**

Use `openspec-archive-change` for `phase-1-evm-domain`, then run:

```bash
openspec list --json
openspec validate --all --strict --no-interactive
git diff --check
git status --short --branch
```

Expected: phase 1 is absent from active changes, the dated archive and main
capability spec exist, and all OpenSpec artifacts validate.

Commit only the closure:

```bash
git add openspec/changes openspec/specs
git diff --cached --check
git commit -m "docs(openspec): archive phase 1 EVM domain"
```

- [ ] **Step 7: Report PR readiness without broadening authorization**

Report the merge lineage, factoring, test coverage, lint failure demonstration,
probe retirement and preserved local changes. Confirm that any eventual PR
must target `develop`. Push or create the PR only when the user authorizes that
external action; never merge, delete the worktree or delete the branch without
explicit authorization.
