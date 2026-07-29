# Final Evaluator README Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar un README definitivo que levante el dashboard con datos desde un clon limpio, incorporar el proceso de IA aportado y publicar la cobertura de CI en el resumen y como artefacto.

**Architecture:** El cambio mantiene cerrados producto, dominio, contratos y pruebas. `README.md` concentra el recorrido del evaluador y enlaza las fuentes canónicas; `.github/workflows/ci.yml` conserva las puertas existentes, añade build y presenta la cobertura ya generada; `docs/ai_process/` preserva el material aportado.

**Tech Stack:** Markdown, GitHub Actions, Node.js 22, npm, Docker Compose, PostgreSQL 17, Next.js 16, c8.

---

## File map

- Create `docs/ai_process/AI_PROCESS.md`: explicación aportada del uso de IA.
- Create `docs/ai_process/Prompt log - Init EVM Research.md`: historial aportado de investigación.
- Create `docs/ai_process/Prompt log - Product Specs.md`: historial aportado de especificación.
- Modify `.github/workflows/ci.yml`: puertas nombradas, lint sin avisos, build, resumen y artefacto de cobertura.
- Modify `README.md`: guía definitiva, autocontenida y orientada al evaluador.
- Preserve `docs/PRD.md`, `docs/ASSUMPTIONS.md`, `docs/adr/`, `docs/ARCHITECTURE.md`, `docs/TESTING.md`, `contracts/evm/evm-fixture.json` and `contracts/evm/openapi.yaml`: closed authoritative sources.

### Task 1: Incorporate the provided AI process

**Files:**

- Create: `docs/ai_process/AI_PROCESS.md`
- Create: `docs/ai_process/Prompt log - Init EVM Research.md`
- Create: `docs/ai_process/Prompt log - Product Specs.md`
- Source only: `/home/unix_trycore/repositories/trycore/evm-pmi-fullstack/docs/ai_process/`

- [ ] **Step 1: Confirm the source files still match the reviewed material**

Run:

```bash
sha256sum \
  '/home/unix_trycore/repositories/trycore/evm-pmi-fullstack/docs/ai_process/AI_PROCESS.md' \
  '/home/unix_trycore/repositories/trycore/evm-pmi-fullstack/docs/ai_process/Prompt log - Init EVM Research.md' \
  '/home/unix_trycore/repositories/trycore/evm-pmi-fullstack/docs/ai_process/Prompt log - Product Specs.md'
```

Expected:

```text
fd8fbebdaab0f420ad9108e4daff20444e205b82c86565f7b9756c71ca8fad27  /home/unix_trycore/repositories/trycore/evm-pmi-fullstack/docs/ai_process/AI_PROCESS.md
7c879a263d69f40ef5485e37e956c1f6ccb1d2a54fdc8e2ebb69d343ff12b0d7  /home/unix_trycore/repositories/trycore/evm-pmi-fullstack/docs/ai_process/Prompt log - Init EVM Research.md
0744bc6302147bf8d0b1f86c3011ecd3384c43f7781fdc36784b2516f0a1fe10  /home/unix_trycore/repositories/trycore/evm-pmi-fullstack/docs/ai_process/Prompt log - Product Specs.md
```

If a hash differs, stop and inspect the user-owned source instead of silently
copying a changed file.

- [ ] **Step 2: Copy the three files byte-for-byte into the isolated worktree**

Run:

```bash
mkdir -p docs/ai_process
cp -- \
  '/home/unix_trycore/repositories/trycore/evm-pmi-fullstack/docs/ai_process/AI_PROCESS.md' \
  '/home/unix_trycore/repositories/trycore/evm-pmi-fullstack/docs/ai_process/Prompt log - Init EVM Research.md' \
  '/home/unix_trycore/repositories/trycore/evm-pmi-fullstack/docs/ai_process/Prompt log - Product Specs.md' \
  docs/ai_process/
```

Expected: the destination directory contains exactly the three named files.
This is a mechanical preservation copy; do not rewrite the prompt histories.

