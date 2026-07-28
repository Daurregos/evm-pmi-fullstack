# Testing Agent Guidelines Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Incorporar la estrategia de pruebas aprobada en `docs/TESTING.md` y acoplarla a `AGENTS.md` sin debilitar las reglas vigentes ni modificar fuentes superiores.

**Architecture:** `docs/TESTING.md` será la fuente temática sobre niveles, alcance y oráculos de prueba; `AGENTS.md` conservará el flujo operativo del repositorio y enlazará esa estrategia junto con las demás fuentes canónicas. La integración será quirúrgica: una sola formulación por regla, precedencia por asunto y detención explícita ante contradicciones.

**Tech Stack:** Markdown, Git, OpenSpec como fuente documental existente —sin crear un cambio activo— y comandos de verificación del repositorio.

---

## File map

- Create: `docs/TESTING.md`
  - Estrategia canónica de pruebas validada contra PRD, ADR, fixture y OpenAPI.
- Modify: `AGENTS.md`
  - Reglas operativas para consultar fuentes, proteger artefactos cerrados, usar
    el oráculo y verificar cada tarea.
- Existing: `docs/superpowers/specs/2026-07-28-testing-agent-guidelines-design.md`
  - Diseño aprobado; no se modifica durante la implementación.
- Existing: `docs/superpowers/plans/2026-07-28-testing-agent-guidelines.md`
  - Este plan; no se modifica durante la implementación salvo que el alcance
    aprobado cambie primero.

No se modifican `docs/PRD.md`, `docs/ASSUMPTIONS.md`, `docs/adr/`,
`contracts/evm/evm-fixture.json`, `contracts/evm/FIXTURE.md`,
`contracts/evm/openapi.yaml` ni `openspec/`.

### Task 1: Incorporar y precisar la estrategia de pruebas

**Files:**
- Create: `docs/TESTING.md`
- Reference: `/home/unix_trycore/repositories/trycore/evm-pmi-fullstack/docs/TESTING.md`
- Reference: `docs/superpowers/specs/2026-07-28-testing-agent-guidelines-design.md`

- [ ] **Step 1: Confirmar el aislamiento y la fuente autorizada**

Run:

```bash
git status --short --branch
test -f /home/unix_trycore/repositories/trycore/evm-pmi-fullstack/docs/TESTING.md
test ! -e docs/TESTING.md
sha256sum /home/unix_trycore/repositories/trycore/evm-pmi-fullstack/docs/TESTING.md
```

Expected:

- la rama es `docs/testing-agent-guidelines`;
- el worktree no tiene cambios de implementación;
- el `docs/TESTING.md` original existe fuera del worktree; y
- `docs/TESTING.md` todavía no existe en el worktree; y
- el hash de la fuente autorizada es
  `59673201e719f4def23c62c33d00d0f98220149bd4c63d3bfe78d0df2dea70a0`.

- [ ] **Step 2: Incorporar con `apply_patch` el contenido aprobado del usuario**

Leer completo
`/home/unix_trycore/repositories/trycore/evm-pmi-fullstack/docs/TESTING.md` y usar
`apply_patch` para crear `docs/TESTING.md` con ese contenido. No copiar
`docs/ARCHITECTURE.md`, `docs/OPERATIONS.md`, `docs/PROCESS.md`,
`FIXTURE-VALIDATION-REPORT.md`, `.claude/`, `.codex/` ni
`openspec/config.yaml`.

Expected: el archivo nuevo coincide con la fuente del usuario antes de aplicar
los ajustes aprobados del paso siguiente.

- [ ] **Step 3: Aplicar los ajustes de autoridad y estabilidad**

Usar `apply_patch` para hacer exactamente estas sustituciones:

```diff
-Las secciones `Verificación` de los diez ADR son la fuente. Este documento las organiza; no añade obligaciones nuevas.
+Las secciones `Verificación` de los ADR aceptados son la base. Este documento las organiza y define la estrategia de pruebas sin introducir decisiones de producto ni arquitectura.
```

```diff
-| Contrato | Superficie HTTP: rutas, esquemas, códigos, errores | Aplicación completa | Fixture + OpenAPI |
+| Contrato | Superficie HTTP: rutas, esquemas, códigos, errores | Aplicación completa | Fixture + `contracts/evm/openapi.yaml` |
```

