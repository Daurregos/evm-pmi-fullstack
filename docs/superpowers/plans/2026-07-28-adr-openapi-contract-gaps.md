# ADR OpenAPI Contract Gaps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cerrar en ADR-006a, ADR-006b y ADR-009 las decisiones que bloquean el contrato OpenAPI, sin modificar todavía OpenAPI ni el fixture.

**Architecture:** Cada ADR conserva su responsabilidad: ADR-006a decide operaciones y forma de colección, ADR-006b decide esquemas y tipos de cable, y ADR-009 decide la frontera entre validación estructural y de negocio. Las correcciones se aplican como adiciones puntuales sobre decisiones aceptadas y cada costo nuevo se registra en Consecuencias.

**Tech Stack:** Markdown, Git, ripgrep, `wc`

---

### Task 1: Fijar edición y colección en ADR-006a

**Files:**

- Modify: `docs/adr/006a-diseno-recursos-rest.md:15-25`
- Modify: `docs/adr/006a-diseno-recursos-rest.md:27-45`
- Reference: `docs/PRD.md:57-76`
- Reference: `docs/adr/009-contrato-errores-api.md`
- Reference: `docs/superpowers/specs/2026-07-28-adr-openapi-contract-gaps-design.md`

- [ ] **Step 1: Confirmar que ambos huecos siguen abiertos**

Run:

```bash
set -e
rg -nF 'RF-01 y RF-02 operan sobre esas colecciones y miembros.' docs/adr/006a-diseno-recursos-rest.md
rg -nF 'GET /projects` abastece el selector fuera de la lectura analítica.' docs/adr/006a-diseno-recursos-rest.md
! rg -qF 'PUT /projects/{projectId}' docs/adr/006a-diseno-recursos-rest.md
! rg -qF 'arreglo JSON desnudo' docs/adr/006a-diseno-recursos-rest.md
```

Expected: aparecen las dos frases incompletas y no aparece una decisión sobre
`PUT` ni sobre la forma de la colección.

- [ ] **Step 2: Añadir la semántica completa de `PUT`**

Después del primer párrafo de `## Decisión`, añadir exactamente:

```markdown
Las ediciones usan `PUT /projects/{projectId}` y `PUT /projects/{projectId}/activities/{activityId}`. Cada `PUT` reemplaza todos los campos editables, no la representación de lectura. Un campo editable ausente no conserva el valor anterior ni toma un valor predeterminado: incumple `required` y produce `422` según ADR-009. Un campo de solo lectura presente conserva `422 read_only`.
```

- [ ] **Step 3: Concretar la colección del selector**

Sustituir el párrafo que termina en «fuera de la lectura analítica» por:

```markdown
El cliente selecciona mediante `projectId` en la ruta. La selección no se persiste. `GET /projects` abastece exclusivamente el selector y devuelve un arreglo JSON desnudo cuyos elementos contienen `id` y `name`.
```

- [ ] **Step 4: Registrar alternativa y costos**

Añadir a `## Alternativas consideradas`:

```markdown
- **`PATCH` parcial:** reduciría el cuerpo de una edición, pero exigiría decidir un formato de parche y semántica por campo para un formulario que ya conoce el estado editable completo.
```

Añadir a `## Consecuencias`:

```markdown
- Una edición pequeña reenvía todos los campos editables; evita ambigüedad sobre ausencias a costa de un cuerpo mayor.
- El arreglo del selector es mínimo, pero añadir metadatos de paginación exigiría cambiar su forma.
```

- [ ] **Step 5: Ampliar la evidencia prescrita**

Sustituir el primer párrafo de `## Verificación` por:

```markdown
Pruebas de contrato verifican por sí mismas las rutas anidadas, los dos `PUT` de reemplazo, `422 required` ante cualquier ausencia, ausencia de rutas planas o de indicadores, selección por ruta, el arreglo `{id, name}` y una lectura para tabla, consolidado y gráfica.
```

- [ ] **Step 6: Verificar ADR-006a y crear su commit lógico**

Run:

```bash
set -e
git diff --check -- docs/adr/006a-diseno-recursos-rest.md
rg -qF 'PUT /projects/{projectId}' docs/adr/006a-diseno-recursos-rest.md
rg -qF 'PUT /projects/{projectId}/activities/{activityId}' docs/adr/006a-diseno-recursos-rest.md
rg -qF 'arreglo JSON desnudo cuyos elementos contienen `id` y `name`' docs/adr/006a-diseno-recursos-rest.md
rg -qF 'incumple `required` y produce `422`' docs/adr/006a-diseno-recursos-rest.md
rg -qF 'añadir metadatos de paginación exigiría cambiar su forma' docs/adr/006a-diseno-recursos-rest.md
test "$(wc -w < docs/adr/006a-diseno-recursos-rest.md)" -le 600
git add -- docs/adr/006a-diseno-recursos-rest.md
git diff --cached --check
git diff --cached --name-only
git commit -m "docs(adr): define REST update and project list"
```

Expected: todos los chequeos terminan con código cero; el conteo no supera 600
palabras; el staged contiene solo ADR-006a y se crea un commit lógico.

### Task 2: Completar esquemas y fecha en ADR-006b

**Files:**

- Modify: `docs/adr/006b-forma-respuesta-contrato-datos.md:15-34`
- Modify: `docs/adr/006b-forma-respuesta-contrato-datos.md:35-52`
- Reference: `docs/PRD.md:17-25`
- Reference: `docs/PRD.md:115-117`
- Reference: `docs/adr/006a-diseno-recursos-rest.md`
- Reference: `docs/superpowers/specs/2026-07-28-adr-openapi-contract-gaps-design.md`

- [ ] **Step 1: Confirmar los tres huecos de datos**

Run:

```bash
set -e
rg -nF 'La escritura de actividad usa un objeto distinto' docs/adr/006b-forma-respuesta-contrato-datos.md
! rg -qF 'La escritura de proyecto contiene exactamente' docs/adr/006b-forma-respuesta-contrato-datos.md
! rg -qF 'Los cinco campos son obligatorios' docs/adr/006b-forma-respuesta-contrato-datos.md
! rg -qF '`format: date`' docs/adr/006b-forma-respuesta-contrato-datos.md
```

Expected: solo aparece el esquema de actividad existente; faltan proyecto,
obligatoriedad completa y formato de fecha.

- [ ] **Step 2: Completar la forma del selector y `cutoffDate`**

Después del párrafo de identificadores, añadir:

```markdown
Cada elemento de `GET /projects` contiene el `id` entero y `name`; omite `cutoffDate` porque la colección abastece solo el selector.

`cutoffDate` cruza el cable como cadena `format: date`: un `full-date` de RFC 3339 con forma `YYYY-MM-DD`.
```

- [ ] **Step 3: Reemplazar la decisión incompleta de escritura**

Sustituir el último párrafo de `## Decisión` por:

```markdown
La escritura de proyecto contiene exactamente `name` y `cutoffDate`; ambos son obligatorios al crear y reemplazar. La escritura de actividad contiene exactamente `name`, `bac`, `plannedProgress`, `actualProgress` y `ac`. Los cinco campos son obligatorios en toda creación y reemplazo.
```

- [ ] **Step 4: Registrar alternativas y costos de los esquemas**

Añadir a `## Alternativas consideradas`:

```markdown
- **Valores numéricos opcionales o predeterminados:** dejarían la actividad incompleta o inventarían datos para calcular indicadores.
- **Fecha como instante o época:** aportaría hora y zona que la foto vigente no necesita y podría desplazar el día de corte.
```

Añadir a `## Consecuencias`:

```markdown
- Crear o reemplazar exige todos los datos capturados; una ausencia o `null` se informa como `required` según ADR-009.
- `cutoffDate` conserva el día, pero no expresa hora ni zona.
- La colección usa una representación de proyecto menor que la lectura individual.
```

- [ ] **Step 5: Actualizar la verificación de contrato**

Sustituir `## Verificación` por:

```markdown
## Verificación

Pruebas de contrato validan contra `contracts/evm/evm-fixture.json` nombres, bloques, rango 0–100, tipos JSON y esquemas distintos. Comprueban `{id, name}` en la colección, `name` y `cutoffDate` obligatorios en proyecto, los cinco campos obligatorios en actividad y `cutoffDate` como `YYYY-MM-DD`. El fixture conserva para CPI y SPI el valor completo, `display`, `status` y `label`; los casos cubren actividad, consolidado, marcadores y no evaluabilidad. Ningún monto lleva marcador.
```

