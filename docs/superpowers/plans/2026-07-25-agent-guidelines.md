# Agent Guidelines Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear un `AGENTS.md` que conecte el dominio EVM, OpenSpec, Superpowers y el GitFlow obligatorio del repositorio.

**Architecture:** Un único documento raíz actuará como contrato operativo y remitirá a las fuentes canónicas en vez de duplicarlas. Sus secciones separarán jerarquía documental, ciclo de cambio, reglas Git, invariantes EVM y evidencia de cierre.

**Tech Stack:** Markdown, Git, GitHub CLI, OpenSpec y skills de Superpowers.

---

### Task 1: Add the repository agent contract

**Files:**
- Create: `AGENTS.md`
- Reference: `docs/PRD.md`
- Reference: `docs/superpowers/specs/2026-07-25-agent-guidelines-design.md`

- [ ] **Step 1: Create the agent guidelines**

Crear `AGENTS.md` con este contenido:

```markdown
# Repository Agent Guidelines

## Scope and source of truth

Estas instrucciones aplican a todo el repositorio.

Antes de cambiar el producto, revisa las fuentes aplicables en este orden:

1. `docs/PRD.md`: define qué necesita el producto y por qué. No introduce decisiones técnicas.
2. `docs/adr/`: registra decisiones arquitectónicas, alternativas y consecuencias.
3. OpenSpec: mantiene la propuesta, las especificaciones, el SDD y las tareas del cambio activo.
4. Código, pruebas y evidencia: materializan y verifican el comportamiento aprobado.

No resuelvas silenciosamente contradicciones en el código. Corrige o escala primero el artefacto responsable. Evita copiar contenido entre niveles; enlaza la fuente canónica.

## Required change workflow

Usa OpenSpec para administrar el alcance y el SDD. Usa Superpowers para analizar y ejecutar el trabajo con disciplina.

1. Inspecciona el estado de Git, el PRD, los ADR aplicables y los cambios OpenSpec activos.
2. Antes de trabajo creativo o cambios de comportamiento, usa `superpowers:brainstorming`.
3. Crea o actualiza el cambio con OpenSpec. Su propuesta, specs, diseño y tareas son la definición canónica del cambio.
4. Si una decisión tiene impacto arquitectónico relevante, regístrala en un ADR y haz que OpenSpec la referencie.
5. Convierte las tareas aprobadas en un plan ejecutable con `superpowers:writing-plans` cuando el trabajo tenga varios pasos.
6. Aplica el cambio OpenSpec usando las skills de implementación pertinentes. Para código o correcciones, usa `superpowers:test-driven-development` antes de escribir la implementación.
7. Ejecuta `superpowers:verification-before-completion` antes de afirmar que el trabajo está terminado, hacer el commit final o crear el PR.
8. Cuando el cambio esté completo y verificado, archívalo con OpenSpec. La actualización del archivo histórico sigue el mismo flujo de revisión.

Los planes de Superpowers detallan la ejecución; no reemplazan las specs ni las tareas canónicas de OpenSpec. Si divergen, actualiza OpenSpec antes de continuar.

## GitFlow and worktrees

- Nunca hagas commits directamente en `main` ni en `develop`.
- Parte de la versión actual de `origin/develop`.
- Usa una rama nueva para cada cambio y un worktree aislado bajo `.worktrees/`.
- Verifica que `.worktrees/` esté ignorado antes de crear el worktree.
- Dirige cada pull request de integración a `develop`.
- Mantén commits pequeños y lógicos. Conserva en commits separados versiones aprobadas cuya comparación aporte trazabilidad.
- Crear un PR no autoriza fusionarlo. Fusiónalo solo cuando el usuario lo solicite o exista autorización explícita.
- No elimines una rama ni un worktree antes de confirmar la integración y comprobar que no tiene cambios pendientes.
- Después de integrar, retira el worktree limpio y poda su metadata. Conserva las ramas salvo que se solicite eliminarlas.

## EVM domain invariants

`docs/PRD.md` es la fuente canónica de fórmulas, casos límite, banda de tolerancia y lenguaje del dominio.

- Los cinco únicos datos capturados por actividad son: nombre, BAC, avance planificado a la fecha de corte, avance real y AC.
- PV, EV, CV, SV, CPI, SPI, EAC y VAC son indicadores derivados. Nunca se capturan ni se editan.
- Consolida sumando BAC, PV, EV y AC por actividad; calcula variaciones, ratios y proyecciones después. Nunca promedies CPI ni SPI.
- El avance del proyecto es `EV_total / BAC_total`.
- Las divisiones por cero producen estados de negocio legítimos definidos o no evaluables según el PRD; no son errores técnicos.
- La interpretación de CPI y SPI es salida del sistema. Aplica la banda neutral definida en el PRD al valor mostrado.
- En requisitos de producto, conserva la trazabilidad: `[E]` explícito, `[D]` derivado necesariamente del dominio y `[S]` supuesto adoptado.

No dupliques aquí las fórmulas ni la matriz completa de estados. Si cambia una regla EVM, actualiza primero el PRD y después sus artefactos dependientes.

## Safety and ownership

- Trata los cambios existentes y los archivos no rastreados como trabajo del usuario.
- No reviertas, sobrescribas, muevas ni incluyas cambios ajenos en un commit.
- Evita operaciones forzadas o destructivas. Solicita autorización cuando el alcance o la recuperación no sean claros.
- Lee las instrucciones completas de cualquier skill aplicable antes de actuar.
- No inventes decisiones faltantes con impacto en producto o arquitectura; registra el supuesto o solicita dirección.

## Verification and handoff

Usa los comandos reales del proyecto para pruebas, lint y build. Para cambios documentales, como mínimo:

```bash
git diff --check
```

Antes del cierre:

1. Comprueba cada requisito o tarea contra el diff resultante.
2. Ejecuta verificaciones frescas y lee su salida completa.
3. Revisa que el commit contenga solo archivos del cambio.
4. Confirma el estado del PR y su destino `develop`.
5. Informa evidencia, limitaciones y cambios locales preservados.

No declares que algo funciona, está integrado o está limpio basándote solo en una edición, una ejecución anterior o el reporte de otro agente.
```

- [ ] **Step 2: Validate formatting and required coverage**

Ejecutar:

```bash
git diff --check
rg -n '^## (Scope and source of truth|Required change workflow|GitFlow and worktrees|EVM domain invariants|Safety and ownership|Verification and handoff)$' AGENTS.md
rg -n 'OpenSpec|Superpowers|origin/develop|pull request.*develop|cinco|PV, EV, CV, SV, CPI, SPI, EAC y VAC|Nunca promedies CPI ni SPI|verification-before-completion' AGENTS.md
```

Resultado esperado: `git diff --check` termina sin salida; el primer `rg` encuentra las seis secciones y el segundo encuentra todas las reglas críticas.

- [ ] **Step 3: Review the scoped diff**

Ejecutar:

```bash
git status --short
git diff -- AGENTS.md
```

Resultado esperado: `AGENTS.md` es el único archivo de implementación sin confirmar y el diff coincide con el contrato aprobado.

- [ ] **Step 4: Commit the implementation**

Ejecutar:

```bash
git add AGENTS.md
git commit -m "docs: add repository agent guidelines"
```

Resultado esperado: un nuevo commit contiene únicamente `AGENTS.md`.

- [ ] **Step 5: Verify the committed result**

Ejecutar:

```bash
git status --short
git show --stat --oneline HEAD
git diff --check origin/develop...HEAD
```

Resultado esperado: el worktree está limpio, el commit final modifica solo `AGENTS.md` y la rama completa no contiene errores de whitespace.
