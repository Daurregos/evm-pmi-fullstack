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

Use these row groups as the completeness checklist:

1. Several projects exist, with one selected for dashboard analysis.
2. Portfolio management, authentication, permissions, lifecycle states, report history/recovery, dependencies, calendars, resources, baselines, billing and detailed schedules are outside scope.
3. One project cutoff date governs all its activities; the current project is a single photo rather than a period history.
4. The main actor is the project leader and no other actor is contemplated.
5. BAC for the project is the sum of activity BAC values.
6. Existing activities participate even when planned work has not started; no captured activity lifecycle state controls inclusion.
7. Deleting a project physically deletes its activities.
8. Deleting the selected project leaves the dashboard without a selection even if other projects remain.
9. The dashboard recalculates only after an edit is confirmed, and a confirmed row refresh does not reload the page.
10. Neutral-band interpretation uses the inclusive fixed range 0.99–1.01.
11. The visual state has only unfavorable, neutral and favorable levels; an unevaluable indicator is shown with the neutral visual treatment.
12. With zero PV and positive EV, the product may show «avance anticipado» separately from SPI.
13. The consolidated view counts activities with positive EV and zero AC, warning of possible cost-recording lag without declaring invalid data.
14. Amounts and indices display two decimals, progress displays an integer percentage, nearest rounding is used, and exact ties round away from zero.
15. Classification and visual state use the unrounded index.
16. A marker \`<\` or \`>\` is used only when an out-of-band index displays exactly 0.99 or 1.01 and would otherwise hide the boundary crossing.
17. Invalid input identifies the field and violated rule and leaves the previous state unchanged.
18. Name and cutoff date are required; BAC is positive; AC is non-negative; both progress percentages are inclusive from 0% to 100%.
19. Completion is verifiable by a third party without knowing technical decisions.
20. The S-curve is the most diagnostically valuable future chart, requires period history, and is documented as an evolution path rather than an accidental omission.
21. The neutral band is fixed and non-configurable; the dashboard analyzes one project at a time.

- [ ] **Step 3: Assign \`Resuelto en\` without inference.**

Apply exactly:

\`\`\`text
cutoff date belongs to project -> ADR-005
project BAC is the sum of activities -> ADR-006b
physical cascade delete -> ADR-008
multiple projects with one selected -> ADR-006a
recalculation on edit confirmation -> ADR-007
\`\`\`

For other rows, use an ADR only where its decision explicitly absorbs the assumption (for example, rounding/classification in ADR-003 and temporal single-photo consequences in ADR-005); otherwise write \`—\`.

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
La tabla continúa con las 21 decisiones normalizadas de Task 1.

## Supuestos con mayor riesgo

- **Modelo temporal:** cambiaría el modelo de fotografía vigente, fecha y evolución histórica.
- **Selección:** cambiaría la navegación y el nivel de análisis hacia portafolio.
- **Borrado:** cambiaría la política de conservación, recuperación y ciclo de vida de actividades.
\`\`\`

- [ ] **Step 2: Keep the table faithful to the PRD.**

Use section references such as \`§2\`, \`§3\`, \`RF-01\`, \`§7.4\` and \`§10\`; preserve the PRD wording for existing justifications and impacts; do not reproduce formulas, derived rules, acceptance examples, facts marked \`[E]\`, or derivations marked \`[D]\`.

- [ ] **Step 3: Check the explicit ADR mapping.**

Confirm the five required rows contain exactly \`ADR-005\`, \`ADR-006b\`, \`ADR-008\`, \`ADR-006a\` and \`ADR-007\` respectively, and that every other ADR reference is supported by the corresponding ADR text.

### Task 3: Verify and commit the document

**Files:**
- Verify: \`docs/ASSUMPTIONS.md\`

- [ ] **Step 1: Verify complete \`[S]\` coverage.**

Run:

\`\`\`bash
rg -n '\\[S\\]' docs/PRD.md
\`\`\`

Compare every occurrence against a row in \`docs/ASSUMPTIONS.md\`; repeated decisions may map to one row, but no decision may be absent.

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
