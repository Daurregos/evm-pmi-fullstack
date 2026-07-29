# Parallel Development Preparation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Liberar las rutas reales para backend, dejar el mock seleccionable por
configuración, cerrar el contrato compartido y completar el oráculo negativo de
dominio antes de iniciar el trabajo paralelo.

**Architecture:** El mock conserva sus selectores derivados del fixture y solo
mueve sus adaptadores App Router a `/mock-api`. `src/shared/contract.ts`
representa DTO HTTP y una prueba genera desde el fixture un literal TypeScript
temporal con `satisfies ProjectAnalysis`, de modo que typecheck y build detectan
deriva sin copiar valores.

**Tech Stack:** TypeScript 5.9, Node test runner, Next.js 16 App Router,
OpenSpec, PostgreSQL/Docker para la suite completa.

---

Fuentes canónicas: `docs/PRD.md`,
`docs/adr/006b-forma-respuesta-contrato-datos.md`,
`docs/adr/009-contrato-errores-api.md`,
`contracts/evm/evm-fixture.json`,
`contracts/evm/openapi.yaml` y
`openspec/changes/prepare-parallel-development/`.

## Mapa de archivos

- `tests/domain/evm.test.ts`: cuarta estrategia negativa y eliminación de
  conteos que duplican arreglos del fixture.
- `tests/domain/decimal.test.ts`: empate `a7.cpi` leído del fixture.
- `docs/TESTING.md`, `contracts/evm/FIXTURE.md`: guía alineada con cuatro
  comprobaciones.
- `src/app/mock-api/projects/**/route.ts`: únicos adaptadores HTTP del mock.
- `tests/contract/mock-http.test.ts`, `scripts/run-contract-tests.ts`: contrato
  focalizado en `/mock-api`.
- `src/ui/api-base-url.ts`, `tests/client/api-base-url.test.ts`: resolución de
  base sin peticiones ni componentes.
- `src/shared/contract.ts`: todos los DTO de transporte cerrados.
- `tests/types/shared-contract.test.ts`: prueba de tipos generada desde el
  fixture real.
- `package.json`, `scripts/test.sh`, `README.md`: comandos y documentación.

### Task 1: Cerrar el oráculo negativo del dominio

**Files:**

- Modify: `tests/domain/evm.test.ts`
- Modify: `tests/domain/decimal.test.ts`
- Modify: `docs/TESTING.md`
- Modify: `contracts/evm/FIXTURE.md`
- Modify: `openspec/changes/prepare-parallel-development/tasks.md`

- [ ] **Step 1: Escribir la cuarta aserción en una entrada deliberadamente incorrecta**

Añadir `cpiExcludingZeroAcActivity` al tipo local y cambiar temporalmente el
resultado del test negativo para excluir `a4`:

```ts
negativeChecks: {
  cpiAsAverageOfIndices: number;
  eacAsSumOfActivityEacs: number;
  eacFromRoundedCpi: number;
  cpiExcludingZeroAcActivity: number;
};
```

Añadir un helper que lea el valor presentado sin copiar su expectativa:

```ts
function displayedIndexAsNumber(index: evm.IndexResult): number | null {
  if (index.display === null) {
    return null;
  }

  return Number(index.display.replace(/^[<>]/, "").replace(",", "."));
}
```

```ts
const result = evm.consolidateProject(
  fixture.readResponse.activities
    .filter((activity) => activity.$id !== "a4")
    .map(activityInput),
);
```

```ts
assert.notEqual(
  displayedIndexAsNumber(result.cpi),
  negative.cpiExcludingZeroAcActivity,
);
```

Usar el mismo helper para `negative.cpiAsAverageOfIndices`: ambos valores CPI
de `negativeChecks` están expresados en la presentación de dos decimales,
mientras EAC conserva comparaciones numéricas directas.

- [ ] **Step 2: Ejecutar el test y verificar RED sensible**

Run:

```bash
node --import tsx --test tests/domain/evm.test.ts
```

Expected: FAIL solo en `negative.cpiExcludingZeroAcActivity`, porque el
`display` de la estrategia incorrecta es el valor leído del fixture.

- [ ] **Step 3: Restaurar la consolidación completa y retirar copias de longitudes**

Dejar el test negativo con todas las actividades:

```ts
const result = evm.consolidateProject(
  fixture.readResponse.activities.map(activityInput),
);
```

Eliminar exclusivamente:

```ts
assert.equal(activities.length, 8);
assert.equal(cases.length, 7);
```

Los bucles siguen recorriendo todos los elementos cargados del fixture.

- [ ] **Step 4: Sustituir el empate duplicado por `a7.cpi`**

Ampliar el tipo de `fixture` en `tests/domain/decimal.test.ts`:

```ts
readResponse: {
  activities: ReadonlyArray<{
    $id: string;
    cpi: {
      value: number;
      display: string;
    };
  }>;
  summary: {
    cpi: { value: number };
    eac: number;
    vac: number;
    progress: number;
  };
};
```

Construir los casos sin copiar `0.625` ni `0.63`:

```ts
const fixtureTie = fixture.readResponse.activities.find(
  (activity) => activity.$id === "a7",
);
assert.ok(fixtureTie);

for (const [input, expected] of [
  ["1.005", "1.01"],
  ["-1.005", "-1.01"],
  [
    fixtureTie.cpi.value.toString(),
    fixtureTie.cpi.display.replace(",", "."),
  ],
] as const) {
  test(`rounds ${input} to ${expected} away from zero`, () => {
    assert.equal(roundForPresentation(input).toString(), expected);
  });
}
```

Conservar los demás casos literales: no están representados en el fixture y
prueban la política decimal, no una copia del oráculo.

- [ ] **Step 5: Alinear las dos guías dependientes**

En `docs/TESTING.md`, hacer que la estrategia de dominio enumere también que
excluir la actividad con EV positivo y AC cero produce el CPI incorrecto leído
de `negativeChecks.cpiExcludingZeroAcActivity`.

En `contracts/evm/FIXTURE.md`, cambiar “Las tres primeras” por una descripción
de las cuatro estrategias de `negativeChecks` y explicar la exclusión de `a4`
como cuarta estrategia, sin cambiar los siete errores conceptuales descritos.

- [ ] **Step 6: Verificar GREEN y la ausencia de números duplicados**

Run:

```bash
node --import tsx --test tests/domain/decimal.test.ts tests/domain/evm.test.ts
rg -n '0\.625|0\.63|0\.73|52710|71578\.95|0\.85' tests/domain
git diff --check
```

Expected: todas las pruebas PASS; `rg` no encuentra valores del fixture
duplicados en tests; `git diff --check` no informa errores.

- [ ] **Step 7: Marcar tareas OpenSpec 1.1–1.3 y crear commit**

Actualizar a `[x]` las tareas 1.1, 1.2 y 1.3. Luego:

```bash
git add -- tests/domain/evm.test.ts tests/domain/decimal.test.ts docs/TESTING.md contracts/evm/FIXTURE.md openspec/changes/prepare-parallel-development/tasks.md
git diff --cached --check
git commit -m "test: close domain fixture oracle gaps"
```

### Task 2: Mover el mock a `/mock-api`

**Files:**

- Modify: `tests/contract/mock-http.test.ts`
- Modify: `scripts/run-contract-tests.ts`
- Create: `src/app/mock-api/projects/route.ts`
- Create: `src/app/mock-api/projects/[projectId]/route.ts`
- Delete: `src/app/projects/route.ts`
- Delete: `src/app/projects/[projectId]/route.ts`
- Modify: `openspec/changes/prepare-parallel-development/tasks.md`

- [ ] **Step 1: Cambiar primero las pruebas y el health check al prefijo**

