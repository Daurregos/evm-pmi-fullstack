# Slice B2 — Flujo de edición del dashboard: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to
> implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for
> tracking. Subagentes: prohibidos en esta sesión por instrucción del usuario.

**Goal:** Añadir al dashboard crear, editar y eliminar proyectos y actividades
sobre las ocho operaciones publicadas, con la mitad de cliente de ADR-007 y las
infracciones de ADR-009 junto a su campo.

**Architecture:** Todo el comportamiento verificable vive en módulos sin React
—estado de formulario, retroalimentación de errores, flujo de mutación y planes
por operación—; los componentes solo presentan y `dashboard-view.tsx` sigue
siendo el único con estado. Las pruebas de cliente renderizan con
`react-dom/server` contra la API simulada del fixture.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript estricto,
`node --test` con `tsx`, `react-dom/server`, fixture
`contracts/evm/evm-fixture.json`.

## Global Constraints

- Fuentes canónicas del cambio: `openspec/changes/implement-slice-b2-dashboard-editing/`
  (proposal, design, specs, tasks) y
  `docs/superpowers/specs/2026-07-29-slice-b2-dashboard-editing-design.md`.
- Territorio permitido: `src/ui/`, `src/app/globals.css`, `tests/client/`,
  `README.md`, `src/ui/README.md`, `tests/client/README.md`.
- Prohibido modificar: `src/domain/`, `src/application/`,
  `src/infrastructure/`, `src/shared/contract.ts`, `src/app/projects/**`,
  `src/app/mock-api/**`, `docs/PRD.md`, `docs/adr/`,
  `contracts/evm/openapi.yaml`, `contracts/evm/evm-fixture.json`.
- El cliente no calcula: ningún módulo con vocabulario EVM puede contener una
  expresión aritmética binaria, **ni siquiera `+` de concatenación**. Usa
  plantillas de cadena.
- El cliente no valida reglas de negocio, no redondea y no recorta.
- Los valores esperados de las pruebas se leen del fixture.
- Campos y `operationId` en inglés `lowerCamelCase`; textos visibles en español.
- Ningún componente importa CSS: todo el estilo vive en `src/app/globals.css`.

---

### Task 1: La API simulada aprende a escribir

**Files:**
- Modify: `tests/client/simulated-api.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface SimulatedCall {
    readonly method: string;      // "GET" cuando no hay init
    readonly path: string;        // pathname resuelto
    readonly body: unknown;       // cuerpo JSON parseado, o undefined
  }
  export interface SimulatedApiOptions {
    readonly analysisByProjectId?: Readonly<Record<string, ProjectAnalysis>>;
    readonly collection?: readonly ProjectListItem[];
    readonly failWithScenario?: string;      // ya existente
    readonly writeFailure?: string;          // escenario de errorEnvelopes o id de validationChecks
    readonly failingReads?: number;          // primeras N lecturas de análisis que fallan por red
    readonly analysisAfterWrite?: ProjectAnalysis;  // foto servida tras una escritura exitosa
    readonly collectionAfterWrite?: readonly ProjectListItem[];
    readonly createdProject?: ProjectRead;   // cuerpo del 201 de POST /projects
  }
  export interface SimulatedApi {
    readonly requests: readonly string[];    // se conserva: rutas en orden
    readonly calls: readonly SimulatedCall[];
    readonly fetch: (input: string, init?: RequestInit) => Promise<Response>;
  }
  export function validationCase(caseId: string): { body: ErrorEnvelope; status: number };
  ```
- El `fetch` responde: `201`+`ProjectRead` a `POST /projects`, `200`+`ProjectRead`
  a `PUT /projects/{id}`, `204` sin cuerpo a `DELETE`, `201`/`200`+`ActivityRead`
  a las escrituras de actividad, y el estado y cuerpo de `writeFailure` cuando
  está presente. Una lectura que cae dentro de `failingReads` rechaza con
  `new TypeError("fetch failed")`.

