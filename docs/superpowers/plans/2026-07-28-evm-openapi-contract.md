# EVM OpenAPI Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear un contrato OpenAPI 3.1.0 válido que transcriba el API EVM
decidido, use ejemplos literales del fixture y exponga toda decisión faltante.

**Architecture:** Un único YAML bajo `contracts/evm/` contiene rutas,
componentes y ejemplos reutilizables. Los artefactos canónicos del cambio están
en `openspec/changes/add-evm-openapi-contract/`; cualquier hueco detectado se
registra como extensión final y bloquea la operación afectada en vez de
rellenarse.

**Tech Stack:** OpenAPI 3.1.0, YAML 1.2, Python 3.12 con PyYAML para auditorías,
OpenSpec CLI 1.3.1 y Redocly CLI para validación OpenAPI y referencias.

---

### Task 1: Construir el contrato y sus componentes

**Files:**

- Create: `contracts/evm/openapi.yaml`
- Reference: `docs/PRD.md`
- Reference: `docs/adr/003-representacion-dinero-porcentajes-redondeo.md`
- Reference: `docs/adr/004-contrato-api-indicadores-no-evaluables.md`
- Reference: `docs/adr/006a-diseno-recursos-rest.md`
- Reference: `docs/adr/006b-forma-respuesta-contrato-datos.md`
- Reference: `docs/adr/007-estrategia-recalculo-tras-edicion.md`
- Reference: `docs/adr/009-contrato-errores-api.md`
- Reference: `openspec/changes/add-evm-openapi-contract/specs/evm-api-contract/spec.md`

- [ ] **Step 1: Extraer los ejemplos fuente sin metadatos**

Run:

```bash
python3 - <<'PY'
import json
from pathlib import Path
import yaml

fixture = json.loads(Path("contracts/evm/evm-fixture.json").read_text())

def clean(value):
    if isinstance(value, dict):
        return {key: clean(item) for key, item in value.items()
                if not key.startswith("$")}
    if isinstance(value, list):
        return [clean(item) for item in value]
    return value

v9 = next(case for case in fixture["validationChecks"]["cases"]
          if case["$id"] == "V9")
parts = {
    "ReferenceProjectAnalysis": clean(fixture["readResponse"]),
    "ReferenceProject": clean(fixture["readResponse"]["project"]),
    "ReferenceActivity": clean(fixture["readResponse"]["activities"][0]),
    "MalformedRequest": fixture["errorEnvelopes"]["malformedRequest"]["expectedBody"],
    "NotFound": fixture["errorEnvelopes"]["notFound"]["expectedBody"],
    "ValidationFailed": fixture["errorEnvelopes"]["validationFailed"]["expectedBody"],
    "ProjectNameRequired": fixture["validationChecks"]["cases"][0]["expectedBody"],
    "ProjectCutoffDateRequired": fixture["validationChecks"]["cases"][1]["expectedBody"],
    "ActivityValidationV9": v9["expectedBody"],
}
print(yaml.safe_dump(parts, sort_keys=False, allow_unicode=True))
PY
```

Expected: nueve bloques YAML; la lectura no contiene claves con prefijo `$` y
V9 contiene seis infracciones.

- [ ] **Step 2: Crear metadatos, rutas y operaciones**

Use `apply_patch` to create `contracts/evm/openapi.yaml` with:

```yaml
openapi: 3.1.0
info:
  title: Seguimiento de Valor Ganado
  version: decision-pending
  description: >-
    Contrato del API EVM transcrito de las fuentes canónicas. La versión
    documental está pendiente de decisión y se registra al final.
paths:
  /projects:
    post:
      operationId: createProject
  /projects/{projectId}:
    get:
      operationId: getProject
    delete:
      operationId: deleteProject
  /projects/{projectId}/activities:
    post:
      operationId: createActivity
  /projects/{projectId}/activities/{activityId}:
    delete:
      operationId: deleteActivity
```

Complete every operation in the same patch:

- Spanish `summary` and `description`;
- required JSON request body referencing `ProjectWrite` or `ActivityWrite`;
- `201` with `ProjectRead` or `ActivityRead` for both creates;
- `200` with `ProjectAnalysis` for the analytical read;
- `204` with no `content` for both deletes;
- `400` and `422` for creates;
- `404` for operations that resolve an existing path resource;
- no other operation or response status.

- [ ] **Step 3: Añadir parámetros y esquemas**

In the same YAML, define integer path parameters `ProjectId` and `ActivityId`
without `format`, sign or size constraints. Define and reference:

```text
ProjectWrite        name, cutoffDate
ProjectRead         id, name, cutoffDate
ActivityWrite       name, bac, plannedProgress, actualProgress, ac
ActivityRead        ActivityWrite fields + id, pv, ev, cv, sv, cpi, spi, eac, vac
ProjectSummary      bac, pv, ev, ac, cv, sv, cpi, spi, eac, vac, progress,
                    activitiesWithEvAndZeroAc
ProjectAnalysis     project, activities, summary
IndexResult         value, display, status, label
Violation           field, rule, message
Error               code, message, violations
```