En `tests/contract/mock-http.test.ts` declarar:

```ts
const baseUrl = "http://127.0.0.1:3100";
const mockPrefix = "/mock-api";
```

Cambiar las rutas de todos los tests a:

```ts
`${mockPrefix}/projects`
`${mockPrefix}/projects/1`
`${mockPrefix}/projects/2`
`${mockPrefix}/projects/999`
```

Usar también `${mockPrefix}/projects` para cada `x-mock-scenario` y actualizar
los nombres de test para que muestren `/mock-api/projects`.

En `scripts/run-contract-tests.ts` declarar el mismo prefijo y cambiar el
health check:

```ts
const baseUrl = "http://127.0.0.1:3100";
const mockPrefix = "/mock-api";
```

```ts
const response = await fetch(`${baseUrl}${mockPrefix}/projects`);
```

- [ ] **Step 2: Ejecutar contrato y verificar RED**

Run:

```bash
npm run test:contract
```

Expected: FAIL porque `/mock-api/projects` todavía no tiene handler. Confirmar
que el runner detiene Next y no deja un proceso escuchando en 3100.

- [ ] **Step 3: Mover los dos adaptadores sin tocar selectores**

Crear `src/app/mock-api/projects/route.ts`:

```ts
import {
  jsonMockResponse,
  selectProjectCollectionResponse,
} from "@/infrastructure/mock/responses";

export function GET(request: Request): Response {
  return jsonMockResponse(selectProjectCollectionResponse(request));
}
```

Crear `src/app/mock-api/projects/[projectId]/route.ts`:

```ts
import {
  jsonMockResponse,
  selectProjectResponse,
} from "@/infrastructure/mock/responses";

interface ProjectRouteContext {
  params: Promise<{ projectId: string }>;
}

export async function GET(
  request: Request,
  context: ProjectRouteContext,
): Promise<Response> {
  const { projectId } = await context.params;
  return jsonMockResponse(selectProjectResponse(request, projectId));
}
```

Eliminar `src/app/projects/route.ts` y
`src/app/projects/[projectId]/route.ts`. No modificar
`src/infrastructure/mock/fixture.ts`, `responses.ts` ni el fixture.

- [ ] **Step 4: Ejecutar contrato y verificar GREEN**

Run:

```bash
npm run test:contract
find src/app/projects -type f -print 2>/dev/null
find src/app/mock-api/projects -type f -print | sort
```

Expected: 7 tests PASS; el primer `find` no imprime archivos; el segundo lista
exactamente los dos handlers nuevos.

- [ ] **Step 5: Marcar tareas OpenSpec 2.1–2.2 y crear commit parcial**

```bash
git add -- tests/contract/mock-http.test.ts scripts/run-contract-tests.ts src/app/mock-api/projects/route.ts 'src/app/mock-api/projects/[projectId]/route.ts' src/app/projects/route.ts 'src/app/projects/[projectId]/route.ts' openspec/changes/prepare-parallel-development/tasks.md
git diff --cached --check
git commit -m "refactor: isolate fixture mock routes"
```

### Task 3: Resolver la base del cliente

**Files:**

- Create: `tests/client/api-base-url.test.ts`
- Create: `src/ui/api-base-url.ts`
- Modify: `package.json`
- Modify: `scripts/test.sh`
- Modify: `README.md`
- Modify: `openspec/changes/prepare-parallel-development/tasks.md`

- [ ] **Step 1: Escribir pruebas del API deseado**