- [ ] **Step 6: Verificar ADR-006b y crear su commit lógico**

Run:

```bash
set -e
git diff --check -- docs/adr/006b-forma-respuesta-contrato-datos.md
rg -qF 'La escritura de proyecto contiene exactamente `name` y `cutoffDate`' docs/adr/006b-forma-respuesta-contrato-datos.md
rg -qF 'Los cinco campos son obligatorios en toda creación y reemplazo.' docs/adr/006b-forma-respuesta-contrato-datos.md
rg -qF '`cutoffDate` cruza el cable como cadena `format: date`' docs/adr/006b-forma-respuesta-contrato-datos.md
rg -qF 'un `full-date` de RFC 3339 con forma `YYYY-MM-DD`' docs/adr/006b-forma-respuesta-contrato-datos.md
rg -qF 'una ausencia o `null` se informa como `required`' docs/adr/006b-forma-respuesta-contrato-datos.md
test "$(wc -w < docs/adr/006b-forma-respuesta-contrato-datos.md)" -le 780
git add -- docs/adr/006b-forma-respuesta-contrato-datos.md
git diff --cached --check
git diff --cached --name-only
git commit -m "docs(adr): complete API write schemas"
```

Expected: todos los chequeos terminan con código cero; el conteo no supera 780
palabras; el staged contiene solo ADR-006b y se crea un commit lógico.

### Task 3: Separar validaciones y cerrar entradas ambiguas en ADR-009

**Files:**

- Modify: `docs/adr/009-contrato-errores-api.md:7-69`
- Modify: `docs/adr/009-contrato-errores-api.md:71-91`
- Reference: `docs/PRD.md:69-70`
- Reference: `docs/PRD.md:115-117`
- Reference: `docs/adr/006b-forma-respuesta-contrato-datos.md`
- Reference: `docs/superpowers/specs/2026-07-28-adr-openapi-contract-gaps-design.md`

- [ ] **Step 1: Confirmar los tres huecos de validación**

Run:

```bash
set -e
rg -nF 'Un `null` explícito en un campo obligatorio' docs/adr/009-contrato-errores-api.md
rg -nF 'Todo campo de solo lectura presente en una escritura se rechaza' docs/adr/009-contrato-errores-api.md
! rg -qF 'propiedad desconocida' docs/adr/009-contrato-errores-api.md
! rg -qF 'solo por espacios' docs/adr/009-contrato-errores-api.md
! rg -qF 'menos restrictivo' docs/adr/009-contrato-errores-api.md
```

Expected: aparecen las decisiones previas sobre `null` y solo lectura, pero no
la frontera de validación, propiedades desconocidas ni normalización.

- [ ] **Step 2: Declarar la frontera de validación**

Después del párrafo que clasifica tipos incompatibles como `400`, añadir:

```markdown
La capa estructural comprueba sintaxis JSON y, en valores no nulos, tipos y formatos. Negocio comprueba obligatoriedad, restricciones numéricas, campos de lectura, propiedades desconocidas y nombres normalizados; sus infracciones producen `422`.
```

Después del párrafo sobre `null` explícito, añadir:

```markdown
Por ello, los esquemas de petición admiten `null` en campos obligatorios y no cierran las propiedades antes de negocio. Esta permisividad distingue `required`, `read_only` y `unknown` sin validarlas para el dominio.
```

- [ ] **Step 3: Decidir propiedades desconocidas y nombres con espacios**

Después de «Ningún campo de solo lectura se ignora», añadir:

```markdown
Una propiedad ajena a los esquemas de escritura y lectura se rechaza con `422`, conserva su nombre en `field` y produce `rule: "unknown"`. No se ignora.

Se recortan los espacios laterales de `name` antes de validar y persistir. Un nombre compuesto solo por espacios queda vacío e incumple `required`; los interiores se conservan.
```

Sustituir la decisión sobre `field` por:

```markdown
`field` usa el nombre `lowerCamelCase` exacto de ADR-006b para campos conocidos; una propiedad desconocida conserva el nombre recibido.
```

Sustituir el catálogo inicial por:

```markdown
Las reglas iniciales son `required`, `positive`, `non_negative`, `range_0_100`, `read_only` y `unknown`.
```