- [ ] **Step 1: escribir la extensión** con `validationCase` leyendo
  `validationChecks.cases` por `$id`, el registro de `calls` y las respuestas de
  escritura tomadas de `readResponse.project` y `readResponse.activities[0]`.
- [ ] **Step 2: comprobar que no rompe lo existente**

Run: `npm run test:client`
Expected: PASS (las pruebas de B1 no cambian de comportamiento).

- [ ] **Step 3: Commit**

```bash
git add tests/client/simulated-api.ts
git commit -m "test(client): teach the simulated API the eight operations"
```

---

### Task 2: Estado del formulario de actividad

**Files:**
- Create: `src/ui/activity-form-state.ts`
- Test: `tests/client/activity-form.test.tsx`

**Interfaces:**
- Produces:
  ```ts
  export type ActivityFormField =
    | "name" | "bac" | "plannedProgress" | "actualProgress" | "ac";
  export const ACTIVITY_FORM_FIELDS: readonly ActivityFormField[];
  export type ActivityFormValues = Readonly<Record<ActivityFormField, string>>;
  export function blankActivityForm(): ActivityFormValues;
  export function activityFormOf(activity: ActivityRead): ActivityFormValues;
  export function withActivityValue(
    values: ActivityFormValues,
    field: ActivityFormField,
    raw: string,
  ): ActivityFormValues;
  export function activityWriteOf(values: ActivityFormValues): ActivityWrite;
  ```
- Reglas: `activityFormOf` usa `String(...)`, sin redondear. `activityWriteOf`
  devuelve exactamente las cinco claves; cadena vacía o texto no finito → `null`.

- [ ] **Step 1: prueba que falla**

```tsx
test("the activity write carries exactly the five captured data points", () => {
  const [activity] = referenceAnalysis.activities;
  const write = activityWriteOf(activityFormOf(activity));

  assert.deepEqual(Object.keys(write).sort(), [
    "ac", "actualProgress", "bac", "name", "plannedProgress",
  ]);
  assert.equal(write.bac, activity.bac);
  assert.equal(write.plannedProgress, activity.plannedProgress);
});

test("a captured percentage with decimals reaches the form unrounded", () => {
  const input = bandCaseInput("B5");   // el caso trae decimales
  const values = activityFormOf({
    ...referenceAnalysis.activities[0],
    actualProgress: input.actualProgress,
    plannedProgress: input.plannedProgress,
  });

  assert.equal(values.plannedProgress, String(input.plannedProgress));
  assert.equal(Number(values.actualProgress), input.actualProgress);
});

test("an empty box travels as absent", () => {
  const values = withActivityValue(blankActivityForm(), "bac", "");
  assert.equal(activityWriteOf(values).bac, null);
});
```

- [ ] **Step 2: ejecutar y ver el fallo**

Run: `npm run test:client 2>&1 | tail -20`
Expected: FAIL — `Cannot find module '.../activity-form-state'`.

- [ ] **Step 3: implementar el módulo** con un ayudante privado
  `numberOrNull(raw: string): number | null` que devuelve `null` con cadena
  vacía o `Number.isFinite` falso. Sin aritmética.
- [ ] **Step 4: ejecutar** — Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add src/ui/activity-form-state.ts tests/client/activity-form.test.tsx
git commit -m "feat(ui): capture the five activity data points as raw strings"
```

---

### Task 3: Estado del formulario de proyecto

**Files:**
- Create: `src/ui/project-form-state.ts`
- Test: `tests/client/project-form.test.tsx`

**Interfaces:**
- Produces:
  ```ts
  export type ProjectFormField = "name" | "cutoffDate";
  export const PROJECT_FORM_FIELDS: readonly ProjectFormField[];
  export type ProjectFormValues = Readonly<Record<ProjectFormField, string>>;
  export function blankProjectForm(): ProjectFormValues;
  export function projectFormOf(project: ProjectRead): ProjectFormValues;
  export function withProjectValue(
    values: ProjectFormValues,
    field: ProjectFormField,
    raw: string,
  ): ProjectFormValues;
  export function projectWriteOf(values: ProjectFormValues): ProjectWrite;
  ```

- [ ] **Step 1: prueba que falla**

```tsx
test("the project write carries both editable fields", () => {
  const write = projectWriteOf(projectFormOf(referenceAnalysis.project));

  assert.deepEqual(Object.keys(write).sort(), ["cutoffDate", "name"]);
  assert.equal(write.name, referenceAnalysis.project.name);
  assert.equal(write.cutoffDate, referenceAnalysis.project.cutoffDate);
});