- [ ] **Step 3: Normalize the one known whitespace defect in the destination**

The source has a trailing space after the heading on line 363 of
`Prompt log - Product Specs.md`. Keep the user-owned source untouched and use
`apply_patch` to change only the destination:

```diff
-## Contexto compartido␠
+## Contexto compartido
```

Expected: prompt text and ordering remain unchanged; only the trailing space is
removed so the repository gate can pass.

- [ ] **Step 4: Prove the preserved content and normalized destination**

Run:

```bash
sha256sum docs/ai_process/*
```

Expected:

```text
fd8fbebdaab0f420ad9108e4daff20444e205b82c86565f7b9756c71ca8fad27  docs/ai_process/AI_PROCESS.md
7c879a263d69f40ef5485e37e956c1f6ccb1d2a54fdc8e2ebb69d343ff12b0d7  docs/ai_process/Prompt log - Init EVM Research.md
097387a780089989845391cc8a622b55e3adbe7dca0df383af7be5147cd7b25a  docs/ai_process/Prompt log - Product Specs.md
```

- [ ] **Step 5: Include new files in whitespace verification**

Run:

```bash
git add -N -- \
  docs/ai_process/AI_PROCESS.md \
  'docs/ai_process/Prompt log - Init EVM Research.md' \
  'docs/ai_process/Prompt log - Product Specs.md'
git diff --check
```

Expected: `git diff --check` exits `0`. If the preserved source itself contains
whitespace warnings, report them before changing user-authored history.

- [ ] **Step 6: Commit the preserved material**

Run:

```bash
git add -- \
  docs/ai_process/AI_PROCESS.md \
  'docs/ai_process/Prompt log - Init EVM Research.md' \
  'docs/ai_process/Prompt log - Product Specs.md'
git commit -m "docs: add AI development process"
```

Expected: one commit containing only the three process files.

### Task 2: Publish coverage and complete CI gates

**Files:**

- Modify: `.github/workflows/ci.yml`
- Verify: `scripts/coverage.sh`
- Verify: `scripts/check-coverage.ts`

- [ ] **Step 1: Record the missing CI behavior before editing**

Run:

```bash
rg -n "max-warnings|GITHUB_STEP_SUMMARY|upload-artifact|npm run build" .github/workflows/ci.yml
```

Expected: no matches. This establishes that zero-warning enforcement, coverage
presentation, artifact upload and build are absent on the base.

- [ ] **Step 2: Replace the workflow with the approved gate sequence**

Use `apply_patch` to make `.github/workflows/ci.yml` exactly:

```yaml
name: CI

on:
  pull_request:
    branches: [develop]
  push:
    branches: [develop]

jobs:
  quality:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:17-alpine
        env:
          POSTGRES_DB: evm
          POSTGRES_USER: evm
          POSTGRES_PASSWORD: evm
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U evm -d evm"
          --health-interval 2s
          --health-timeout 3s
          --health-retries 20
    env:
      DATABASE_URL: postgres://evm:evm@127.0.0.1:5432/evm
      NEXT_TELEMETRY_DISABLED: "1"
    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Lint without warnings
        run: npm run lint -- --max-warnings 0

      - name: Enforce import boundaries
        run: npm run lint:imports

      - name: Check types
        run: npm run typecheck

      - name: Run complete suite with coverage
        run: |
          set -o pipefail
          npm run test:coverage | tee coverage-output.txt

      - name: Publish coverage summary
        if: always()
        run: |
          {
            echo "## Cobertura"
            echo
            if [[ -f coverage-output.txt ]] &&
              grep -q '^| Capa | Líneas | Ramas | Funciones | Sentencias |$' coverage-output.txt; then
              sed -n \
                '/^| Capa | Líneas | Ramas | Funciones | Sentencias |$/,/^$/p' \
                coverage-output.txt
            else
              echo "La ejecución no generó una tabla de cobertura."
            fi
          } >> "$GITHUB_STEP_SUMMARY"

      - name: Upload coverage report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/
          if-no-files-found: error
          retention-days: 14

      - name: Build application
        run: npm run build
```