```diff
-Verifica la superficie HTTP contra el OpenAPI y el fixture.
+Verifica la superficie HTTP contra `contracts/evm/openapi.yaml` y el fixture.
```

```diff
-- **ADR-002:** modificar cada uno de los cinco datos capturados produce los cambios derivados correspondientes; editar el nombre conserva los indicadores; ninguna operación escribe resultados calculados.
+- **ADR-002:** modificar BAC, avance planificado, avance real o AC produce los cambios derivados correspondientes; editar el nombre conserva los indicadores; ninguna operación escribe resultados calculados.
```

```diff
-La cobertura de línea es un indicador, no un objetivo. El criterio real es **que cada afirmación de las secciones `Verificación` de los diez ADR tenga una prueba que la respalde**, y esa correspondencia se revisa antes de dar por terminado cada nivel.
+La cobertura de línea es un indicador, no un objetivo. El criterio real es **que cada afirmación de las secciones `Verificación` de los ADR aplicables tenga una prueba que la respalde**, y esa correspondencia se revisa antes de dar por terminado cada nivel.
```

```diff
-Este documento define **qué se prueba, en qué nivel y contra qué oráculo**. Se escribió antes de la implementación porque gobierna el ciclo TDD: cada requisito entra por el nivel que le corresponde, y ningún nivel repite lo que otro ya cubre.
+Este documento define **qué se prueba, en qué nivel y contra qué oráculo**. Se escribió antes de la implementación porque gobierna el ciclo TDD: cada requisito entra por el nivel que le corresponde, y un comportamiento solo se repite cuando otro nivel aporta evidencia distinta sobre su propia frontera.
```

```diff
-**2. El fixture no se modifica para que un test pase.** Ante una discrepancia, el defecto está en el código salvo decisión explícita en contra. Cambiar el fixture es una decisión de contrato, del mismo rango que un ADR, y no una corrección dentro de un ciclo.
+**2. El fixture no se modifica para que un test pase.** Ante una discrepancia, el defecto está en el código salvo que la fuente superior aplicable apruebe un cambio. Modificar el fixture exige un cambio contractual dedicado y la auditoría de sus dependientes; nunca es una corrección dentro de un ciclo rojo-verde.
```

```diff
-- **ADR-007:** tras crear, editar o eliminar, la lectura posterior coincide con el fixture; cambiar `cutoffDate` no altera ningún indicador.
+- **ADR-007:** tras crear, editar o eliminar una actividad, la lectura posterior coincide con el resultado esperado del caso correspondiente del fixture; cambiar `cutoffDate` no altera ningún indicador.
```

```diff
-- La digitación no dispara peticiones; una mutación rechazada tampoco; una exitosa sí (ADR-007, RF-03).
+- La digitación no envía mutaciones; una mutación rechazada no dispara el `GET /projects/{projectId}` de refresco y una exitosa sí lo dispara (ADR-007, RF-03).
```

Expected: se conservan los cinco niveles, las reglas del oráculo, los casos
cubiertos, el orden de construcción y el criterio de cobertura.

- [ ] **Step 4: Verificar el archivo nuevo y los ajustes aprobados**

Run:

```bash
git add -N -- docs/TESTING.md
git diff --check
rg -n 'ADR aceptados|contracts/evm/openapi.yaml|ADR aplicables' docs/TESTING.md
rg -n 'modificar BAC, avance planificado, avance real o AC' docs/TESTING.md
rg -n 'un comportamiento solo se repite cuando otro nivel aporta evidencia distinta sobre su propia frontera' docs/TESTING.md
rg -n 'Modificar el fixture exige un cambio contractual dedicado y la auditoría de sus dependientes' docs/TESTING.md
rg -n 'crear, editar o eliminar una actividad.*resultado esperado del caso correspondiente del fixture' docs/TESTING.md
rg -n -F 'una mutación rechazada no dispara el `GET /projects/{projectId}` de refresco' docs/TESTING.md
```

Expected:

- `git diff --check` no imprime errores;
- aparecen la autoridad de los ADR aceptados y la ruta canónica del OpenAPI;
- aparece la formulación inequívoca de ADR-002;
- la cobertura referencia los ADR aplicables;
- se permite evidencia intencional entre niveles con fronteras distintas;
- el fixture exige un cambio contractual dedicado y auditoría de dependientes;
- ADR-007 se limita a actividades y al resultado esperado del caso del fixture; y
- una escritura rechazada no desencadena el `GET` de refresco.