Crear `tests/client/api-base-url.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildEvmApiUrl,
  resolveEvmApiBaseUrl,
} from "../../src/ui/api-base-url";

test("uses the mock prefix when no public base is configured", (context) => {
  const previous = process.env.NEXT_PUBLIC_EVM_API_BASE_URL;
  delete process.env.NEXT_PUBLIC_EVM_API_BASE_URL;
  context.after(() => {
    if (previous === undefined) {
      delete process.env.NEXT_PUBLIC_EVM_API_BASE_URL;
    } else {
      process.env.NEXT_PUBLIC_EVM_API_BASE_URL = previous;
    }
  });

  assert.equal(resolveEvmApiBaseUrl(), "/mock-api");
  assert.equal(buildEvmApiUrl("/projects"), "/mock-api/projects");
});

test("normalizes a configured relative base", () => {
  assert.equal(resolveEvmApiBaseUrl(" /backend/ "), "/backend");
  assert.equal(buildEvmApiUrl("/projects", "/backend/"), "/backend/projects");
  assert.equal(buildEvmApiUrl("/projects", "/"), "/projects");
});

test("normalizes a configured absolute base", () => {
  const configured = "https://api.example.test/v1/";
  assert.equal(
    buildEvmApiUrl("/projects", configured),
    "https://api.example.test/v1/projects",
  );
});
```

Añadir temporalmente a `package.json`:

```json
"test:client": "node --import tsx --test tests/client/*.test.ts"
```

- [ ] **Step 2: Ejecutar y verificar RED por módulo ausente**

Run:

```bash
npm run test:client
```

Expected: FAIL porque `src/ui/api-base-url.ts` no existe.

- [ ] **Step 3: Implementar la resolución mínima**

Crear `src/ui/api-base-url.ts`:

```ts
export const DEFAULT_EVM_API_BASE_URL = "/mock-api";

export function resolveEvmApiBaseUrl(
  configuredBaseUrl = process.env.NEXT_PUBLIC_EVM_API_BASE_URL,
): string {
  const trimmed = configuredBaseUrl?.trim();

  if (!trimmed) {
    return DEFAULT_EVM_API_BASE_URL;
  }

  if (trimmed === "/") {
    return "";
  }

  return trimmed.replace(/\/+$/, "");
}

export function buildEvmApiUrl(
  pathname: `/${string}`,
  configuredBaseUrl = process.env.NEXT_PUBLIC_EVM_API_BASE_URL,
): string {
  return `${resolveEvmApiBaseUrl(configuredBaseUrl)}${pathname}`;
}
```

No añadir `fetch`, estado ni componentes.

- [ ] **Step 4: Integrar la prueba en la suite y documentar configuración**

En `scripts/test.sh`, añadir `npm run test:client` después de
`npm run test:structure`.

En `README.md`, documentar:

````markdown
## Mock y base HTTP del cliente

El mock derivado de `contracts/evm/evm-fixture.json` vive bajo
`/mock-api`; por ejemplo, la colección está en
`GET /mock-api/projects`.

El cliente lee `NEXT_PUBLIC_EVM_API_BASE_URL`. Sin configuración usa
`/mock-api`. Puede recibir una ruta relativa, una URL absoluta o `/` para el
backend real en el mismo origen:

```bash
NEXT_PUBLIC_EVM_API_BASE_URL=/mock-api
NEXT_PUBLIC_EVM_API_BASE_URL=https://api.example.test
NEXT_PUBLIC_EVM_API_BASE_URL=/
```

Cambiar de mock a backend no requiere cambios de código. Como es una variable
`NEXT_PUBLIC_`, Next.js incorpora su valor al build del cliente.
````

Añadir también:

```markdown
## Contrato compartido durante el trabajo paralelo

`src/shared/contract.ts` contiene el contrato HTTP completo que consumen
backend y frontend y queda cerrado durante esta fase. Si una vía necesita otro
tipo, debe detenerse y reportar la divergencia; no debe ampliar `src/shared/`
de manera unilateral.
```

No editar `.env.example`: su `MOCK_PORT` pertenece al proceso del mock y no es
la base pública del cliente.

- [ ] **Step 5: Verificar GREEN y crear commit**

Run:

```bash
npm run test:client
npm run typecheck
git diff --check
```

Expected: 3 tests PASS, typecheck PASS y diff limpio.