Apply these exact constraints:

```yaml
bac:
  type: number
  exclusiveMinimum: 0
plannedProgress:
  type: number
  minimum: 0
  maximum: 100
actualProgress:
  type: number
  minimum: 0
  maximum: 100
ac:
  type: number
  minimum: 0
```

`ActivityWrite.required` contains only `name`, because requiredness of the four
numeric fields is an explicit gap. `ProjectWrite.required` contains `name` and
`cutoffDate`. Leave `cutoffDate` without `type` or `format` and explain the
gap in its description.

Use `type: [number, "null"]` for `IndexResult.value`, `eac`, `vac` and
`progress`; use `type: [string, "null"]` for `IndexResult.display`. Require all
four members of `IndexResult` and enumerate exactly:

```yaml
status:
  type: string
  enum: [unfavorable, neutral, favorable, not_evaluable]
rule:
  type: string
  enum: [required, positive, non_negative, range_0_100, read_only]
code:
  type: string
  enum: [malformed_request, not_found, validation_failed]
```

Do not use `readOnly`, `nullable` or `additionalProperties`.

- [ ] **Step 4: Añadir respuestas, ejemplos y decisiones faltantes**

Create reusable examples named exactly as in Step 1 and paste their emitted
values without editing any name or number. Reference:

- `ReferenceProjectAnalysis` from the `200` analytical response;
- `ReferenceProject` and `ReferenceActivity` from their respective `201`;
- `MalformedRequest`, `NotFound` and applicable validation examples from the
  shared error responses;
- `ActivityValidationV9` from the activity `422`.

Make the last top-level key:

```yaml
x-decisions-missing:
  title: Decisiones faltantes
  items:
    - question: ¿Qué forma exacta devuelve GET /projects?
      blockingReason: >-
        Sin decidir si la colección es un arreglo desnudo o una envolvente, la
        respuesta 200 no puede escribirse.
      responsibleAdr: ADR-006b
      fixtureHint: >-
        Insinuación, no decisión: readResponse.project muestra la forma de un
        elemento, pero no la forma de la colección.
```

Add concrete entries for: `GET /projects`; update verb and semantics; numeric
requiredness; `cutoffDate` wire type/format; `info.version`; unknown write
properties; and whitespace-only names. Each item states why it blocks contract
precision and assigns ADR-006a, ADR-006b or ADR-009 as appropriate.

- [ ] **Step 5: Marcar las tareas OpenSpec de construcción**

Use `apply_patch` to change tasks 1.1 through 1.4 in
`openspec/changes/add-evm-openapi-contract/tasks.md` from `- [ ]` to `- [x]`.

### Task 2: Verificar validez OpenAPI y fidelidad del fixture

**Files:**

- Verify: `contracts/evm/openapi.yaml`
- Verify: `contracts/evm/evm-fixture.json`
- Modify: `openspec/changes/add-evm-openapi-contract/tasks.md`

- [ ] **Step 1: Validar OpenAPI 3.1 y referencias**

Run:

```bash
npx --yes @redocly/cli@latest lint --extends=spec contracts/evm/openapi.yaml
npx --yes @redocly/cli@latest bundle --dereferenced \
  --output /tmp/evm-openapi-dereferenced.yaml \
  contracts/evm/openapi.yaml
```

Expected: both commands exit 0; lint reports a valid OpenAPI 3.1 document and
bundle resolves every `$ref`.

- [ ] **Step 2: Comparar ejemplos y restricciones**

Run:

```bash
python3 - <<'PY'
import json
from pathlib import Path
import yaml

doc = yaml.safe_load(Path("contracts/evm/openapi.yaml").read_text())
fixture = json.loads(Path("contracts/evm/evm-fixture.json").read_text())

def clean(value):
    if isinstance(value, dict):
        return {key: clean(item) for key, item in value.items()
                if not key.startswith("$")}
    if isinstance(value, list):
        return [clean(item) for item in value]
    return value

def example(name):
    return doc["components"]["examples"][name]["value"]

v9 = next(case for case in fixture["validationChecks"]["cases"]
          if case["$id"] == "V9")
assert example("ReferenceProjectAnalysis") == clean(fixture["readResponse"])
assert example("ReferenceProject") == clean(fixture["readResponse"]["project"])
assert example("ReferenceActivity") == clean(
    fixture["readResponse"]["activities"][0])
assert example("MalformedRequest") == \
    fixture["errorEnvelopes"]["malformedRequest"]["expectedBody"]
assert example("NotFound") == \
    fixture["errorEnvelopes"]["notFound"]["expectedBody"]
assert example("ValidationFailed") == \
    fixture["errorEnvelopes"]["validationFailed"]["expectedBody"]
assert example("ProjectNameRequired") == \
    fixture["validationChecks"]["cases"][0]["expectedBody"]
assert example("ProjectCutoffDateRequired") == \
    fixture["validationChecks"]["cases"][1]["expectedBody"]
assert example("ActivityValidationV9") == v9["expectedBody"]

schemas = doc["components"]["schemas"]
write = schemas["ActivityWrite"]
assert set(write["properties"]) == {
    "name", "bac", "plannedProgress", "actualProgress", "ac"}
assert write["required"] == ["name"]
assert schemas["IndexResult"]["required"] == [
    "value", "display", "status", "label"]
assert schemas["IndexResult"]["properties"]["value"]["type"] == [
    "number", "null"]
assert schemas["IndexResult"]["properties"]["display"]["type"] == [
    "string", "null"]
assert schemas["IndexResult"]["properties"]["status"]["enum"] == [
    "unfavorable", "neutral", "favorable", "not_evaluable"]
assert schemas["Violation"]["properties"]["rule"]["enum"] == [
    "required", "positive", "non_negative", "range_0_100", "read_only"]

print("Fixture examples and contract constraints: OK")
PY
```