Run:

```bash
if rg -n -F '`openapi.yaml`' docs/TESTING.md; then exit 1; else echo 'ruta obsoleta ausente'; fi
if rg -n -F 'los diez ADR' docs/TESTING.md; then exit 1; else echo 'conteo fijo ausente'; fi
if rg -n -F 'del mismo rango que un ADR' docs/TESTING.md; then exit 1; else echo 'equivalencia de autoridad ausente'; fi
if rg -n -F 'ningún nivel repite lo que otro ya cubre' docs/TESTING.md; then exit 1; else echo 'prohibición absoluta ausente'; fi
if rg -n -F 'una mutación rechazada tampoco' docs/TESTING.md; then exit 1; else echo 'ambigüedad de mutación rechazada ausente'; fi
if rg -n -F 'tras crear, editar o eliminar, la lectura posterior coincide con el fixture' docs/TESTING.md; then exit 1; else echo 'ADR-007 no acotado ausente'; fi
```

Expected:

```text
ruta obsoleta ausente
conteo fijo ausente
equivalencia de autoridad ausente
prohibición absoluta ausente
ambigüedad de mutación rechazada ausente
ADR-007 no acotado ausente
```

- [ ] **Step 5: Revisar que el diff de TESTING sea mínimo**

Run:

```bash
git diff -- docs/TESTING.md
git diff --stat
node - <<'NODE'
const fs = require('node:fs');

const source = fs.readFileSync('/home/unix_trycore/repositories/trycore/evm-pmi-fullstack/docs/TESTING.md', 'utf8');
const target = fs.readFileSync('docs/TESTING.md', 'utf8');
const substitutions = [
  ['Las secciones `Verificación` de los diez ADR son la fuente. Este documento las organiza; no añade obligaciones nuevas.', 'Las secciones `Verificación` de los ADR aceptados son la base. Este documento las organiza y define la estrategia de pruebas sin introducir decisiones de producto ni arquitectura.'],
  ['| Contrato | Superficie HTTP: rutas, esquemas, códigos, errores | Aplicación completa | Fixture + OpenAPI |', '| Contrato | Superficie HTTP: rutas, esquemas, códigos, errores | Aplicación completa | Fixture + `contracts/evm/openapi.yaml` |'],
  ['Verifica la superficie HTTP contra el OpenAPI y el fixture.', 'Verifica la superficie HTTP contra `contracts/evm/openapi.yaml` y el fixture.'],
  ['- **ADR-002:** modificar cada uno de los cinco datos capturados produce los cambios derivados correspondientes; editar el nombre conserva los indicadores; ninguna operación escribe resultados calculados.', '- **ADR-002:** modificar BAC, avance planificado, avance real o AC produce los cambios derivados correspondientes; editar el nombre conserva los indicadores; ninguna operación escribe resultados calculados.'],
  ['La cobertura de línea es un indicador, no un objetivo. El criterio real es **que cada afirmación de las secciones `Verificación` de los diez ADR tenga una prueba que la respalde**, y esa correspondencia se revisa antes de dar por terminado cada nivel.', 'La cobertura de línea es un indicador, no un objetivo. El criterio real es **que cada afirmación de las secciones `Verificación` de los ADR aplicables tenga una prueba que la respalde**, y esa correspondencia se revisa antes de dar por terminado cada nivel.'],
  ['Este documento define **qué se prueba, en qué nivel y contra qué oráculo**. Se escribió antes de la implementación porque gobierna el ciclo TDD: cada requisito entra por el nivel que le corresponde, y ningún nivel repite lo que otro ya cubre.', 'Este documento define **qué se prueba, en qué nivel y contra qué oráculo**. Se escribió antes de la implementación porque gobierna el ciclo TDD: cada requisito entra por el nivel que le corresponde, y un comportamiento solo se repite cuando otro nivel aporta evidencia distinta sobre su propia frontera.'],
  ['**2. El fixture no se modifica para que un test pase.** Ante una discrepancia, el defecto está en el código salvo decisión explícita en contra. Cambiar el fixture es una decisión de contrato, del mismo rango que un ADR, y no una corrección dentro de un ciclo.', '**2. El fixture no se modifica para que un test pase.** Ante una discrepancia, el defecto está en el código salvo que la fuente superior aplicable apruebe un cambio. Modificar el fixture exige un cambio contractual dedicado y la auditoría de sus dependientes; nunca es una corrección dentro de un ciclo rojo-verde.'],
  ['- **ADR-007:** tras crear, editar o eliminar, la lectura posterior coincide con el fixture; cambiar `cutoffDate` no altera ningún indicador.', '- **ADR-007:** tras crear, editar o eliminar una actividad, la lectura posterior coincide con el resultado esperado del caso correspondiente del fixture; cambiar `cutoffDate` no altera ningún indicador.'],
  ['- La digitación no dispara peticiones; una mutación rechazada tampoco; una exitosa sí (ADR-007, RF-03).', '- La digitación no envía mutaciones; una mutación rechazada no dispara el `GET /projects/{projectId}` de refresco y una exitosa sí lo dispara (ADR-007, RF-03).'],
];

let transformed = source;
for (const [oldText, newText] of substitutions) {
  const occurrences = transformed.split(oldText).length - 1;
  if (occurrences !== 1) {
    throw new Error(`La frase original debe aparecer exactamente una vez: ${oldText}`);
  }
  transformed = transformed.replace(oldText, newText);
}
if (transformed !== target) {
  throw new Error('La fuente transformada no coincide byte a byte con docs/TESTING.md');
}
console.log('comparación de nueve sustituciones: OK');
NODE
```