test("an empty cut-off date travels as absent", () => {
  const values = withProjectValue(blankProjectForm(), "name", "Proyecto");
  assert.equal(projectWriteOf(values).cutoffDate, null);
});
```

- [ ] **Step 2: ejecutar y ver el fallo.**
- [ ] **Step 3: implementar.**
- [ ] **Step 4: ejecutar** — Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add src/ui/project-form-state.ts tests/client/project-form.test.tsx
git commit -m "feat(ui): capture project name and cut-off date as raw strings"
```

---

### Task 4: Retroalimentación de errores por campo

**Files:**
- Modify: `src/ui/evm-api-client.ts` (solo `EvmApiError` y `readFailure`)
- Create: `src/ui/form-feedback.ts`
- Test: `tests/client/form-feedback.test.tsx`

**Interfaces:**
- Produces:
  ```ts
  // evm-api-client.ts
  export class EvmApiError extends Error {
    readonly status: number;
    readonly code: ErrorCode | undefined;
    readonly violations: readonly ContractViolation[];
  }

  // form-feedback.ts
  export interface FormFeedback {
    readonly kind: "generic" | "validation";
    readonly notice: string;
    readonly byField: Readonly<Record<string, readonly ContractViolation[]>>;
    readonly unassigned: readonly ContractViolation[];
  }
  export const NO_FEEDBACK: FormFeedback;           // kind "generic", notice ""
  export function feedbackOf(
    failure: unknown,
    fields: readonly string[],
  ): FormFeedback;
  export function violationsOf(
    feedback: FormFeedback,
    field: string,
  ): readonly ContractViolation[];
  ```
- `feedbackOf` decide con `code`: `validation_failed` → `kind: "validation"` y
  reparto por `field`; cualquier otro código, ausencia de envolvente o error de
  red → `kind: "generic"`. `notice` toma el `message` de la envolvente cuando
  existe y un texto propio en español cuando no.

- [ ] **Step 1: prueba que falla**

```tsx
test("the composite case places every violation next to its field", () => {
  const failure = new EvmApiError(422, body.message, body.code, body.violations);
  const feedback = feedbackOf(failure, ACTIVITY_FORM_FIELDS);

  assert.equal(feedback.kind, "validation");
  for (const violation of body.violations.filter((candidate) =>
    ACTIVITY_FORM_FIELDS.includes(candidate.field as ActivityFormField),
  )) {
    const placed = violationsOf(feedback, violation.field);
    assert.ok(placed.some((candidate) => candidate.rule === violation.rule));
  }
  assert.deepEqual(
    feedback.unassigned.map((violation) => violation.field).sort(),
    ["cpi", "owner"],
  );
});

test("a rejected write shows every violation of the composite case in the form", () => {
  // renderMarkup(<ActivityForm .../>) y comprobar que el marcado contiene un
  // mensaje por infracción, cada uno dentro del bloque de su campo.
});

test("400 and 404 mark no field", () => {
  for (const scenario of ["malformedRequest", "notFound"]) { /* ... */ }
});
```

- [ ] **Step 2: ejecutar y ver el fallo.**
- [ ] **Step 3: implementar** `violations` en `EvmApiError` (constructor con
  cuarto parámetro opcional, `readFailure` lo pasa cuando la envolvente trae un
  arreglo) y `form-feedback.ts`. `form-feedback.ts` no menciona nombres de campos
  EVM: recibe la lista.