- [ ] **Step 3: Parse the workflow and verify every requested gate**

Run:

```bash
node --input-type=module -e "import { readFileSync } from 'node:fs'; import { parse } from 'yaml'; parse(readFileSync('.github/workflows/ci.yml', 'utf8'));"
rg -n "max-warnings 0|lint:imports|typecheck|test:coverage|GITHUB_STEP_SUMMARY|upload-artifact@v4|npm run build" .github/workflows/ci.yml
```

Expected: YAML parsing exits `0`; the search reports all seven gate and
presentation mechanisms.

- [ ] **Step 4: Exercise the changed shell fragments locally**

Run:

```bash
npm run lint -- --max-warnings 0
npm run lint:imports
```

Expected: both commands exit `0`, and lint reports no warnings.

After a later coverage run creates `coverage-output.txt`, execute the exact
summary extraction with a temporary summary file:

```bash
GITHUB_STEP_SUMMARY=/tmp/evm-readme-step-summary.md bash -euo pipefail -c '
{
  echo "## Cobertura"
  echo
  if [[ -f coverage-output.txt ]] &&
    grep -q "^| Capa | Líneas | Ramas | Funciones | Sentencias |$" coverage-output.txt; then
    sed -n \
      "/^| Capa | Líneas | Ramas | Funciones | Sentencias |$/,/^$/p" \
      coverage-output.txt
  else
    echo "La ejecución no generó una tabla de cobertura."
  fi
} >> "$GITHUB_STEP_SUMMARY"
'
```

Expected: `/tmp/evm-readme-step-summary.md` contains the heading and the three
coverage rows.

- [ ] **Step 5: Commit the workflow change**

Run:

```bash
git add .github/workflows/ci.yml
git commit -m "ci: publish coverage evidence"
```

Expected: one commit containing only `.github/workflows/ci.yml`.

### Task 3: Replace README with the evaluator journey

**Files:**

- Modify: `README.md`
- Reference only: `docs/PRD.md`
- Reference only: `docs/ASSUMPTIONS.md`
- Reference only: `docs/adr/`
- Reference only: `docs/ARCHITECTURE.md`
- Reference only: `docs/TESTING.md`
- Reference only: `contracts/evm/FIXTURE.md`
- Reference only: `contracts/evm/openapi.yaml`

- [ ] **Step 1: Confirm the required evaluator sections are absent or incomplete**

Run:

```bash
rg -n "^## (1\\. Qué es|2\\. Puesta en marcha|3\\. Documentación del API|4\\. Pruebas y cobertura|5\\. Integración continua|6\\. Cómo está construido|7\\. Mapa de documentos|8\\. Decisiones y trade-offs|9\\. Limitaciones conocidas)$" README.md
```

Expected: no complete nine-section sequence.

- [ ] **Step 2: Replace README with the definitive content**

Use `apply_patch` to make `README.md` exactly:

````markdown
# EVM PMI Fullstack

## 1. Qué es

Este dashboard ayuda a un líder de proyecto a entender si el trabajo avanza según el plan y el presupuesto a partir de una fotografía de sus actividades. Aplica Earned Value Management (EVM) para comparar valor planificado (PV), valor ganado (EV) y costo real (AC), y deriva variaciones, índices y proyecciones sin pedir al usuario que los calcule.

## 2. Puesta en marcha

### Requisitos previos

La secuencia se verificó con estas versiones:

| Herramienta | Versión verificada |
|---|---:|
| Git | 2.43.0 |
| Node.js | 22.22.3 |
| npm | 10.9.8 |
| Docker Engine | 27.4.0 |
| Docker Compose | 2.31.0 |

`package.json` admite Node.js `>=20.19.0`; Node.js 22 es la versión usada localmente y en CI. Los puertos `3000` y `5432` deben estar libres.

### Desde el clon hasta el dashboard

Ejecuta literalmente:

```bash
git clone --branch develop --single-branch https://github.com/Daurregos/evm-pmi-fullstack.git
cd evm-pmi-fullstack
cp .env.example .env.local
npm run env:up
```