Expected: `git diff -- docs/TESTING.md` queda para revisión humana del archivo
nuevo; la comparación Node prueba que, respecto de la fuente autorizada, las
únicas diferencias de contenido son las nueve sustituciones del Step 3.

- [ ] **Step 6: Crear el commit lógico de la estrategia**

Run:

```bash
git add -- docs/TESTING.md
git diff --cached --check
git diff --cached --name-status
git commit -m "docs: add canonical testing strategy"
```

Expected:

- el área preparada contiene solo `A docs/TESTING.md`;
- la verificación no informa errores; y
- se crea el commit `docs: add canonical testing strategy`.

### Task 2: Integrar la estrategia en las reglas de los agentes

**Files:**
- Modify: `AGENTS.md`
- Reference: `docs/TESTING.md`
- Reference: `docs/superpowers/specs/2026-07-28-testing-agent-guidelines-design.md`

- [ ] **Step 1: Sustituir la lista incompleta por autoridad temática**

Usar `apply_patch` para reemplazar la lista numerada que empieza en «Antes de
cambiar el producto» y termina en «Código, pruebas y evidencia» por este
contenido:

```markdown
Antes de cambiar el producto, identifica las fuentes aplicables y respeta la
autoridad de cada una sobre el asunto en disputa:

| Fuente | Autoridad sobre |
|---|---|
| `docs/PRD.md` | Qué se construye, reglas de negocio y criterios de aceptación |
| `docs/ASSUMPTIONS.md` | Supuestos adoptados y su trazabilidad, subordinados al PRD |
| `docs/adr/` | Decisiones arquitectónicas y técnicas |
| OpenSpec del cambio activo | Propuesta, especificaciones, SDD y tareas del cambio |
| `contracts/evm/evm-fixture.json` | Oráculo de los valores numéricos y de la forma de los ejemplos contractuales |
| `contracts/evm/FIXTURE.md` | Guía de lectura del fixture |
| `contracts/evm/openapi.yaml` | Contrato HTTP publicado |
| `docs/TESTING.md` | Qué se prueba, en qué nivel y contra qué |
| Código, pruebas y evidencia | Materialización y verificación del comportamiento aprobado |

La precedencia es temática, no una jerarquía lineal absoluta. Ante un conflicto,
gana la fuente con autoridad sobre el asunto en disputa. Si dos fuentes se
contradicen sobre el mismo asunto, detente y repórtalo en lugar de elegir una.
```

Conservar inmediatamente después el párrafo vigente que empieza por «No
resuelvas silenciosamente contradicciones en el código», incluida la auditoría
de dependientes tras modificar una fuente superior.

Expected: PRD, ASSUMPTIONS, ADR, OpenSpec, fixture, guía, OpenAPI, TESTING y
código/evidencia tienen un ámbito explícito sin convertir la tabla en un orden
global.

