# Architecture Boundary Rationale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Explicar en la arquitectura por qué EVM se calcula solo en dominio y
documentar el reparto entre presentación contractual y formato del cliente.

**Architecture:** `docs/ARCHITECTURE.md` conserva su secuencia de frontera,
motivación y recorrido ejecutable. El cambio es exclusivamente documental y no
modifica fuentes autoritativas, OpenSpec ni código.

**Tech Stack:** Markdown, Git, GitHub CLI.

---

Fuente aprobada:
`docs/superpowers/specs/2026-07-29-architecture-boundary-rationale-design.md`.

### Task 1: Acoplar el rationale a la arquitectura

**Files:**

- Modify: `docs/ARCHITECTURE.md`

- [ ] **Step 1: Añadir el reparto de presentación a `Límites`**

Añadir como último punto de la lista:

```markdown
- La presentación se reparte: el backend resuelve display de CPI y SPI,
  porque el marcador es lógica de negocio; los montos cruzan sin redondear y
  los formatea la interfaz, porque redondear a dos decimales es formato.
```

- [ ] **Step 2: Añadir la motivación antes de `Lectura y cálculo`**

Insertar, después del párrafo de `phase0/source-boundaries`, el bloque literal
aprobado bajo `## Por qué la frontera está aquí`.

- [ ] **Step 3: Verificar el documento**

Run:

```bash
git diff --check
rg -n -F '## Por qué la frontera está aquí' docs/ARCHITECTURE.md
rg -n -F 'La presentación se reparte:' docs/ARCHITECTURE.md
git diff -- docs/ARCHITECTURE.md
```

Expected: cero errores de whitespace, una coincidencia por texto y un diff
limitado a las dos inserciones aprobadas.

- [ ] **Step 4: Crear el commit documental**

```bash
git add -- docs/ARCHITECTURE.md
git diff --cached --check
git commit -m "docs: explain the EVM calculation boundary"
```

### Task 2: Publicar y crear el pull request

**Files:**

- Verify: branch `feat/slice-a2-http-surface`

- [ ] **Step 1: Confirmar estado y destino**

```bash
git status --short --branch
git merge-base HEAD origin/develop
gh pr list --head feat/slice-a2-http-surface --state all \
  --json number,state,baseRefName,url
```

Expected: worktree limpio y ningún PR previo para la rama.

- [ ] **Step 2: Publicar la rama**

```bash
git push -u origin feat/slice-a2-http-surface
```

- [ ] **Step 3: Crear el PR hacia `develop`**

Crear `/tmp/slice-a2-http-surface-pr.md` con:

```markdown
## Summary

- expose the eight published project and nested-activity HTTP operations
- separate malformed `400` requests from accumulated business `422` errors
- preserve rejected state, close ADR-007 server verification and hand client
  mutation checks to B2
- document the executable architecture and archive the completed OpenSpec

## Verification

- `npm test` — structure 98/98, client 81/81, integration 41/41, contract 56/56
- `npm run lint`
- `npm run build`
- `openspec validate --all --strict` — 6/6 specs
- `git diff --check`
```

Luego ejecutar:

```bash
gh pr create \
  --base develop \
  --head feat/slice-a2-http-surface \
  --title "feat: implement slice A2 HTTP surface" \
  --body-file /tmp/slice-a2-http-surface-pr.md
```

- [ ] **Step 4: Verificar el PR creado**

```bash
gh pr view --json number,state,baseRefName,headRefName,url
```

Expected: PR abierto desde `feat/slice-a2-http-surface` hacia `develop`.
