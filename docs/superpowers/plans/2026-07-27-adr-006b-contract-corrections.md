# ADR-006b Contract Corrections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corregir en ADR-006b el nombre del contador consolidado y completar el contrato de identificadores enteros con su costo de enumerabilidad.

**Architecture:** ADR-006b continúa siendo la única fuente técnica de nombres, tipos y formatos delegados por ADR-006a. El cambio alinea el contador con el PRD y documenta el tipo y la consecuencia de los identificadores sin modificar producto, rutas, formatos adicionales ni artefactos OpenSpec.

**Tech Stack:** Markdown, Git, ripgrep

---

### Task 1: Correct the ADR-006b contract

**Files:**
- Modify: `docs/adr/006b-forma-respuesta-contrato-datos.md:17`
- Modify: `docs/adr/006b-forma-respuesta-contrato-datos.md:40-45`
- Reference: `docs/PRD.md:75`
- Reference: `docs/PRD.md:99-109`
- Reference: `docs/adr/006a-diseno-recursos-rest.md:15-25`
- Reference: `docs/superpowers/specs/2026-07-27-adr-006b-contract-corrections-design.md`

- [ ] **Step 1: Confirm the contractual mismatch**

Run:

```bash
rg -nF 'activitiesWithUnimputedCost' docs/adr/006b-forma-respuesta-contrato-datos.md
! rg -qF 'activitiesWithEvAndZeroAc' docs/adr/006b-forma-respuesta-contrato-datos.md
rg -nF 'cuántas actividades tienen EV mayor que cero y AC igual a cero' docs/PRD.md
rg -nF 'El conteo no declara que los datos sean erróneos.' docs/PRD.md
rg -nF 'Por delegación explícita, ADR-006b define nombres de campo, agrupación interna, tipos y formatos.' docs/adr/006a-diseno-recursos-rest.md
```

Expected: ADR-006b contiene solo el nombre causal anterior; el PRD define la
condición objetiva y niega que el conteo declare un error; ADR-006a delega los
tipos a ADR-006b.

- [ ] **Step 2: Apply the two approved corrections**

En el párrafo que enumera `summary`, sustituir únicamente
`activitiesWithUnimputedCost` por `activitiesWithEvAndZeroAc`.

Inmediatamente después de ese párrafo, añadir:

```markdown
Los identificadores de proyecto y actividad son enteros tanto en los campos `id` de las representaciones como en los parámetros `projectId` y `activityId` de las rutas definidas por ADR-006a.
```

Al final de `## Consecuencias`, añadir:

```markdown
- Los identificadores son secuenciales y, por tanto, adivinables y enumerables. Esto sería inaceptable en un recurso expuesto públicamente, pero resulta irrelevante en una herramienta interna sin control de acceso.
```

No añadir tamaño, signo, formato `int32` o `int64`, mecanismo de generación ni
cambios en otras fuentes.

- [ ] **Step 3: Verify the working-tree diff**

Run:

```bash
git diff --check -- docs/adr/006b-forma-respuesta-contrato-datos.md
rg -qF 'activitiesWithEvAndZeroAc' docs/adr/006b-forma-respuesta-contrato-datos.md
! rg -qF 'activitiesWithUnimputedCost' docs/adr/006b-forma-respuesta-contrato-datos.md
rg -qF 'Los identificadores de proyecto y actividad son enteros tanto en los campos `id` de las representaciones como en los parámetros `projectId` y `activityId` de las rutas definidas por ADR-006a.' docs/adr/006b-forma-respuesta-contrato-datos.md
rg -qF 'Los identificadores son secuenciales y, por tanto, adivinables y enumerables. Esto sería inaceptable en un recurso expuesto públicamente, pero resulta irrelevante en una herramienta interna sin control de acceso.' docs/adr/006b-forma-respuesta-contrato-datos.md
! rg -q -e 'int(8|16|32|64)|unsigned' docs/adr/006b-forma-respuesta-contrato-datos.md
test "$(git diff --name-only)" = 'docs/adr/006b-forma-respuesta-contrato-datos.md'
git diff -- docs/adr/006b-forma-respuesta-contrato-datos.md
```

Expected: todos los chequeos terminan con código cero, `git diff --check` no
produce salida y el diff contiene solamente las dos correcciones aprobadas en
ADR-006b.

- [ ] **Step 4: Commit the ADR correction**

Run:

```bash
git add -- docs/adr/006b-forma-respuesta-contrato-datos.md
git diff --cached --check
git diff --cached --name-only
git commit -m "docs(adr): correct response contract terms"
```

Expected: la lista staged contiene únicamente
`docs/adr/006b-forma-respuesta-contrato-datos.md` y el commit se crea sin
errores.

### Task 2: Verify the completed documentation change

**Files:**
- Verify: `docs/adr/006b-forma-respuesta-contrato-datos.md`
- Verify: `docs/superpowers/specs/2026-07-27-adr-006b-contract-corrections-design.md`
- Verify: `docs/superpowers/plans/2026-07-27-adr-006b-contract-corrections.md`

- [ ] **Step 1: Invoke completion verification**

Read and apply `superpowers:verification-before-completion` before making any
claim that the change is complete.

- [ ] **Step 2: Execute the final checks**

Run:

```bash
git diff --check origin/develop...HEAD
rg -qF 'activitiesWithEvAndZeroAc' docs/adr/006b-forma-respuesta-contrato-datos.md
! rg -qF 'activitiesWithUnimputedCost' docs/adr/006b-forma-respuesta-contrato-datos.md
rg -qF 'Los identificadores de proyecto y actividad son enteros tanto en los campos `id` de las representaciones como en los parámetros `projectId` y `activityId` de las rutas definidas por ADR-006a.' docs/adr/006b-forma-respuesta-contrato-datos.md
rg -qF 'Los identificadores son secuenciales y, por tanto, adivinables y enumerables. Esto sería inaceptable en un recurso expuesto públicamente, pero resulta irrelevante en una herramienta interna sin control de acceso.' docs/adr/006b-forma-respuesta-contrato-datos.md
! rg -q -e 'int(8|16|32|64)|unsigned' docs/adr/006b-forma-respuesta-contrato-datos.md
git diff --name-only origin/develop...HEAD
git log --oneline --decorate origin/develop..HEAD
git status --short --branch
```

Expected: no hay errores de whitespace; el ADR contiene exactamente el nuevo
nombre, el tipo entero y la consecuencia aprobada sin formatos adicionales;
el alcance de rama contiene únicamente ADR-006b, esta especificación y este
plan; existen commits lógicos separados; y el worktree no tiene cambios
pendientes.