- [ ] **Step 2: Añadir el límite de artefactos cerrados**

Insertar después de la sección inicial y antes de `## Required change workflow`:

```markdown
## Closed artifacts during implementation

En una tarea de implementación, trata el PRD, los ADR, el fixture y el OpenAPI
como decisiones cerradas. No los modifiques para reconciliar el código ni para
hacer pasar una prueba. Si alguno parece incorrecto, detén la implementación y
repórtalo; su corrección exige el flujo documental o contractual dedicado y la
auditoría posterior de sus dependientes.
```

Expected: la regla queda limitada a tareas de implementación y no impide los
cambios dedicados sobre fuentes superiores.

- [ ] **Step 3: Añadir las reglas independientes del oráculo**

Insertar después de `## Closed artifacts during implementation`:

```markdown
## Oracle rules

Estas reglas no dependen de haber leído `docs/TESTING.md`:

1. La prueba carga `contracts/evm/evm-fixture.json`; nunca recalcula los valores
   esperados con la misma lógica que está probando.
2. El fixture no se modifica para hacer pasar una prueba dentro de un ciclo
   rojo-verde. Ante una discrepancia, el defecto está en el código salvo una
   decisión explícita tramitada fuera de ese ciclo.
```

Expected: las dos reglas son explícitas, autocontenidas y no duplican los casos
ni valores del fixture.

- [ ] **Step 4: Consolidar las invariantes EVM sin duplicarlas**

Dentro de `## EVM domain invariants`, reemplazar estas dos viñetas:

```markdown
- PV, EV, CV, SV, CPI, SPI, EAC y VAC son indicadores derivados. Nunca se capturan ni se editan.
- Consolida sumando BAC, PV, EV y AC por actividad; calcula variaciones, ratios y proyecciones después. Nunca promedies CPI ni SPI.
```

por:

```markdown
- PV, EV, CV, SV, CPI, SPI, EAC y VAC son indicadores derivados. Nunca se
  capturan, editan, persisten ni aceptan en escritura. Tampoco se calculan en
  el cliente.
- Consolida sumando BAC, PV, EV y AC por actividad; calcula variaciones, ratios
  y proyecciones después. Nunca promedies CPI ni SPI.
```

Añadir después de la regla vigente sobre divisiones por cero:

```markdown
- `cpi.value = 0` es un valor definido y desfavorable, distinto de un indicador
  no evaluable.
- El redondeo pertenece exclusivamente a la presentación; los cálculos y la
  clasificación usan valores sin redondear según el PRD.
```

Expected: se conservan las demás invariantes vigentes y cada regla aparece una
sola vez.

- [ ] **Step 5: Añadir las convenciones contractuales compatibles**

Insertar después del cierre de `## EVM domain invariants` y antes de
`## Safety and ownership`:

```markdown
## Contract conventions

- Los campos y `operationId` usan inglés `lowerCamelCase`.
- Los valores enumerados usan inglés y conservan exactamente la forma definida
  por los ADR y `contracts/evm/openapi.yaml`.
- Los textos contractuales dirigidos a personas —como `label`, `message`,
  resúmenes y descripciones— usan español.
```

Expected: no se impone `lowerCamelCase` a valores como `not_evaluable`,
`read_only` o `range_0_100`, ni español a toda la documentación interna.

- [ ] **Step 6: Integrar TESTING y los ADR en la lista de cierre**

En `## Verification and handoff`, añadir como primer punto de la lista «Antes
del cierre»:

```markdown
1. Contrasta el resultado con `docs/TESTING.md` y con la sección `Verificación`
   de cada ADR aplicable.
```

Renumerar los puntos siguientes para conservar una lista del 1 al 7 sin cambiar
su contenido.

Expected: este control se suma a la revisión de requisitos, verificaciones
frescas, alcance del commit, estado del PR, reporte de evidencia y ejecución
literal de comandos.

- [ ] **Step 7: Verificar estructura, referencias y ausencia de contradicciones**

Run:

```bash
rg -n '^## ' AGENTS.md
rg -n 'docs/ASSUMPTIONS.md|contracts/evm/evm-fixture.json|contracts/evm/FIXTURE.md|contracts/evm/openapi.yaml|docs/TESTING.md|OpenSpec' AGENTS.md
rg -n 'se calculan en|cpi.value = 0|redondeo pertenece exclusivamente|sección `Verificación`' AGENTS.md
```