- [ ] **Step 4: ejecutar** — Expected: PASS (la parte de render se completa en la
  Task 8; hasta entonces esa prueba queda escrita al final del archivo y se
  activa allí).
- [ ] **Step 5: Commit**

```bash
git add src/ui/evm-api-client.ts src/ui/form-feedback.ts tests/client/form-feedback.test.tsx
git commit -m "feat(ui): route API violations to the field they name"
```

---

### Task 5: Las seis escrituras del cliente HTTP

**Files:**
- Modify: `src/ui/evm-api-client.ts`
- Test: `tests/client/evm-api-client.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

  export function createProject(body: ProjectWrite, fetchImpl?: FetchLike, base?: string): Promise<ProjectRead>;
  export function replaceProject(projectId: number, body: ProjectWrite, fetchImpl?: FetchLike, base?: string): Promise<ProjectRead>;
  export function deleteProject(projectId: number, fetchImpl?: FetchLike, base?: string): Promise<void>;
  export function createActivity(projectId: number, body: ActivityWrite, fetchImpl?: FetchLike, base?: string): Promise<ActivityRead>;
  export function replaceActivity(projectId: number, activityId: number, body: ActivityWrite, fetchImpl?: FetchLike, base?: string): Promise<ActivityRead>;
  export function deleteActivity(projectId: number, activityId: number, fetchImpl?: FetchLike, base?: string): Promise<void>;
  ```
- Un ayudante privado `write<T>` envía `method`, `Content-Type: application/json`
  y `JSON.stringify(body)`, lanza `readFailure(response)` si no es `ok` y no
  parsea cuerpo cuando el estado es `204`.

- [ ] **Step 1: prueba que falla**

```ts
test("creating an activity posts the write to the nested route", async () => {
  const api = createSimulatedApi();
  const body: ActivityWrite = {
    ac: 500, actualProgress: 40, bac: 1000, name: "Nueva", plannedProgress: 50,
  };

  const created = await createActivity(1, body, api.fetch);

  assert.deepEqual(api.calls, [
    { body, method: "POST", path: "/mock-api/projects/1/activities" },
  ]);
  assert.equal(created.id, referenceAnalysis.activities[0].id);
});

test("a rejected write carries the envelope violations", async () => {
  const api = createSimulatedApi({ writeFailure: "V9" });
  const failure = await createActivity(1, body, api.fetch).catch((error) => error);

  assert.ok(failure instanceof EvmApiError);
  assert.equal(failure.status, 422);
  assert.equal(failure.code, "validation_failed");
  assert.equal(failure.violations.length, validationCase("V9").body.violations.length);
});

test("deleting an activity expects no body", async () => { /* 204 → undefined */ });
```

- [ ] **Step 2: ejecutar y ver el fallo.**
- [ ] **Step 3: implementar.**
- [ ] **Step 4: ejecutar** — Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add src/ui/evm-api-client.ts tests/client/evm-api-client.test.ts
git commit -m "feat(ui): add the six write operations to the API client"
```

---

### Task 6: Flujo de mutación de ADR-007

**Files:**
- Create: `src/ui/mutation-flow.ts`
- Test: `tests/client/mutation-flow.test.tsx`

**Interfaces:**
- Produces:
  ```ts
  export interface DashboardPatch {
    readonly projects?: readonly ProjectListItem[];
    readonly selectedProjectId?: number | null;
    readonly analysis?: ProjectAnalysis | null;
  }
  export type RefreshRead = () => Promise<DashboardPatch>;
  export interface MutationPlan {
    readonly write: () => Promise<void>;
    readonly refresh: RefreshRead;
  }
  export type RefreshOutcome =
    | { readonly kind: "applied"; readonly patch: DashboardPatch }
    | { readonly kind: "stale"; readonly failure: unknown; readonly refresh: RefreshRead };
  export type MutationOutcome =
    | RefreshOutcome
    | { readonly kind: "rejected"; readonly failure: unknown };
  export function applyMutation(plan: MutationPlan): Promise<MutationOutcome>;
  export function retryRefresh(
    stale: { readonly refresh: RefreshRead },
  ): Promise<RefreshOutcome>;
  ```

- [ ] **Step 1: prueba que falla** — las tres comprobaciones de ADR-007:

```tsx
test("typing issues no request", async () => {
  const api = createSimulatedApi();
  let values = blankActivityForm();
  for (const field of ACTIVITY_FORM_FIELDS) {
    values = withActivityValue(values, field, "1");
    values = withActivityValue(values, field, "12");
  }

  assert.deepEqual(api.calls, []);
  const outcome = await applyMutation(createActivityPlan(1, values, api.fetch));
  assert.equal(outcome.kind, "applied");
  assert.ok(api.calls.length > 0);
});