- [ ] **Step 4: Registrar alternativas y todos los costos**

Añadir a `## Alternativas consideradas`:

```markdown
- **Esquema estricto como barrera automática:** describiría entradas válidas, pero adelantaría `400` a los `422` de negocio.
- **Ignorar propiedades desconocidas o preservar espacios laterales:** toleraría imprecisiones, pero ocultaría errores y nombres sin contenido.
```

Añadir a `## Consecuencias`:

```markdown
- El esquema publicado es menos restrictivo que las reglas reales. Un cliente generado no debe equiparar nulabilidad o propiedades adicionales con validez de negocio.
- Un validador automático debe reservar `400` para sintaxis, tipo y formato, y dejar pasar o mapear las demás infracciones a la envolvente `422` de este ADR.
- Añadir `unknown` al conjunto cerrado de `rule` no es compatible hacia atrás.
- Recortar espacios laterales puede persistir un nombre distinto del recibido.
```

- [ ] **Step 5: Actualizar la evidencia prescrita**

Sustituir `## Verificación` por:

```markdown
## Verificación

Pruebas de contrato contrastan `contracts/evm/evm-fixture.json`: cada `validationChecks` devuelve `422`, `field`, `rule`, mensaje humano y estado intacto. Casos nuevos cubren ausencia y `null` de cada campo obligatorio, una propiedad desconocida con `unknown`, campos de lectura con `read_only` y nombres con espacios laterales o solo espacios. Un caso compuesto acumula infracciones. Una prueba con `{"bac":"diez"}` devuelve `400`, `malformed_request`, `violations: []` y conserva el estado. Otros casos cubren `404` y excluyen detalles internos.
```

- [ ] **Step 6: Verificar ADR-009 y crear su commit lógico**

Run:

```bash
set -e
git diff --check -- docs/adr/009-contrato-errores-api.md
rg -qF 'La capa estructural comprueba sintaxis JSON' docs/adr/009-contrato-errores-api.md
rg -qF 'los esquemas de petición admiten `null` en campos obligatorios y no cierran las propiedades' docs/adr/009-contrato-errores-api.md
rg -qF 'produce `rule: "unknown"`' docs/adr/009-contrato-errores-api.md
rg -qF 'Un nombre compuesto solo por espacios queda vacío e incumple `required`' docs/adr/009-contrato-errores-api.md
rg -qF 'El esquema publicado es menos restrictivo que las reglas reales.' docs/adr/009-contrato-errores-api.md
rg -qF 'Añadir `unknown` al conjunto cerrado de `rule` no es compatible hacia atrás.' docs/adr/009-contrato-errores-api.md
test "$(wc -w < docs/adr/009-contrato-errores-api.md)" -le 850
git add -- docs/adr/009-contrato-errores-api.md
git diff --cached --check
git diff --cached --name-only
git commit -m "docs(adr): define request validation boundary"
```

Expected: todos los chequeos terminan con código cero; el conteo no supera 850
palabras; el staged contiene solo ADR-009 y se crea un commit lógico.

### Task 4: Auditar alcance, dependientes y entrega

**Files:**

- Verify: `docs/adr/006a-diseno-recursos-rest.md`
- Verify: `docs/adr/006b-forma-respuesta-contrato-datos.md`
- Verify: `docs/adr/009-contrato-errores-api.md`
- Verify unchanged: `docs/PRD.md`
- Verify unchanged: `AGENTS.md`
- Verify unchanged: `openspec/specs/evm-api-contract/spec.md`
- Verify unchanged: `contracts/evm/openapi.yaml`
- Verify unchanged: `contracts/evm/evm-fixture.json`

- [ ] **Step 1: Ejecutar la auditoría requisito por requisito**

Run:

```bash
set -e
git diff --check 4e95a20...HEAD
test "$(git diff --name-only 4e95a20...HEAD | sort)" = "$(printf '%s\n' \
  docs/adr/006a-diseno-recursos-rest.md \
  docs/adr/006b-forma-respuesta-contrato-datos.md \
  docs/adr/009-contrato-errores-api.md \
  docs/superpowers/plans/2026-07-28-adr-openapi-contract-gaps.md \
  docs/superpowers/specs/2026-07-28-adr-openapi-contract-gaps-design.md | sort)"
git diff --exit-code 4e95a20 -- docs/PRD.md AGENTS.md \
  openspec/specs/evm-api-contract/spec.md \
  contracts/evm/openapi.yaml contracts/evm/evm-fixture.json
test "$(wc -w < docs/adr/006a-diseno-recursos-rest.md)" -le 600
test "$(wc -w < docs/adr/006b-forma-respuesta-contrato-datos.md)" -le 780
test "$(wc -w < docs/adr/009-contrato-errores-api.md)" -le 850
```

Expected: no hay errores de whitespace; el diff de esta continuación contiene
solo diseño, plan y los tres ADR; PRD, guía, OpenSpec, OpenAPI y fixture son
idénticos al baseline `4e95a20`; los aumentos de límite quedan acotados.

- [ ] **Step 2: Comprobar las nueve salidas exigidas**

Run:

```bash
set -e
rg -qF 'PUT /projects/{projectId}' docs/adr/006a-diseno-recursos-rest.md
rg -qF 'arreglo JSON desnudo' docs/adr/006a-diseno-recursos-rest.md
rg -qF 'La escritura de proyecto contiene exactamente' docs/adr/006b-forma-respuesta-contrato-datos.md
rg -qF 'Los cinco campos son obligatorios' docs/adr/006b-forma-respuesta-contrato-datos.md
rg -qF '`format: date`' docs/adr/006b-forma-respuesta-contrato-datos.md
rg -qF 'La capa estructural comprueba' docs/adr/009-contrato-errores-api.md
rg -qF 'rule: "unknown"' docs/adr/009-contrato-errores-api.md
rg -qF 'solo por espacios' docs/adr/009-contrato-errores-api.md
rg -qF '`info.version` será `1.0.0`' docs/superpowers/specs/2026-07-28-adr-openapi-contract-gaps-design.md
```

Expected: las ocho correcciones ADR y la convención de versión están
documentadas en sus fuentes autorizadas.

- [ ] **Step 3: Inspeccionar commits, rama y estado**

Run:

```bash
set -e
git log --oneline --decorate 4e95a20..HEAD
git status --short --branch
git diff --stat 4e95a20...HEAD
```

Expected: existen commits lógicos separados para diseño, plan y cada ADR; el
worktree está limpio y la rama sigue basada en el trabajo OpenAPI existente.

- [ ] **Step 4: Preparar la lista de cambios futuros**

La entrega final debe enumerar, sin editar los artefactos:

```text
OpenAPI:
- añadir ambos PUT con `200` y la representación de lectura de ADR-007, además
  de `400`, `404` y `422`;
- añadir `GET /projects` con `200`, arreglo de `{id, name}` y `[]` cuando no
  existan proyectos;
- declarar `ProjectWrite` con `name` y `cutoffDate`, y completar `required` de
  `ActivityWrite` con sus cinco campos;
- tipar `cutoffDate` como unión `string`/`null` con `format: date`;
- admitir `null` estructural en todos los campos obligatorios, conservar los
  límites numéricos y no cerrar `additionalProperties` antes de negocio;
- ampliar `rule` con `unknown` y documentar el reparto exacto `400`/`422`;
- reemplazar decision-pending por info.version 1.0.0 y retirar x-decisions-missing.

Fixture:
- elevar `version` a `5.0.0` y explicar el cambio incompatible de `rule`;
- declarar las formas y campos obligatorios de escritura de proyecto y
  actividad;
- añadir casos exitosos de ambos PUT y de GET /projects, incluido `[]`;
- añadir ausencia y `null` para cada campo obligatorio;
- añadir propiedad desconocida con `unknown`, nombre recortado y nombre solo
  por espacios;
- ampliar el caso compuesto y conservar evidencia de `read_only`, acumulación,
  estado intacto y `400` por tipo o formato incompatible.

OpenSpec queda fuera de este cambio ADR dedicado. La auditoría debe informar que
`openspec/specs/evm-api-contract/spec.md` requerirá alineación cuando se abra el
cambio que regenere OpenAPI, porque todavía enumera cinco reglas y exige
`x-decisions-missing`.
```

Expected: la lista refleja todas las consecuencias decididas y no atribuye al
fixture decisiones arquitectónicas.