`npm run env:up` instala las dependencias bloqueadas con `npm ci`, levanta PostgreSQL 17, aplica las migraciones, carga el [fixture canónico](contracts/evm/evm-fixture.json) y deja Next.js ejecutándose en primer plano. Cuando la terminal muestre `Ready`, abre [http://localhost:3000](http://localhost:3000).

Verás el proyecto de referencia con ocho actividades, sus datos capturados, los indicadores EVM derivados, el consolidado y la gráfica de PV, EV y AC. El selector también permite abrir el proyecto sin actividades.

### Variables de entorno

| Variable | Valor predeterminado | Efecto |
|---|---|---|
| `DATABASE_URL` | `postgres://evm:evm@127.0.0.1:5432/evm` | Conexión del backend, migraciones, semilla y pruebas |
| `NEXT_PUBLIC_EVM_API_BASE_URL` | `/mock-api` | Base HTTP que consume el navegador |
| `MOCK_PORT` | `3000` en `.env.example` | No tiene consumidor en la implementación actual y no cambia ningún puerto |

Los scripts de base de datos leen `DATABASE_URL` del proceso o usan el valor predeterminado; no cargan `.env.local` por sí solos. Next.js sí carga `.env.local`. Al ser pública, `NEXT_PUBLIC_EVM_API_BASE_URL` se incorpora al cliente cuando arranca Next.js.

El dashboard usa el mock del fixture por defecto. Para probar el backend real que sirve el mismo proceso, detén Next.js con `Ctrl+C` —PostgreSQL permanece activo— y ejecuta:

```bash
NEXT_PUBLIC_EVM_API_BASE_URL=/ npm run dev
```

Para volver al mock, detén de nuevo Next.js y ejecuta:

```bash
NEXT_PUBLIC_EVM_API_BASE_URL=/mock-api npm run dev
```

Para apagar el entorno completo:

```bash
# Primero pulsa Ctrl+C en la terminal donde se ejecuta Next.js.
npm run env:down
```

El volumen de PostgreSQL se conserva entre arranques.

## 3. Documentación del API

Con el entorno levantado, Swagger UI está en [http://localhost:3000/api-docs](http://localhost:3000/api-docs). La interfaz carga el mismo contrato versionado que se publica en [`contracts/evm/openapi.yaml`](contracts/evm/openapi.yaml); también se sirve directamente en `http://localhost:3000/api-docs/openapi.yaml`.

## 4. Pruebas y cobertura

Los niveles y sus comandos son:

| Nivel | Comando | Qué comprueba |
|---|---|---|
| Tipos contractuales | `npm run test:types` | La forma compartida de las respuestas |
| Dominio y estructura | `npm run test:structure` | Fórmulas, casos límite y límites entre capas |
| Cliente | `npm run test:client` | Tabla, resumen, gráfica, formularios y flujos de mutación |
| Integración | `npm run test:integration` | Casos de uso, persistencia y transacciones en PostgreSQL |
| Contrato HTTP | `npm run test:contract` | Rutas reales, OpenAPI, errores y mock |
| Política de cobertura | `npm run test:coverage-policy` | Agregación y aplicación de los umbrales |
| Suite completa | `npm test` | Tipos y todos los niveles ejecutables contra PostgreSQL |
| Suite con cobertura | `npm run test:coverage` | Todos los niveles ejecutables instrumentados y sus gates |

La última ejecución exitosa de [`develop`](https://github.com/Daurregos/evm-pmi-fullstack/actions/runs/30458189043) publicó estos valores reales:

| Capa | Líneas | Ramas | Funciones | Sentencias |
|---|---:|---:|---:|---:|
| `domain/` | 100,00 % | 100,00 % | 100,00 % | 100,00 % |
| `application/` | 93,22 % | 90,24 % | 100,00 % | 93,22 % |
| Global | 85,41 % | 92,04 % | 86,87 % | 85,41 % |

Los gates se aplican a las cuatro métricas: `domain/` exige 95 %, `application/` 90 % y el conjunto global 80 %. El dominio concentra las fórmulas, estados y casos límite del fixture, por eso tiene el umbral más alto; aplicación orquesta esas reglas y admite algo más de adaptación; el global incluye HTTP, persistencia e interfaz, donde existen fronteras que requieren otras clases de evidencia. La cobertura de ramas es obligatoria porque una validación o un estado evaluable/no evaluable puede dejar todas sus líneas ejecutadas aunque una alternativa nunca se haya probado. La estrategia y las exclusiones justificadas están en [`docs/TESTING.md`](docs/TESTING.md).

Para regenerar los reportes:

```bash
npm run test:coverage
```

El resumen aparece en la terminal y el informe navegable queda en `coverage/index.html`.

## 5. Integración continua

El [workflow de CI](.github/workflows/ci.yml) se ejecuta en cada pull request y push dirigido a `develop`; las [ejecuciones están en GitHub Actions](https://github.com/Daurregos/evm-pmi-fullstack/actions/workflows/ci.yml). Sobre Node.js 22 y PostgreSQL 17:

1. instala exactamente `package-lock.json`;
2. ejecuta ESLint con cero avisos permitidos;
3. hace cumplir las reglas de imports y límites de capas;
4. comprueba tipos;
5. ejecuta la suite completa instrumentada contra PostgreSQL y aplica los umbrales de cobertura;
6. construye la aplicación con Next.js.

La cobertura se ve en dos lugares de cada ejecución: la tabla de capas aparece en el **resumen del trabajo** y el informe HTML completo se descarga al final de la página como artefacto **`coverage-report`**. Tras descargarlo, abre `index.html`.

## 6. Cómo está construido

```text
UI (Next.js/React) → aplicación → dominio EVM ← infraestructura (HTTP/PostgreSQL)
```

| Elección | Motivo |
|---|---|
| Next.js 16 con React 19 | Sirve dashboard y API en un solo proceso sin duplicar contratos |
| PostgreSQL 17 | Verifica decimales exactos, restricciones y transacciones reales |
| Drizzle ORM 0.45 | Mantiene esquema y migración SQL revisables, incluida la cascada |
| decimal.js 10.6 | Evita errores de punto flotante en cálculo, clasificación y redondeo |
| Recharts 2.15.4 | Cubre la comparación PV/EV/AC con una librería declarativa comprobable |
| Runner nativo de Node.js y c8 | Mantiene una pila de pruebas pequeña y mide líneas, ramas, funciones y sentencias |

El razonamiento y los límites de las capas están en [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## 7. Mapa de documentos

Orden recomendado:

| Orden | Documento | Para qué leerlo |
|---:|---|---|
| 1 | [`docs/PRD.md`](docs/PRD.md) | Alcance, reglas EVM y criterios de aceptación; es la fuente de producto |
| 2 | [`docs/ASSUMPTIONS.md`](docs/ASSUMPTIONS.md) | Supuestos adoptados y su trazabilidad al PRD y los ADR |
| 3 | [`docs/adr/`](docs/adr/) | Decisiones arquitectónicas y técnicas, con alternativas y verificación |
| 4 | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Vista de capas, dependencias permitidas y responsabilidades |
| 5 | [`docs/TESTING.md`](docs/TESTING.md) | Niveles, oráculos, gates y estrategia de cobertura |
| 6 | [Puesta en marcha](#2-puesta-en-marcha) | Guía operativa canónica actual; no existe un `docs/OPERATIONS.md` separado |
| 7 | [`contracts/evm/FIXTURE.md`](contracts/evm/FIXTURE.md) | Cómo leer el oráculo numérico `evm-fixture.json` |
| 8 | [`contracts/evm/openapi.yaml`](contracts/evm/openapi.yaml) | Contrato HTTP publicado y consumido por Swagger |
| 9 | [`docs/ai_process/AI_PROCESS.md`](docs/ai_process/AI_PROCESS.md) | Uso de IA, decisiones humanas e historial de prompts del desarrollo |

## 8. Decisiones y trade-offs

- **Foto vigente en lugar de historial.** Mantiene simples edición, persistencia y API bajo el tiempo disponible; impide tendencias y auditoría temporal.
- **Un proyecto seleccionado en lugar de portafolio.** Profundiza el diagnóstico de un proyecto; deja fuera agregación y comparación entre proyectos.
- **Indicadores derivados solo en el servidor.** Conserva una única verdad EVM y evita divergencias; el cliente depende del contrato para cualquier nueva interpretación.
- **Profundidad verificable antes que amplitud.** Se priorizaron dominio, contrato, edición y pruebas; autenticación, permisos, recuperación e historial quedaron fuera deliberadamente.

## 9. Limitaciones conocidas

- ADR-003 conserva la frase indiferenciada «el avance a porcentaje entero». El glosario del PRD permite entenderla como avance del proyecto, pero corregir el ADR requiere su flujo documental dedicado.
- Un formato de fecha incompatible devuelve `400` con `violations: []`, sin identificar el campo; un BAC negativo devuelve `422` con `field: "bac"` y `rule: "positive"`. Los dos casos son contractuales, pero el primero ofrece menos ayuda a la persona usuaria.
- Recharts está fijado en 2.15.4 porque la versión 3 mueve el trazado a efectos y dejaría RF-09 sin la cobertura actual basada en render estático.
- Las deudas menores de interfaz incluyen `window.confirm` para borrado, ausencia de reintento automático de una vista desactualizada y pruebas React que no ejercitan efectos, el evento real del selector ni `showModal`.
- `EAC = BAC / CPI` extrapola la eficiencia de costos observada; es una de varias fórmulas posibles en PMI y no modela supuestos alternativos.
- SPI converge a 1 cuando todo el alcance termina, aunque el proyecto haya terminado tarde, y no sustituye un análisis de ruta crítica.
- Todo el diagnóstico depende del avance real reportado, que sigue siendo una estimación humana.
- La **curva S** —PV, EV y AC acumulados por periodo— es la evolución de mayor valor diagnóstico. Requiere historial temporal, hoy fuera de alcance por [ADR-005](docs/adr/005-modelo-temporal-foto-unica-historial.md).
````

- [ ] **Step 3: Check structure, links and non-duplication**

Run:

```bash
rg -n "^## [1-9]\\. " README.md
rg -n "http://localhost:3000/api-docs|contracts/evm/openapi.yaml|coverage-report|GITHUB_STEP_SUMMARY|curva S|ADR-005|Recharts.*2\\.15\\.4" README.md .github/workflows/ci.yml
```

Expected: exactly nine numbered section headings; every named operational,
coverage and limitation requirement has at least one match.

Validate all relative Markdown targets:

```bash
node --input-type=module -e "import { readFileSync, existsSync } from 'node:fs'; const text=readFileSync('README.md','utf8'); const links=[...text.matchAll(/\\[[^\\]]+\\]\\(([^)#]+)(?:#[^)]+)?\\)/g)].map(([,target])=>target).filter((target)=>!target.startsWith('http')); const missing=[...new Set(links)].filter((target)=>!existsSync(target)); if(missing.length){console.error(missing.join('\\n'));process.exit(1)}"
```

Expected: exits `0` with no missing relative target.

- [ ] **Step 4: Verify the README against authoritative sources**

Run:

```bash
rg -n '"node":|postgres:17|drizzle-orm|decimal.js|recharts|swagger-ui-dist|test:coverage|test:contract|test:integration|test:client|test:structure' package.json docker-compose.yml
rg -n "95 %|90 %|80 %|Ramas" docs/TESTING.md
rg -n "foto|historial|curva S" docs/adr/005-modelo-temporal-foto-unica-historial.md
rg -n "redondea montos e índices|avance a porcentaje entero" docs/adr/003-representacion-dinero-porcentajes-redondeo.md
```

Expected: every version, command, threshold and limitation stated in README has
a direct match in its authoritative source.

- [ ] **Step 5: Commit the README**

Run:

```bash
git add README.md
git commit -m "docs: write definitive evaluator readme"
```

Expected: one commit containing only `README.md`.

### Task 4: Run the complete verification matrix

**Files:**

- Verify: `README.md`
- Verify: `.github/workflows/ci.yml`
- Verify: `docs/ai_process/*`
- Verify: all executable project sources through existing scripts

- [ ] **Step 1: Include every new file and run whitespace verification**

Run:

```bash
git add -N -- \
  docs/ai_process/AI_PROCESS.md \
  'docs/ai_process/Prompt log - Init EVM Research.md' \
  'docs/ai_process/Prompt log - Product Specs.md'
git diff --check origin/develop...HEAD
```

Expected: exits `0`.

- [ ] **Step 2: Run fresh static and executable gates**

Run each command separately and read its full output:

```bash
npm run lint -- --max-warnings 0
npm run lint:imports
npm run typecheck
npm test
npm run test:coverage
npm run build
```

Expected:

- all commands exit `0`;
- `npm test` passes types plus structural/domain, client, integration and
  contract suites against PostgreSQL;
- coverage prints domain `100.00/100.00/100.00/100.00`, application
  `93.22/90.24/100.00/93.22`, global
  `85.41/92.04/86.87/85.41`, unless a documented source-only refactor changes
  executable coverage;
- `coverage/index.html` exists;
- build completes without errors.

- [ ] **Step 3: Exercise the CI summary extraction after coverage**

Run:

```bash
npm run test:coverage | tee coverage-output.txt
GITHUB_STEP_SUMMARY=/tmp/evm-readme-step-summary.md bash -euo pipefail -c '
: > "$GITHUB_STEP_SUMMARY"
{
  echo "## Cobertura"
  echo
  if [[ -f coverage-output.txt ]] &&
    grep -q "^| Capa | Líneas | Ramas | Funciones | Sentencias |$" coverage-output.txt; then
    sed -n \
      "/^| Capa | Líneas | Ramas | Funciones | Sentencias |$/,/^$/p" \
      coverage-output.txt
  else
    echo "La ejecución no generó una tabla de cobertura."
  fi
} >> "$GITHUB_STEP_SUMMARY"
'
sed -n '1,10p' /tmp/evm-readme-step-summary.md
```

Expected: heading, Markdown header and the three coverage rows. Remove the
untracked `coverage-output.txt` after inspection; `coverage/` is ignored.

- [ ] **Step 4: Verify the literal startup path from a clean local clone**

First stop the baseline compose project:

```bash
npm run env:down
```

Create a clean clone without reusing `node_modules`:

```bash
readme_verify_root="$(mktemp -d /tmp/evm-readme-verify.XXXXXX)"
git clone --branch docs/final-readme --single-branch \
  /home/unix_trycore/repositories/trycore/evm-pmi-fullstack \
  "$readme_verify_root/evm-pmi-fullstack"
cd "$readme_verify_root/evm-pmi-fullstack"
cp .env.example .env.local
npm run env:up
```

Expected within three minutes on the verified environment: `npm ci`,
PostgreSQL health, migrations and seed succeed; Next.js prints `Ready` and
remains in the foreground on port 3000.

From another terminal, verify the visible inputs:

```bash
curl -fsS http://127.0.0.1:3000/ > /tmp/evm-readme-dashboard.html
curl -fsS http://127.0.0.1:3000/mock-api/projects/1 |
  node -e "let body='';process.stdin.on('data',chunk=>body+=chunk);process.stdin.on('end',()=>{const project=JSON.parse(body);if(project.activities.length!==8)process.exit(1);console.log(project.project.name, project.activities.length)})"
curl -fsS -o /tmp/evm-readme-swagger.html -w '%{http_code}\n' \
  http://127.0.0.1:3000/api-docs
curl -fsS -o /tmp/evm-readme-openapi.yaml -w '%{http_code}\n' \
  http://127.0.0.1:3000/api-docs/openapi.yaml
```

Expected: root returns `200`; the fixture assertion prints the reference project
and `8`; Swagger and OpenAPI each print `200`.

Stop Next.js with `Ctrl+C`, then verify the real backend switch:

```bash
NEXT_PUBLIC_EVM_API_BASE_URL=/ npm run dev
```

Expected: Next.js becomes ready on port 3000. From another terminal:

```bash
curl -fsS http://127.0.0.1:3000/projects/1 |
  node -e "let body='';process.stdin.on('data',chunk=>body+=chunk);process.stdin.on('end',()=>{const project=JSON.parse(body);if(project.activities.length!==8)process.exit(1);console.log(project.project.name, project.activities.length)})"
```

Expected: the real PostgreSQL-backed response prints the reference project and
`8`.

Stop Next.js with `Ctrl+C`, then:

```bash
npm run env:down
```

Expected: the clone's PostgreSQL container and network are stopped. Preserve the
temporary clone path in the handoff as verification evidence; do not delete it
with a broad command.

- [ ] **Step 5: Audit the final diff and commits**

Return to the implementation worktree, then run:

```bash
git status --short --branch
git diff --check origin/develop...HEAD
git diff --stat origin/develop...HEAD
git diff --name-status origin/develop...HEAD
git log --oneline --decorate origin/develop..HEAD
```

Expected tracked files:

```text
M	.github/workflows/ci.yml
M	README.md
A	docs/ai_process/AI_PROCESS.md
A	docs/ai_process/Prompt log - Init EVM Research.md
A	docs/ai_process/Prompt log - Product Specs.md
A	docs/superpowers/plans/2026-07-29-final-readme.md
A	docs/superpowers/specs/2026-07-29-final-readme-design.md
```

No user-owned file from the main worktree appears.

### Task 5: Publish the branch and verify CI

**Files:**

- Publish only the commits on `docs/final-readme`
- Target: `develop`

- [ ] **Step 1: Push the reviewed branch**

Run:

```bash
git push -u origin docs/final-readme
```

Expected: remote branch `docs/final-readme` is created without rewriting
history.

- [ ] **Step 2: Create the integration pull request**

Run:

```bash
gh pr create \
  --base develop \
  --head docs/final-readme \
  --title "docs: deliver definitive evaluator README" \
  --body "## Resumen
- convierte README en una guía de arranque verificable
- publica cobertura en el resumen y como artefacto de CI
- incorpora el proceso de IA aportado

## Verificación
- lint e imports
- tipos y suite completa contra PostgreSQL
- cobertura con gates y reporte HTML
- build
- arranque limpio, dashboard con ocho actividades y Swagger"
```

Expected: a pull request URL targeting `develop`. Do not merge it.

- [ ] **Step 3: Wait for CI and inspect its evidence**

Run:

```bash
gh pr checks docs/final-readme --watch
readme_run_id="$(gh run list --branch docs/final-readme --workflow ci.yml --limit 1 --json databaseId --jq '.[0].databaseId')"
gh run view "$readme_run_id"
```

Expected: the `quality` job passes all gates and the run URL is available.

Download the published artifact:

```bash
readme_artifact_dir="$(mktemp -d /tmp/evm-coverage-artifact.XXXXXX)"
gh run download "$readme_run_id" \
  --name coverage-report \
  --dir "$readme_artifact_dir"
test -f "$readme_artifact_dir/index.html"
```

Expected: `coverage-report` downloads successfully and contains `index.html`.
Open the run URL in GitHub to confirm the job summary displays the same three
coverage rows. If the UI cannot be inspected from the execution environment,
report that limitation separately instead of claiming visual confirmation.

- [ ] **Step 4: Final handoff**

Report:

- the clean startup sequence and its elapsed result;
- dashboard URL and eight-activity evidence;
- Swagger URL and HTTP status;
- exact coverage percentages;
- CI run, PR and artifact URLs or identifiers;
- that CI exposes coverage in the job summary and `coverage-report`;
- commit list and target branch;
- preserved untracked files in the main worktree;
- any limitation that could not be directly inspected.