test("a rejected mutation asks for no read and a successful one does", async () => {
  const rejecting = createSimulatedApi({ writeFailure: "V4" });
  const rejected = await applyMutation(createActivityPlan(1, values, rejecting.fetch));
  assert.equal(rejected.kind, "rejected");
  assert.deepEqual(rejecting.calls.map((call) => call.method), ["POST"]);

  const accepting = createSimulatedApi();
  const applied = await applyMutation(createActivityPlan(1, values, accepting.fetch));
  assert.equal(applied.kind, "applied");
  assert.deepEqual(accepting.calls.map((call) => call.method), ["POST", "GET"]);
});

test("a failed refresh is retried without repeating the write", async () => {
  const api = createSimulatedApi({ failingReads: 1 });
  const stale = await applyMutation(createActivityPlan(1, values, api.fetch));
  assert.equal(stale.kind, "stale");

  const retried = await retryRefresh(stale);
  assert.equal(retried.kind, "applied");
  assert.deepEqual(api.calls.map((call) => call.method), ["POST", "GET", "GET"]);
  assert.equal(api.calls.filter((call) => call.method === "POST").length, 1);
});
```

- [ ] **Step 2: ejecutar y ver el fallo.**
- [ ] **Step 3: implementar** `mutation-flow.ts`: `write()` en `try`; si lanza,
  `rejected`; si no, delega en un `runRefresh(refresh)` compartido por
  `applyMutation` y `retryRefresh`.
- [ ] **Step 4: ejecutar** — Expected: PASS junto con la Task 7.
- [ ] **Step 5: Commit** (junto con la Task 7, que aporta los planes).

---

### Task 7: Un plan por operación

**Files:**
- Create: `src/ui/dashboard-mutations.ts`
- Test: `tests/client/mutation-flow.test.tsx` (mismo archivo)

**Interfaces:**
- Produces:
  ```ts
  export function createActivityPlan(projectId: number, values: ActivityFormValues, fetchImpl?: FetchLike): MutationPlan;
  export function replaceActivityPlan(projectId: number, activityId: number, values: ActivityFormValues, fetchImpl?: FetchLike): MutationPlan;
  export function deleteActivityPlan(projectId: number, activityId: number, fetchImpl?: FetchLike): MutationPlan;
  export function createProjectPlan(values: ProjectFormValues, fetchImpl?: FetchLike): MutationPlan;
  export function replaceProjectPlan(projectId: number, values: ProjectFormValues, fetchImpl?: FetchLike): MutationPlan;
  export function deleteProjectPlan(projectId: number, selectedProjectId: number | null, fetchImpl?: FetchLike): MutationPlan;
  ```
- Las lecturas de cada refresco son exactamente las de la tabla del diseño. En
  `createProjectPlan`, el `id` del `201` se guarda en una variable local del
  cierre y solo elige qué proyecto leer.
- `deleteProjectPlan` con `projectId === selectedProjectId` devuelve un refresco
  que solo lee la colección y produce
  `{ analysis: null, projects, selectedProjectId: null }`.

- [ ] **Step 1: prueba que falla** — RF-01 al eliminar el seleccionado:

```tsx
test("deleting the selected project leaves no selection and reads only the collection", async () => {
  const api = createSimulatedApi({ collectionAfterWrite: [projectCollection[1]] });

  const outcome = await applyMutation(deleteProjectPlan(1, 1, api.fetch));

  assert.equal(outcome.kind, "applied");
  assert.deepEqual(api.calls.map((call) => `${call.method} ${call.path}`), [
    "DELETE /mock-api/projects/1",
    "GET /mock-api/projects",
  ]);
  assert.equal(outcome.patch.selectedProjectId, null);
  assert.equal(outcome.patch.analysis, null);
});

