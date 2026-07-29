# Regeneración del contrato EVM OpenAPI v1.0.0

> **Ejecución:** aplicar este plan tarea por tarea y mantener sincronizadas las
> casillas de `openspec/changes/regenerate-evm-openapi-v1/tasks.md`.

**Objetivo:** Regenerar `contracts/evm/openapi.yaml` como contrato OpenAPI 3.1
v1.0.0 a partir del PRD, los ADR vigentes y el fixture v5.0.0, sin modificar
ningún ADR ni introducir decisiones.

**Arquitectura:** El contrato sigue siendo un único YAML con rutas, esquemas,
respuestas y ejemplos reutilizables. OpenSpec contiene el alcance canónico del
cambio. Un verificador temporal compara estructuras deserializadas contra el
fixture y audita operaciones, requiredness, nulabilidad, propiedades
adicionales y ausencia condicional de `x-decisions-missing`.

**Tecnologías:** OpenAPI 3.1.0, YAML 1.2, JSON, Python 3 con PyYAML, OpenSpec CLI
y Redocly CLI.

Este es un cambio de contrato documental, no código de ejecución ni una
corrección de comportamiento. Según `AGENTS.md`, TDD no aplica; la disciplina
equivalente es escribir primero las aserciones del verificador temporal y
observar que fallen contra el YAML provisional antes de regenerarlo.

## Fuentes canónicas

- Producto: `docs/PRD.md`
- Recursos y métodos: `docs/adr/006a-diseno-recursos-rest.md`
- Formas de escritura y lectura: `docs/adr/006b-forma-respuesta-contrato-datos.md`
- Cuerpos tras escritura: `docs/adr/007-estrategia-recalculo-tras-edicion.md`
- Validación y errores: `docs/adr/009-contrato-errores-api.md`
- Cambio: `openspec/changes/regenerate-evm-openapi-v1/`
- Fixture: `contracts/evm/evm-fixture.json`
- Guía del fixture: `contracts/evm/FIXTURE.md`
- Entregable: `contracts/evm/openapi.yaml`

### Tarea 1: Congelar y validar las entradas

**Archivos:**

- Leer: `docs/PRD.md`
- Leer: `docs/adr/006a-diseno-recursos-rest.md`
- Leer: `docs/adr/006b-forma-respuesta-contrato-datos.md`
- Leer: `docs/adr/007-estrategia-recalculo-tras-edicion.md`
- Leer: `docs/adr/009-contrato-errores-api.md`
- Leer: `contracts/evm/evm-fixture.json`
- Leer: `contracts/evm/FIXTURE.md`

- [ ] **Paso 1: Validar JSON, versión y alcance**

Ejecutar:

```bash
python3 - <<'PY'
import json
from pathlib import Path

fixture = json.loads(Path("contracts/evm/evm-fixture.json").read_text())
assert fixture["version"] == "5.0.0"
assert fixture["validationChecks"]["$scopeNote"]
assert fixture["writeSchemas"]["project"]["fields"] == ["name", "cutoffDate"]
assert fixture["writeSchemas"]["activity"]["fields"] == [
    "name", "bac", "plannedProgress", "actualProgress", "ac"]
assert {case["$id"] for case in fixture["validationChecks"]["cases"]} >= {
    "V9", "V10", "V11", "V12", "V13"}
print("fixture v5.0.0: PASS")
PY
```

Resultado esperado: `fixture v5.0.0: PASS`.

- [ ] **Paso 2: Auditar autoconsistencia**

Comparar `successResponses`, `collectionResponse`, `writeSchemas`,
`validationChecks`, `$metadataConvention` y las afirmaciones de `FIXTURE.md`.
Corregir con `apply_patch` únicamente inconsistencias objetivas derivables de
los bloques existentes. No añadir casos combinatorios a `validationChecks`.

- [ ] **Paso 3: Confirmar ausencia de decisiones pendientes**

Ejecutar:

```bash
rg -n 'GET /projects|PUT|404|identificador|cutoffDate|required|unknown|espacios|SemVer' \
  docs/adr/006a-diseno-recursos-rest.md \
  docs/adr/006b-forma-respuesta-contrato-datos.md \
  docs/adr/007-estrategia-recalculo-tras-edicion.md \
  docs/adr/009-contrato-errores-api.md
```

Resultado esperado: cada elemento contractual solicitado tiene respaldo. Si
aparece una pregunta no respondida, detener la regeneración y restaurar
`x-decisions-missing` con la pregunta literal.

### Tarea 2: Escribir primero el verificador contractual

**Archivos:**

- Crear temporalmente: `/tmp/evm-openapi-v1-verify.py`
- Verificar: `contracts/evm/openapi.yaml`
- Verificar: `contracts/evm/evm-fixture.json`

- [ ] **Paso 1: Crear el verificador con `apply_patch`**

El script debe:

- cargar JSON y YAML;
- eliminar recursivamente claves con prefijo `$`;
- comparar `ReferenceProjectAnalysis`, `ProjectCollection`,
  `EmptyProjectCollection`, `MalformedRequest`, `NotFound` y cada ejemplo
  `422` referenciado con sus bloques literales del fixture;
- comprobar `openapi: 3.1.0`, `info.version: 1.0.0`, los `operationId` y sus
  códigos de respuesta;
- comprobar los `required`, tipos unión con `null`, formato `date`, límites
  numéricos, ausencia de `additionalProperties: false`, descripciones y
  `unknown`;
- comprobar que `x-decisions-missing` no existe;
- parametrizar cada campo de `writeSchemas` y verificar que el contrato lo
  requiere y admite estructuralmente `null`, sin ampliar
  `validationChecks`.

- [ ] **Paso 2: Demostrar el fallo del contrato provisional**

Ejecutar:

```bash
python3 /tmp/evm-openapi-v1-verify.py
```

Resultado esperado antes de editar el YAML: salida distinta de cero por
`info.version`, operaciones o ejemplos aún ausentes.

### Tarea 3: Regenerar `openapi.yaml`

**Archivos:**

- Modificar: `contracts/evm/openapi.yaml`
- Referenciar: `contracts/evm/evm-fixture.json`

- [ ] **Paso 1: Actualizar información, colección y versión**

Con `apply_patch`, establecer `info.version: 1.0.0`, documentar SemVer del
contrato y añadir `GET /projects` con respuesta `200` como arreglo desnudo de
`{id, name}`. Añadir ejemplos reutilizables para colección poblada y `[]`
copiados de `collectionResponse`.

- [ ] **Paso 2: Añadir ambos reemplazos completos**

Con `apply_patch`, añadir:

```text
PUT /projects/{projectId}
PUT /projects/{projectId}/activities/{activityId}
```

Cada operación tendrá request body de escritura, `200` con representación de
lectura y `400`, `404`, `422`. La descripción indicará que un identificador
inexistente responde `404` y no crea en esa URI porque el servidor asigna
identificadores.

- [ ] **Paso 3: Alinear esquemas y reglas**

Con `apply_patch`, requerir los campos enumerados por `writeSchemas`, admitir
`null` en cada uno, mantener abiertos ambos esquemas de escritura, declarar
`cutoffDate` como `string | null` con `format: date`, añadir `unknown` y
documentar recorte de espacios y la advertencia de ADR-009.

- [ ] **Paso 4: Sustituir ejemplos y retirar el marcador provisional**

Copiar literalmente desde el fixture la lectura limpia, colección, errores y
casos `422`, incluido V9. Eliminar `x-decisions-missing` solo después de la
auditoría de la Tarea 1.

### Tarea 4: Verificar y archivar

**Archivos:**

- Verificar: `contracts/evm/openapi.yaml`
- Verificar: `contracts/evm/evm-fixture.json`
- Verificar: `contracts/evm/FIXTURE.md`
- Modificar: `openspec/changes/regenerate-evm-openapi-v1/tasks.md`
- Archivar: `openspec/changes/regenerate-evm-openapi-v1/`

- [ ] **Paso 1: Ejecutar el verificador contractual**

Ejecutar:

```bash
python3 /tmp/evm-openapi-v1-verify.py
```

Resultado esperado: todas las aserciones terminan en `PASS`.

- [ ] **Paso 2: Validar OpenAPI y referencias**

Ejecutar literalmente:

```bash
npx --yes @redocly/cli@latest lint --extends=spec contracts/evm/openapi.yaml
npx --yes @redocly/cli@latest bundle --dereferenced \
  --output /tmp/evm-openapi-v1-dereferenced.yaml \
  contracts/evm/openapi.yaml
```

Resultado esperado: ambos comandos terminan con código cero y todas las
referencias se resuelven.

- [ ] **Paso 3: Validar OpenSpec, whitespace y propiedad del diff**

Ejecutar literalmente:

```bash
openspec validate regenerate-evm-openapi-v1 --strict
git add -N -- contracts/evm/openapi.yaml
git diff --check
git diff --exit-code HEAD -- docs/adr
git status --short --branch
git diff --stat
```

Resultado esperado: OpenSpec válido, sin errores de whitespace, ningún cambio
en ADR y un diff limitado al contrato, fixture/guía, plan y artefactos OpenSpec
del cambio.

- [ ] **Paso 4: Completar tareas y archivar**

Marcar todas las tareas OpenSpec como completadas con `apply_patch`, repetir
las verificaciones frescas y ejecutar:

```bash
openspec archive regenerate-evm-openapi-v1 --yes
openspec validate --all --strict
git diff --check
```

Resultado esperado: el cambio queda archivado, la especificación histórica se
actualiza y todas las validaciones terminan con código cero.