Expected:

- se conservan todas las secciones operativas vigentes;
- cada fuente canónica aparece;
- aparecen las invariantes nuevas; y
- la lista de cierre referencia TESTING y la verificación de los ADR.

Run:

```bash
if rg -n -F '`openapi.yaml`' AGENTS.md docs/TESTING.md; then exit 1; else echo 'ruta obsoleta ausente'; fi
if rg -n -F 'los diez ADR' AGENTS.md docs/TESTING.md; then exit 1; else echo 'conteo fijo ausente'; fi
if rg -n 'enumerados.*lowerCamelCase' AGENTS.md docs/TESTING.md; then exit 1; else echo 'convención incompatible ausente'; fi
git diff --check
```

Expected:

```text
ruta obsoleta ausente
conteo fijo ausente
convención incompatible ausente
```

`git diff --check` no imprime errores.

- [ ] **Step 8: Revisar y commitear únicamente AGENTS.md**

Run:

```bash
git diff -- AGENTS.md
git diff --name-status
git add -- AGENTS.md
git diff --cached --check
git diff --cached --name-status
git commit -m "docs: integrate testing guidance for agents"
```

Expected:

- antes de preparar, el único cambio pendiente es `M AGENTS.md`;
- el área preparada contiene solo `M AGENTS.md`;
- el diff conserva los flujos existentes y añade únicamente el diseño
  aprobado; y
- se crea el commit `docs: integrate testing guidance for agents`.

### Task 3: Verificación documental y entrega

**Files:**
- Verify: `AGENTS.md`
- Verify: `docs/TESTING.md`
- Verify: `docs/superpowers/specs/2026-07-28-testing-agent-guidelines-design.md`
- Verify: `docs/superpowers/plans/2026-07-28-testing-agent-guidelines.md`

- [ ] **Step 1: Ejecutar las verificaciones documentales frescas**

Run:

```bash
git diff --check origin/develop...HEAD
git status --short --branch
```

Expected:

- `git diff --check` no imprime errores; y
- la rama está limpia y adelantada respecto de `origin/develop`.

- [ ] **Step 2: Auditar el alcance completo de la rama**

Run:

```bash
git diff --name-status origin/develop...HEAD
git log --oneline --decorate origin/develop..HEAD
```

Expected files:

```text
M	AGENTS.md
A	docs/TESTING.md
A	docs/superpowers/plans/2026-07-28-testing-agent-guidelines.md
A	docs/superpowers/specs/2026-07-28-testing-agent-guidelines-design.md
```

Expected commits: un commit de diseño, un commit de plan, un commit para
`docs/TESTING.md` y un commit para `AGENTS.md`. No aparece ningún archivo ajeno.

- [ ] **Step 3: Confirmar que las fuentes superiores permanecen intactas**

Run:

```bash
git diff --quiet origin/develop...HEAD -- docs/PRD.md docs/ASSUMPTIONS.md docs/adr contracts/evm/evm-fixture.json contracts/evm/FIXTURE.md contracts/evm/openapi.yaml openspec
```

Expected: exit code `0` y ninguna salida.

- [ ] **Step 4: Confirmar que el trabajo original del usuario se preservó**

Run:

```bash
git -C /home/unix_trycore/repositories/trycore/evm-pmi-fullstack status --short --branch
sha256sum /home/unix_trycore/repositories/trycore/evm-pmi-fullstack/docs/TESTING.md
```

Expected: el estado prueba que el directorio original sigue en `develop` y que
sus archivos no rastreados, incluido el `docs/TESTING.md` original, continúan
presentes; el hash
`59673201e719f4def23c62c33d00d0f98220149bd4c63d3bfe78d0df2dea70a0` prueba
que el contenido autorizado de `docs/TESTING.md` permaneció sin cambios. No se
alteró ni se incluyó ningún archivo ajeno en la rama.

- [ ] **Step 5: Preparar el handoff sin crear ni fusionar un PR**

Reportar:

- rama `docs/testing-agent-guidelines`;
- ruta del worktree;
- commits creados;
- verificaciones ejecutadas y su salida;
- ausencia de cambio OpenSpec;
- fuentes superiores preservadas;
- cambios locales del directorio original preservados; y
- que no existe PR todavía y, si se crea después, su destino será `develop`.