Expected: `Fixture examples and contract constraints: OK`.

- [ ] **Step 3: Auditar superficie y prohibiciones**

Run:

```bash
python3 - <<'PY'
from pathlib import Path
import yaml

path = Path("contracts/evm/openapi.yaml")
text = path.read_text()
doc = yaml.safe_load(text)

assert doc["openapi"] == "3.1.0"
assert list(doc["paths"]) == [
    "/projects",
    "/projects/{projectId}",
    "/projects/{projectId}/activities",
    "/projects/{projectId}/activities/{activityId}",
]
operations = {
    route: {key for key in item if key in {
        "get", "post", "put", "patch", "delete"}}
    for route, item in doc["paths"].items()
}
assert operations == {
    "/projects": {"post"},
    "/projects/{projectId}": {"get", "delete"},
    "/projects/{projectId}/activities": {"post"},
    "/projects/{projectId}/activities/{activityId}": {"delete"},
}
assert "nullable:" not in text
assert "readOnly:" not in text
assert "servers" not in doc
assert "security" not in doc
assert list(doc)[-1] == "x-decisions-missing"
assert doc["x-decisions-missing"]["title"] == "Decisiones faltantes"
assert len(doc["x-decisions-missing"]["items"]) >= 7

for item in doc["paths"].values():
    assert "parameters" not in item or all(
        parameter.get("in") != "query"
        for parameter in item["parameters"]
        if isinstance(parameter, dict))

print("Surface and prohibitions: OK")
PY
```

Expected: `Surface and prohibitions: OK`.

- [ ] **Step 4: Marcar las tareas OpenSpec de verificación**

Use `apply_patch` to change tasks 2.1 through 2.4 in
`openspec/changes/add-evm-openapi-contract/tasks.md` from `- [ ]` to `- [x]`.

### Task 3: Cierre documental y commit lógico

**Files:**

- Verify: `contracts/evm/openapi.yaml`
- Verify: `openspec/changes/add-evm-openapi-contract/tasks.md`
- Verify: `docs/superpowers/plans/2026-07-28-evm-openapi-contract.md`

- [ ] **Step 1: Incluir el YAML nuevo en la revisión y ejecutar verificaciones**

Run:

```bash
git add -N -- contracts/evm/openapi.yaml
git diff --check
openspec validate add-evm-openapi-contract \
  --type change --strict --no-interactive
openspec instructions apply --change add-evm-openapi-contract --json
```

Expected: no whitespace errors; OpenSpec passes; apply reports every task
complete.

- [ ] **Step 2: Auditar diff, estado y alcance**

Run:

```bash
git status --short --branch
git diff -- contracts/evm/openapi.yaml \
  openspec/changes/add-evm-openapi-contract/tasks.md
git diff --stat origin/develop...HEAD
git log --oneline --decorate origin/develop..HEAD
```

Expected: the only uncommitted implementation files are the OpenAPI YAML and
the OpenSpec task checklist; branch commits contain only the design, OpenSpec
artifacts and plan.

- [ ] **Step 3: Crear el commit de implementación**

Run:

```bash
git add -- contracts/evm/openapi.yaml \
  openspec/changes/add-evm-openapi-contract/tasks.md
git commit -m "docs: add EVM OpenAPI contract"
```

Expected: one logical commit containing the contract and completed checklist.

- [ ] **Step 4: Repetir evidencia fresca después del commit**

Run literally:

```bash
npx --yes @redocly/cli@latest lint --extends=spec contracts/evm/openapi.yaml
npx --yes @redocly/cli@latest bundle --dereferenced \
  --output /tmp/evm-openapi-dereferenced.yaml \
  contracts/evm/openapi.yaml
git diff --check origin/develop...HEAD
git status --short --branch
git diff --name-status origin/develop...HEAD
```

Expected: validators exit 0, the worktree is clean, and the branch diff
contains only the approved design, plan, OpenSpec change and OpenAPI contract.
