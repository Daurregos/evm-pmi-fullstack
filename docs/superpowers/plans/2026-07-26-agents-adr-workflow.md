# AGENTS ADR-Only Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Definir en `AGENTS.md` un flujo ADR-only sin OpenSpec y añadir guardrails documentales demostrados durante la redacción de ADR-003 y ADR-005.

**Architecture:** La jerarquía documental permanece PRD → ADR → OpenSpec activo → implementación. Una excepción explícita enruta los cambios exclusivamente de ADR por Superpowers y revisión documental, mientras los ADR pertenecientes a una implementación activa siguen referenciados desde OpenSpec.

**Tech Stack:** Markdown, Git, ripgrep

---

### Task 1: Update the repository agent workflow

**Files:**
- Modify: `AGENTS.md`
- Reference: `docs/superpowers/specs/2026-07-26-agents-adr-workflow-design.md`

- [ ] **Step 1: Confirm the starting instructions**

Run:

```bash
rg -n '^## (Scope and source of truth|Required change workflow|GitFlow and worktrees|Verification and handoff)$' AGENTS.md
rg -n 'Crea o actualiza el cambio con OpenSpec|Los planes de Superpowers|Mantén commits pequeños|git diff --check' AGENTS.md
! rg -q 'ADR-only' AGENTS.md
```

Expected: the four target sections and existing rules are found; `ADR-only` is absent.

- [ ] **Step 2: Add source-of-truth propagation**

In `Scope and source of truth`, extend the paragraph after the ordered source list with these rules:

```markdown
Si el trabajo sobre un ADR revela una ambigüedad o cambia un comportamiento visible, actualiza primero `docs/PRD.md`; después alinea el ADR y sus artefactos dependientes. Tras modificar una fuente superior, audita explícitamente sus dependientes, incluido este `AGENTS.md` y OpenSpec cuando exista un cambio activo.
```

Keep the existing prohibition against silently resolving contradictions and the instruction to link rather than copy canonical content.

- [ ] **Step 3: Define the ADR-only routing**

In `Required change workflow`, retain OpenSpec as the workflow for product and implementation changes, then add an explicit ADR-only exception with these normative statements:

```markdown
Un cambio dedicado exclusivamente a crear o actualizar ADR no crea, actualiza, aplica ni archiva artefactos OpenSpec. Usa `superpowers:brainstorming`, revisión documental y `superpowers:verification-before-completion`; usa `superpowers:writing-plans` solo cuando la ejecución tenga varios pasos. `superpowers:test-driven-development` se reserva para código y correcciones de comportamiento.

Si un ADR surge dentro de un cambio OpenSpec activo, el ADR registra la decisión y los artefactos de diseño, specs o tareas del cambio lo referencian.
```

Make the existing numbered OpenSpec workflow explicitly apply to changes managed with OpenSpec so its step 3 does not contradict the ADR-only exception.

- [ ] **Step 4: Prevent canonical-content duplication in plans**

Immediately after the existing paragraph that distinguishes Superpowers plans from OpenSpec, add:

```markdown
Los planes referencian las rutas canónicas de PRD y ADR, describen cambios concretos y definen criterios verificables; no reproducen el texto completo de esos artefactos.
```

- [ ] **Step 5: Refine commit discipline**

In `GitFlow and worktrees`, preserve the current rule about small logical commits and approved versions, then add:

```markdown
Mientras la rama no se haya publicado, consolida correcciones menores de revisión en el commit lógico correspondiente; no crees un commit por cada microajuste.
```

Do not authorize rewriting published history or force-pushing.

- [ ] **Step 6: Make documentary verification reproducible**

In `Verification and handoff`, immediately after the documentary `git diff --check` example, add:

```markdown
`git diff --check` no inspecciona archivos nuevos aún no rastreados. Antes de verificar uno, usa `git add -N <ruta-exacta>` o una alternativa que lo incluya efectivamente sin incorporar contenido ajeno.
```

Extend the closure checklist so it requires executing prescribed commands literally. Keep the existing rule that another agent's report is not evidence.

- [ ] **Step 7: Verify the complete AGENTS.md behavior**

Run:

```bash
rg -qF 'Un cambio dedicado exclusivamente a crear o actualizar ADR no crea, actualiza, aplica ni archiva artefactos OpenSpec.' AGENTS.md
rg -qF 'Si un ADR surge dentro de un cambio OpenSpec activo' AGENTS.md
rg -qF 'Los planes referencian las rutas canónicas de PRD y ADR' AGENTS.md
rg -qF 'no crees un commit por cada microajuste' AGENTS.md
rg -qF '`git diff --check` no inspecciona archivos nuevos aún no rastreados.' AGENTS.md
rg -qF 'incluido este `AGENTS.md` y OpenSpec cuando exista un cambio activo' AGENTS.md
rg -qF 'Ejecuta literalmente los comandos prescritos' AGENTS.md
git diff --check -- AGENTS.md
git diff -- AGENTS.md
```

Expected: every new rule is found, whitespace verification produces no output, and the diff changes only the intended sections without duplicating existing rules.

- [ ] **Step 8: Commit the coherent workflow change**

```bash
git add AGENTS.md
git commit -m "docs: define ADR-only agent workflow"
```

Expected: the commit contains only `AGENTS.md`.

### Task 2: Verify the documentation change

**Files:**
- Verify: `AGENTS.md`
- Verify: `docs/superpowers/specs/2026-07-26-agents-adr-workflow-design.md`
- Verify: `docs/superpowers/plans/2026-07-26-agents-adr-workflow.md`

- [ ] **Step 1: Confirm exact branch scope**

Run:

```bash
test "$(git diff --name-only origin/develop...HEAD)" = "$(printf '%s\n' \
  AGENTS.md \
  docs/superpowers/plans/2026-07-26-agents-adr-workflow.md \
  docs/superpowers/specs/2026-07-26-agents-adr-workflow-design.md)"
test -z "$(git diff --name-only origin/develop...HEAD -- docs/PRD.md docs/adr openspec)"
```

Expected: exactly the three approved files changed; PRD, ADR and OpenSpec have no diff.

- [ ] **Step 2: Execute all documentary checks**

Run:

```bash
git diff --check origin/develop...HEAD
rg -qF 'Un cambio dedicado exclusivamente a crear o actualizar ADR no crea, actualiza, aplica ni archiva artefactos OpenSpec.' AGENTS.md
rg -qF 'Si un ADR surge dentro de un cambio OpenSpec activo' AGENTS.md
rg -qF '`git diff --check` no inspecciona archivos nuevos aún no rastreados.' AGENTS.md
git log --oneline --decorate origin/develop..HEAD
git status --short --branch
```

Expected: no whitespace errors; the ADR-only exception and active-OpenSpec routing are both present; the branch contains only logical documentation commits and has no pending changes.