Marcar tareas OpenSpec 2.3 y 2.4. Luego:

```bash
git add -- tests/client/api-base-url.test.ts src/ui/api-base-url.ts package.json scripts/test.sh README.md openspec/changes/prepare-parallel-development/tasks.md
git diff --cached --check
git commit -m "feat: configure client API base"
```

### Task 4: Congelar los tipos de `src/shared/`

**Files:**

- Create: `tests/types/shared-contract.test.ts`
- Modify: `src/shared/contract.ts`
- Modify: `package.json`
- Modify: `openspec/changes/prepare-parallel-development/tasks.md`

- [ ] **Step 1: Crear la prueba de tipos generada desde el fixture**

Crear `tests/types/shared-contract.test.ts`:

```ts
import assert from "node:assert/strict";
import { rm, writeFile } from "node:fs/promises";
import { test } from "node:test";
import { resolve } from "node:path";
import ts from "typescript";

import {
  loadFixture,
  stripFixtureMetadata,
} from "../../src/infrastructure/mock/fixture";

const generatedProbePath = resolve(
  "tests/types/.shared-contract-fixture.generated.ts",
);

test("the stripped fixture read payload satisfies ProjectAnalysis", async () => {
  const payload = stripFixtureMetadata(loadFixture().readResponse);
  const source = [
    'import type { ProjectAnalysis } from "../../src/shared/contract";',
    `const payload = ${JSON.stringify(payload)} as const`,
    "  satisfies ProjectAnalysis;",
    "void payload;",
    "",
  ].join("\n");

  await writeFile(generatedProbePath, source, "utf8");

  try {
    const configPath = resolve("tsconfig.json");
    const config = ts.readConfigFile(configPath, (path) =>
      ts.sys.readFile(path),
    );
    assert.equal(config.error, undefined);

    const parsed = ts.parseJsonConfigFileContent(
      config.config,
      ts.sys,
      process.cwd(),
      { incremental: false, noEmit: true },
      configPath,
    );
    const program = ts.createProgram({
      rootNames: [generatedProbePath],
      options: parsed.options,
    });
    const diagnostics = ts.getPreEmitDiagnostics(program);

    assert.deepEqual(
      diagnostics,
      [],
      ts.formatDiagnosticsWithColorAndContext(diagnostics, {
        getCanonicalFileName: (fileName) => fileName,
        getCurrentDirectory: () => process.cwd(),
        getNewLine: () => "\n",
      }),
    );
  } finally {
    await rm(generatedProbePath, { force: true });
  }
});
```

Añadir a `package.json`:

```json
"test:types": "node --import tsx --test tests/types/*.test.ts"
```

Cambiar scripts:

```json
"build": "npm run test:types && next build",
"typecheck": "npm run test:types && tsc --noEmit"
```

- [ ] **Step 2: Ejecutar y verificar RED por contrato incompleto**

Run:

```bash
npm run test:types
```

Expected: FAIL porque `ProjectAnalysis` aún no se exporta. Confirmar después
del fallo que no queda
`tests/types/.shared-contract-fixture.generated.ts`.

- [ ] **Step 3: Reemplazar el contrato parcial por los DTO completos**

Dejar `src/shared/contract.ts` con:

```ts
export type ErrorCode =
  | "malformed_request"
  | "not_found"
  | "validation_failed";

export type ViolationRule =
  | "required"
  | "positive"
  | "non_negative"
  | "range_0_100"
  | "read_only"
  | "unknown";

export type ContractViolation = Readonly<{
  field: string;
  rule: ViolationRule;
  message: string;
}>;

export type ErrorEnvelope = Readonly<{
  code: ErrorCode;
  message: string;
  violations: readonly ContractViolation[];
}>;

export type ProjectListItem = Readonly<{
  id: number;
  name: string;
}>;

export type ProjectWrite = Readonly<{
  name: string | null;
  cutoffDate: string | null;
}>;

export type ProjectRead = Readonly<{
  id: number;
  name: string;
  cutoffDate: string;
}>;

export type ActivityWrite = Readonly<{
  name: string | null;
  bac: number | null;
  plannedProgress: number | null;
  actualProgress: number | null;
  ac: number | null;
}>;

export type IndexStatus =
  | "unfavorable"
  | "neutral"
  | "favorable"
  | "not_evaluable";

export type IndexResult = Readonly<{
  value: number | null;
  display: string | null;
  status: IndexStatus;
  label: string;
}>;

export type ActivityRead = Readonly<{
  id: number;
  name: string;
  bac: number;
  plannedProgress: number;
  actualProgress: number;
  ac: number;
  pv: number;
  ev: number;
  cv: number;
  sv: number;
  cpi: IndexResult;
  spi: IndexResult;
  eac: number | null;
  vac: number | null;
}>;

export type ProjectSummary = Readonly<{
  bac: number;
  pv: number;
  ev: number;
  ac: number;
  cv: number;
  sv: number;
  cpi: IndexResult;
  spi: IndexResult;
  eac: number | null;
  vac: number | null;
  progress: number | null;
  activitiesWithEvAndZeroAc: number;
}>;

export type ProjectAnalysis = Readonly<{
  project: ProjectRead;
  activities: readonly ActivityRead[];
  summary: ProjectSummary;
}>;
```

No conservar `ProjectCollectionItem`: no tiene consumidores y el nombre
canónico del esquema publicado es `ProjectListItem`.

- [ ] **Step 4: Confirmar que la frontera sigue declarada cerrada**

Releer la sección `Contrato compartido durante el trabajo paralelo` añadida en
la tarea anterior y confirmar que la implementación no requiere ampliar la
lista aprobada de trece exportaciones.

- [ ] **Step 5: Verificar GREEN y auditar el contrato**

Run:

```bash
npm run test:types
npm run typecheck
rg -n '^export type ' src/shared/contract.ts
rg -n 'Decimal|projectId|ActivityState' src/shared
git diff --check
```

Expected: prueba y typecheck PASS; se exportan exactamente los trece tipos
listados por el diseño; la búsqueda de tipos internos no produce resultados.

Comparar manualmente campos y uniones contra:

```bash
sed -n '209,566p' contracts/evm/openapi.yaml
sed -n '20,70p' docs/adr/006b-forma-respuesta-contrato-datos.md
sed -n '39,75p' docs/adr/009-contrato-errores-api.md
```

- [ ] **Step 6: Marcar tareas OpenSpec 3.1–3.3 y crear commit**

```bash
git add -- tests/types/shared-contract.test.ts src/shared/contract.ts package.json openspec/changes/prepare-parallel-development/tasks.md
git diff --cached --check
git commit -m "feat: freeze shared HTTP contract types"
```

### Task 5: Verificación y revisión integral

**Files:**

- Modify: `openspec/changes/prepare-parallel-development/tasks.md`
- No modificar fuentes cerradas.

- [ ] **Step 1: Ejecutar verificaciones independientes con salida completa**

Run literalmente, uno por uno:

```bash
node --import tsx --test tests/domain/decimal.test.ts tests/domain/evm.test.ts
npm run test:client
npm run test:types
npm run typecheck
npm run lint
npm run lint:imports
npm run test:integration
npm run test:contract
npm run build
git diff --check origin/develop...HEAD
```

Expected: cada comando termina con código 0; no extrapolar un resultado desde
otro comando.

- [ ] **Step 2: Ejecutar la suite completa fresca**

Run:

```bash
npm test
```

Expected: typecheck, dominio, cliente, integración y contrato PASS contra
PostgreSQL real.

- [ ] **Step 3: Auditar requisitos, rutas y fuentes cerradas**

Run:

```bash
openspec validate prepare-parallel-development --type change --strict --no-interactive
find src/app/projects -type f -print 2>/dev/null
find src/app/mock-api/projects -type f -print | sort
git diff --name-only origin/develop...HEAD
git diff --exit-code origin/develop...HEAD -- docs/PRD.md docs/adr contracts/evm/evm-fixture.json contracts/evm/openapi.yaml
git status --short --branch
git log --oneline --decorate origin/develop..HEAD
```

Expected:

- OpenSpec válido;
- ninguna ruta mock bajo `src/app/projects/`;
- dos handlers bajo `src/app/mock-api/projects/`;
- las cuatro fuentes cerradas sin diff;
- solo archivos del cambio en commits;
- worktree limpio salvo la actualización pendiente de tareas.

- [ ] **Step 4: Solicitar revisión de código y resolver hallazgos**

Usar `superpowers:requesting-code-review` con:

```text
BASE_SHA=fda63e28327b8376502db2d45c1e5a6b60497174
HEAD_SHA=$(git rev-parse HEAD)
WHAT_WAS_IMPLEMENTED=Preparación para desarrollo paralelo: oráculo, mock aislado, base configurable y DTO compartidos.
PLAN_OR_REQUIREMENTS=openspec/changes/prepare-parallel-development/ y este plan.
```

Verificar cada hallazgo contra las fuentes autoritativas. Corregir Critical e
Important mediante un nuevo ciclo RED–GREEN y repetir los comandos afectados.

- [ ] **Step 5: Marcar tareas 4.1–4.3 y crear commit de evidencia**

```bash
git add -- openspec/changes/prepare-parallel-development/tasks.md
git diff --cached --check
git commit -m "test: record parallel preparation verification"
```

No marcar 4.4 hasta que el cambio esté archivado y el PR exista.

### Task 6: Archivar y abrir el PR

**Files:**

- Move via OpenSpec: `openspec/changes/prepare-parallel-development/`
- Modify via OpenSpec archive: `openspec/specs/evm-domain-calculation/spec.md`
- Modify via OpenSpec archive: `openspec/specs/project-scaffold/spec.md`

- [ ] **Step 1: Usar `openspec-archive-change`**

Leer completamente la skill y archivar
`prepare-parallel-development`. Confirmar que los deltas se aplican a las dos
specs consolidadas y que la carpeta histórica conserva propuesta, diseño,
specs y tareas.

- [ ] **Step 2: Verificar el archivo y crear commit histórico**

Run:

```bash
openspec validate --all --strict --no-interactive
git diff --check
git status --short
```

Expected: validación completa PASS y solo artefactos de archivo/specs
consolidadas pendientes.

```bash
git add -- openspec/specs/evm-domain-calculation/spec.md openspec/specs/project-scaffold/spec.md openspec/changes/archive
git diff --cached --check
git commit -m "docs(openspec): archive parallel development preparation"
```

- [ ] **Step 3: Ejecutar verificación final después del archivo**

Run:

```bash
npm test
npm run lint
npm run build
openspec validate --all --strict --no-interactive
git diff --check origin/develop...HEAD
git status --short --branch
```

Expected: todos código 0 y worktree limpio.

- [ ] **Step 4: Publicar rama y crear PR a `develop`**

Run:

```bash
git push -u origin chore/prepare-parallel-development
gh pr create --base develop --head chore/prepare-parallel-development --title "Prepare repository for parallel backend and frontend work" --body "Prepara el repositorio para trabajo paralelo: completa el oráculo negativo, aísla el mock bajo /mock-api, configura NEXT_PUBLIC_EVM_API_BASE_URL y congela los DTO HTTP compartidos. Verificado con npm test, npm run lint y npm run build. PRD, ADR, fixture y OpenAPI permanecen intactos."
gh pr view --json number,url,state,baseRefName,headRefName,mergeStateStatus
```

Expected: PR abierto, `baseRefName` igual a `develop`; no fusionarlo.