test("creating a project reads the collection and the created project", async () => {
  // DELETE/POST → GET /projects → GET /projects/{createdId}
});
```

- [ ] **Step 2: ejecutar y ver el fallo.**
- [ ] **Step 3: implementar.**
- [ ] **Step 4: ejecutar**

Run: `npm run test:client 2>&1 | tail -25`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/mutation-flow.ts src/ui/dashboard-mutations.ts tests/client/mutation-flow.test.tsx
git commit -m "feat(ui): write once, refresh once, retry only the read"
```

---

### Task 8: Formularios y diálogo

**Files:**
- Create: `src/ui/modal.tsx`, `src/ui/form-field.tsx`,
  `src/ui/activity-form.tsx`, `src/ui/project-form.tsx`
- Modify: `tests/client/activity-form.test.tsx`,
  `tests/client/project-form.test.tsx`, `tests/client/form-feedback.test.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces:
  ```ts
  export interface ModalProps {
    readonly title: string;
    readonly onCancel: () => void;
    readonly children: ReactNode;
  }
  export function Modal(props: ModalProps): ReactElement;

  export interface FormFieldProps {
    readonly field: string;
    readonly label: string;
    readonly type: "date" | "number" | "text";
    readonly value: string;
    readonly violations: readonly ContractViolation[];
    readonly onChange: (raw: string) => void;
  }
  export function FormField(props: FormFieldProps): ReactElement;

  export interface ActivityFormProps {
    readonly values: ActivityFormValues;
    readonly feedback: FormFeedback;
    readonly saving: boolean;
    readonly onChange: (field: ActivityFormField, raw: string) => void;
    readonly onSubmit: () => void;
    readonly onCancel: () => void;
  }
  export function ActivityForm(props: ActivityFormProps): ReactElement;
  // ProjectFormProps: igual con ProjectFormValues y ProjectFormField.
  ```
- Marcado: cada campo va en un `<p class="field" data-field="{field}">` con
  `<input>` y un `<span class="field__error" data-field-error="{field}">` por
  infracción; `aria-invalid="true"` y `aria-describedby` cuando hay infracciones.
  Las infracciones no asignadas van en `<ul data-form-violations>`.

- [ ] **Step 1: activar las pruebas de render** ya escritas en las tasks 2 y 4:
  el formulario de actividad no contiene control para los ocho indicadores; la
  respuesta compuesta muestra un mensaje por infracción dentro del bloque de su
  campo; `400` no marca ningún campo.
- [ ] **Step 2: ejecutar y ver el fallo.**
- [ ] **Step 3: implementar los cuatro componentes y el CSS.** `Modal` mantiene
  una `ref` al `<dialog>` y un efecto que llama `showModal()` al montar y
  `close()` al desmontar, con `onCancel` conectado al evento `cancel`.
- [ ] **Step 4: ejecutar** — Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add src/ui/modal.tsx src/ui/form-field.tsx src/ui/activity-form.tsx src/ui/project-form.tsx src/app/globals.css tests/client
git commit -m "feat(ui): capture activities and projects in a native dialog"
```

---

### Task 9: Acciones por fila y composición

**Files:**
- Modify: `src/ui/activities-table.tsx`, `src/ui/dashboard.tsx`,
  `src/ui/dashboard-view.tsx`
- Modify: `tests/client/activities-table.test.tsx`,
  `tests/client/dashboard.test.tsx`

