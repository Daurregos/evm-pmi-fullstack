# Assumptions Register Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** Create \`docs/ASSUMPTIONS.md\` as the complete, concise register of every product assumption marked \`[S]\` in \`docs/PRD.md\`.

**Architecture:** This is a documentation-only change. The source of truth is \`docs/PRD.md\`, with ADR mapping checked against \`docs/adr/001\` through \`docs/adr/008\`; repeated occurrences of one decision become one table row with all origins.

**Tech Stack:** Markdown and repository documentation checks only; no product code or implementation details.

---

### Task 1: Build the complete assumption inventory

**Files:**
- Read: \`docs/PRD.md\`
- Read: \`docs/adr/001-ubicacion-logica-calculo-evm.md\`
- Read: \`docs/adr/002-indicadores-derivados-vs-persistidos.md\`
- Read: \`docs/adr/003-representacion-dinero-porcentajes-redondeo.md\`
- Read: \`docs/adr/004-contrato-api-indicadores-no-evaluables.md\`
- Read: \`docs/adr/005-modelo-temporal-foto-unica-historial.md\`
- Read: \`docs/adr/006a-diseno-recursos-rest.md\`
- Read: \`docs/adr/006b-forma-respuesta-contrato-datos.md\`
- Read: \`docs/adr/007-estrategia-recalculo-tras-edicion.md\`
- Read: \`docs/adr/008-ciclo-vida-borrado-cascada.md\`

- [ ] **Step 1: Enumerate every \`[S]\` occurrence.**

Run:

\`\`\`bash
rg -n '\\[S\\]' docs/PRD.md
\`\`\`

Expected: occurrences from §2, §3, §4, §5, RF-01, RF-02, RF-03, RF-05, RF-06, RF-07, RF-08, §7.2, §7.3, §7.4, §7.5, §8, §9 and §10.

- [ ] **Step 2: Normalize repeated decisions without dropping origins.**

Use exactly these 22 normalized decisions as the completeness checklist:

1. Several projects exist and one is selected for the dashboard.
2. Portfolio management, authentication, permissions, lifecycle states, report history/recovery, dependencies, calendars, resources, baselines, billing and detailed schedules are outside scope of the PRD (§2 and §10).
3. One common project cutoff date governs all activities; the current project is a single photo without history, and the S-curve/history path is future evolution outside scope.
4. The project leader is the only contemplated actor.
5. Creating or editing a project updates that project.
6. BAC for the project is the sum of activity BAC values.
7. Activities with PV zero participate in consolidation.
8. No captured activity lifecycle state exists; every existing activity participates in the analysis.
9. Deleting a project physically deletes its activities in cascade.
10. Deleting the selected project leaves the dashboard without a selection.
11. The dashboard recalculates only after an edit is confirmed, not during digitization.
12. A confirmed edit updates the row without reloading the page.
13. The neutral band is inclusive from 0.99 to 1.01 and fixed/non-configurable.
14. The visual state has only unfavorable, neutral and favorable levels.
15. An unevaluable indicator is shown with the neutral visual treatment.
16. With PV zero and EV positive, the product may show «avance anticipado» separately from SPI.
17. The consolidated view counts activities with positive EV and zero AC to warn of possible pending cost without declaring the data invalid.
18. With positive EV and zero AC, cost may be pending registration and the case is never shown as favorable in cost.
19. Amounts and indices display two decimals, progress displays an integer percentage, exact ties round away from zero, classification uses the unrounded index, and markers appear only for a rounding-hidden band crossing.
20. Invalid input is rejected with the field and violated rule identified, while the previous state remains unchanged.
21. Name and cutoff date are required; BAC is positive; AC is non-negative; both progress percentages are inclusive from 0% to 100%.
22. A third party can validate all described behavior without knowing technical decisions.

The §10 S-curve/history statement supplies the origin, justification and impact for item 3 and must not produce an additional table row. The fixed/non-configurable band in §10 is an additional trace of item 13, and the one-project-at-a-time statement in §10 is an additional trace of item 1; neither creates a new row. The five derived activity cases mentioned by RF-08 remain origins for the visual-state and edge-case rows above rather than becoming extra rules.

- [ ] **Step 3: Assign \`Resuelto en\` without inference.**

Apply exactly:

\`\`\`text
cutoff date belongs to project -> ADR-005
project BAC is the sum of activities -> ADR-006b
physical cascade delete -> ADR-008
multiple projects with one selected -> ADR-006a
recalculation on edit confirmation -> ADR-007
\`\`\`

For the remaining rows, the only additional ADR mappings permitted are:

```text
presentation, classification, rounding or the neutral band -> ADR-003
unevaluable indicator with neutral visual treatment -> ADR-004
single photo or history consequences -> ADR-005
count of activities with unrecorded cost -> ADR-006b
```

Use an allowed ADR only where its decision explicitly absorbs that exact assumption; otherwise write \`—\`. Item 17 uses ADR-006b only for the count; item 18 remains \`—\` for its pending-cost and non-favorable interpretation. The confirmed-row refresh in item 12 is \`—\` and must not receive ADR-007. The fixed/non-configurable band and one-project-at-a-time clauses inherit their traces above and do not create additional ADR mappings.

### Task 2: Write the assumptions document

**Files:**
- Create: \`docs/ASSUMPTIONS.md\`

- [ ] **Step 1: Add the required compact structure.**

Write, in order:

\`\`\`markdown
# Registro de supuestos del proyecto

Este documento hace explícitas las decisiones marcadas \`[S]\` en el PRD,
incluidas las que aparecen fuera de §8, y registra su trazabilidad a los ADR.

| Supuesto | Origen | Justificación | Impacto si resulta falso | Resuelto en |
|---|---|---|---|---|
La tabla continúa con 22 filas reales, una por cada decisión normalizada de Task 1; el texto sobre la curva S se incorpora en la fila temporal de item 3 y no crea una fila adicional.

## Supuestos con mayor riesgo

- **Modelo temporal:** cambiaría el modelo de fotografía vigente, fecha y evolución histórica.
- **Selección:** cambiaría la navegación y el nivel de análisis hacia portafolio.
- **Borrado:** cambiaría la política de conservación, recuperación y ciclo de vida de actividades.
\`\`\`

- [ ] **Step 2: Keep the table faithful to the PRD.**

Use section references such as \`§2\`, \`§3\`, \`RF-01\`, \`§7.4\` and \`§10\`; preserve only text marked \`[S]\` from the PRD. When a PRD justification is marked \`[D]\`, paraphrase only the assumption it supports and do not reproduce the derivation. Do not reproduce formulas, derived rules, acceptance examples, facts marked \`[E]\`, or derivations marked \`[D]\`.

- [ ] **Step 3: Check the explicit ADR mapping.**

Confirm the five required rows contain exactly \`ADR-005\`, \`ADR-006b\`, \`ADR-008\`, \`ADR-006a\` and \`ADR-007\` respectively; verify item 12 is \`—\`, item 17 uses ADR-006b only for its count, item 18 is \`—\`, and every other ADR reference is one of the permitted mappings supported by the corresponding ADR text.

### Task 3: Verify and commit the document

**Files:**
- Verify: \`docs/ASSUMPTIONS.md\`

- [ ] **Step 1: Verify complete \`[S]\` coverage.**

Run:

\`\`\`bash
rg -n '\\[S\\]' docs/PRD.md
\`\`\`

Compare every occurrence against the normalized inventory from Task 1 and a row in \`docs/ASSUMPTIONS.md\`; repeated decisions may map to one row, trace-only clauses must point to their existing row, and no independent decision may be absent.

- [ ] **Step 2: Verify prohibited content and document shape.**

Run the following search for forbidden source markers and implementation vocabulary:

\`\`\`bash
rg -n '\\[E\\]|\\[D\\]|framework|stack|API|fórmula|criterio de aceptación' docs/ASSUMPTIONS.md
\`\`\`

Expected: no output. Manually confirm the purpose is at most three lines and the risk section has exactly three entries.

- [ ] **Step 3: Run the prescribed whitespace check including the new file.**

Run:

\`\`\`bash
git add -N -- docs/ASSUMPTIONS.md
git diff --check
\`\`\`

Expected: no output from \`git diff --check\`.

- [ ] **Step 4: Review the final diff and commit only the deliverable.**

Run:

\`\`\`bash
git diff -- docs/ASSUMPTIONS.md
git status --short
git add -- docs/ASSUMPTIONS.md
git commit -m "docs: add project assumptions register"
\`\`\`

Expected: the commit contains only \`docs/ASSUMPTIONS.md\`; existing user files remain untouched.