**Interfaces:**
- Produces:
  ```ts
  export interface ActivitiesTableProps {
    readonly activities: readonly ActivityRead[];
    readonly onEditActivity?: (activity: ActivityRead) => void;
    readonly onDeleteActivity?: (activity: ActivityRead) => void;
  }
  export interface DashboardProps {
    readonly analysis: ProjectAnalysis;
    readonly onCreateActivity?: () => void;
    readonly onEditActivity?: (activity: ActivityRead) => void;
    readonly onDeleteActivity?: (activity: ActivityRead) => void;
    readonly onEditProject?: () => void;
    readonly onDeleteProject?: () => void;
  }
  ```
- `dashboard-view.tsx` añade estado del editor
  (`{ kind: "none" } | { kind: "activity"; activityId: number | null; values; feedback; saving } | { kind: "project"; projectId: number | null; values; feedback; saving }`),
  el aviso de vista desactualizada con su reintento de solo lectura, y aplica
  `DashboardPatch` en un único `setState` por campo del parche.

- [ ] **Step 1: reemplazar la prueba de tabla sin edición** por: sin
  manejadores no hay `<button>`; con manejadores hay dos botones por fila y
  sigue sin haber `<input>`, `<form>`, `<textarea>` ni `<select>`.
- [ ] **Step 2: ejecutar y ver el fallo.**
- [ ] **Step 3: implementar la columna de acciones, los botones de proyecto y el
  cableado del contenedor.**
- [ ] **Step 4: ejecutar**

Run: `npm run test:client && npm run lint && npm run typecheck`
Expected: PASS en los tres.

- [ ] **Step 5: Commit**

```bash
git add src/ui tests/client
git commit -m "feat(ui): edit and delete from the dashboard"
```

---

### Task 10: Evidencia y documentación

**Files:**
- Modify: `README.md`, `src/ui/README.md`, `tests/client/README.md`,
  `openspec/changes/implement-slice-b2-dashboard-editing/tasks.md`

- [ ] **Step 1: sustituir en `README.md`** la sección «Alcance heredado por B2»
  por lo que B2 entregó y la deuda que deja (el efecto del `<dialog>` sin
  ejercitar al nivel de cliente).
- [ ] **Step 2: actualizar `src/ui/README.md` y `tests/client/README.md`** con
  los módulos nuevos y el reparto entre lo probado y lo no probado.
- [ ] **Step 3: marcar las tareas del cambio OpenSpec.**
- [ ] **Step 4: verificación fresca**

```bash
git add -N -- README.md src/ui/README.md tests/client/README.md
git diff --check
npm run lint
npm run build
npm test
openspec validate --all --strict
```

Expected: todo en verde; leer la salida completa.

- [ ] **Step 5: comprobación en el navegador** contra el backend real con
  `NEXT_PUBLIC_EVM_API_BASE_URL=/`: crear, editar y eliminar una actividad y ver
  moverse el consolidado.
- [ ] **Step 6: Commit y PR a `develop`.**

---

## Self-Review

**Cobertura de la spec.** Los seis requisitos añadidos y el modificado tienen
tarea: captura de los cinco datos (Task 2, 8), recálculo al confirmar (Task 6),
refresco desde una lectura (Tasks 6, 7), reintento sin repetir la escritura
(Task 6), infracciones por campo (Tasks 4, 8), RF-01 al eliminar el seleccionado
(Task 7), tabla con acciones y sin captura (Task 9).

**Sin marcadores.** Las firmas de los diez módulos están escritas; los nombres
de prueba y los comandos son literales. La única prueba descrita en prosa —el
render de las infracciones compuestas— se implementa en la Task 8, que la
nombra explícitamente.

**Consistencia de tipos.** `MutationPlan`, `DashboardPatch`, `RefreshRead` y
`FormFeedback` se declaran una vez y las tasks 6 a 9 los consumen con esos
mismos nombres. `FetchLike` gana `init` en la Task 5 y las tasks 1 y 7 lo usan
con esa forma.
