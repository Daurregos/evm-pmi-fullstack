# ADR-009 API Error Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redactar ADR-009 con un contrato de errores completo, simple y verificable que sirva de fuente al SDD y a OpenAPI.

**Architecture:** ADR-009 hereda las rutas y el `404` de ADR-006a y la separación entre valores legibles por máquina y textos para personas de ADR-006b. El ADR adopta una envolvente JSON común para `400`, `404` y `422`, usa `422` para validación semántica, acumula infracciones y trata `rule` como un enumerado cerrado con fallback defensivo.

**Tech Stack:** Markdown, Git, ripgrep, utilidades POSIX

---

### Task 1: Redactar ADR-009

**Files:**
- Modify: `docs/adr/009-contrato-errores-api.md`
- Reference: `docs/PRD.md`
- Reference: `docs/adr/006a-diseno-recursos-rest.md`
- Reference: `docs/adr/006b-forma-respuesta-contrato-datos.md`
- Reference: `docs/superpowers/specs/2026-07-27-adr-009-api-error-contract-design.md`
- Reference: `/home/unix_trycore/repositories/trycore/evm-pmi-fullstack/evm-fixture.json`

- [ ] **Step 1: Confirmar las fuentes y el alcance limpio**

Run:

```bash
test -e docs/adr/009-contrato-errores-api.md
rg -nF 'Una entrada inválida se rechaza indicando el campo y la regla incumplida, sin alterar el estado previo.' docs/PRD.md
rg -nF 'Eliminar un proyecto o actividad inexistente devuelve `404 Not Found`.' docs/adr/006a-diseno-recursos-rest.md
rg -nF '`status` es un enumerado legible por máquina, en inglés y estable; `label` es texto legible por personas' docs/adr/006b-forma-respuesta-contrato-datos.md
rg -n '"validationChecks"|"field": "cpi"|"rule": "campo de solo lectura' /home/unix_trycore/repositories/trycore/evm-pmi-fullstack/evm-fixture.json
rg -nF 'La forma del `400` queda fuera de este ADR.' docs/adr/009-contrato-errores-api.md
! rg -qF 'El conjunto de `rule` es cerrado.' docs/adr/009-contrato-errores-api.md
git status --short --branch
```

Expected: ADR-009 contiene el alcance incompleto del `400` y todavía no define
la compatibilidad de `rule`; las tres fuentes rastreadas contienen las reglas
heredadas; el fixture local conserva `validationChecks` y el caso `cpi`; el
worktree está limpio.

- [ ] **Step 2: Sustituir ADR-009 por el contenido aprobado**

Replace `docs/adr/009-contrato-errores-api.md` with exactly:

````markdown
# ADR-009 — Contrato de errores del API

**Estado:** Aceptada · **Fecha:** 2026-07-27
**Relacionada con:** RF-02; reglas del PRD §7.5
**Depende de:** ADR-006a y ADR-006b

## Contexto

RF-02 y el PRD §7.5 exigen rechazar entradas inválidas, identificar el campo y la regla incumplida, y conservar el estado previo. ADR-006a fija `404 Not Found` para recursos inexistentes. ADR-006b separa enumerados estables legibles por máquina de textos en español para personas. Una escritura puede infringir varias reglas. El consumidor interno favorece una forma simple.

## Decisión

Una escritura JSON sintácticamente correcta que incumple el PRD §7.5 devuelve `422 Unprocessable Content`.

`400 Bad Request` queda reservado para contenido sintácticamente inválido.

El `400` usa la misma envolvente con `code: "malformed_request"` y `violations: []`.

La validación reporta todas las infracciones detectadas en la petición.

La petición rechazada no altera el estado previo.

Todo campo de solo lectura presente en una escritura se rechaza con `422`.

Ningún campo de solo lectura se ignora.

El cuerpo JSON contiene `code`, `message` y `violations`.

`code` es un enumerado estable en inglés.

`message` es texto humano en español.

Cada elemento de `violations` contiene `field`, `rule` y `message`.

`field` usa el nombre `lowerCamelCase` exacto de ADR-006b.

`rule` es un enumerado estable en inglés.

El conjunto de `rule` es cerrado.

El `message` de la infracción explica la corrección en español.

Los consumidores automatizan sobre `code` y `rule`, no sobre `message`.

Agregar un valor a `rule` no es compatible hacia atrás.

Ante un valor desconocido, el consumidor conserva `field`.

También muestra `message`.

La infracción se trata como validación genérica sin fallar.

Las reglas iniciales son `required`, `positive`, `non_negative`, `range_0_100` y `read_only`.

```json
{"code":"validation_failed","message":"La entrada contiene errores.",
"violations":[{"field":"bac","rule":"positive",
"message":"Debe ser positivo."}]}
```

El `404` usa la misma forma con `code: "not_found"` y `violations: []`.

Ningún cuerpo incluye mensajes de excepción, trazas ni detalles del framework.

Logging y observabilidad quedan fuera de esta decisión.

## Alternativas consideradas

- **RFC 9457 con una extensión de validación:** sería adecuada para una API pública, pero añade tipos URI y miembros innecesarios aquí.
- **`400` para toda entrada inválida:** reduciría códigos, pero mezclaría sintaxis incorrecta con contenido semánticamente inválido.
- **Reportar solo la primera infracción:** simplificaría el recorrido de validación, pero obligaría al usuario a repetir ciclos de corrección.

## Consecuencias

- El usuario puede corregir todos los campos afectados en un intento.
- OpenAPI debe declarar la envolvente, sus enumerados y `violations`.
- `400`, `404` y `422` comparten una forma. El consumidor necesita un único manejador de errores.
- Acumular infracciones exige ejecutar todas las validaciones independientes.
- El formato propio exige mantenimiento.
- La localización futura exigiría revisar los mensajes en español.
- Validaciones costosas o dependientes obligarían a reconsiderar la acumulación.
- Varios consumidores externos o una exigencia de interoperabilidad obligarían a reconsiderar RFC 9457.

## Verificación

Pruebas de contrato contrastan `evm-fixture.json`: cada `validationChecks` devuelve `422`, `field`, `rule`, mensaje humano y estado intacto. Un caso compuesto reúne todas las infracciones. `cpi` produce `read_only`. Otros casos cubren la forma `404` y excluyen excepciones, trazas o detalles del framework.
````

- [ ] **Step 3: Verificar forma, límite y cobertura**

Run:

```bash
git add -N -- docs/adr/009-contrato-errores-api.md
git diff --check -- docs/adr/009-contrato-errores-api.md
test "$(wc -w < docs/adr/009-contrato-errores-api.md)" -le 510
test "$(git diff --name-only)" = 'docs/adr/009-contrato-errores-api.md'
rg -qF '`422 Unprocessable Content`' docs/adr/009-contrato-errores-api.md
rg -qF 'La validación reporta todas las infracciones detectadas en la petición.' docs/adr/009-contrato-errores-api.md
rg -qF 'El `400` usa la misma envolvente con `code: "malformed_request"` y `violations: []`.' docs/adr/009-contrato-errores-api.md
rg -qF 'Ningún campo de solo lectura se ignora.' docs/adr/009-contrato-errores-api.md
rg -qF 'Los consumidores automatizan sobre `code` y `rule`, no sobre `message`.' docs/adr/009-contrato-errores-api.md
rg -qF 'El conjunto de `rule` es cerrado.' docs/adr/009-contrato-errores-api.md
rg -qF 'Agregar un valor a `rule` no es compatible hacia atrás.' docs/adr/009-contrato-errores-api.md
rg -qF 'Ante un valor desconocido, el consumidor conserva `field`.' docs/adr/009-contrato-errores-api.md
rg -qF 'También muestra `message`.' docs/adr/009-contrato-errores-api.md
rg -qF 'La infracción se trata como validación genérica sin fallar.' docs/adr/009-contrato-errores-api.md
rg -qF '`400`, `404` y `422` comparten una forma. El consumidor necesita un único manejador de errores.' docs/adr/009-contrato-errores-api.md
rg -qF 'La localización futura exigiría revisar los mensajes en español.' docs/adr/009-contrato-errores-api.md
rg -qF 'Validaciones costosas o dependientes obligarían a reconsiderar la acumulación.' docs/adr/009-contrato-errores-api.md
rg -qF 'El `404` usa la misma forma con `code: "not_found"` y `violations: []`.' docs/adr/009-contrato-errores-api.md
rg -qF 'RFC 9457 con una extensión de validación' docs/adr/009-contrato-errores-api.md
rg -qF 'Ningún cuerpo incluye mensajes de excepción, trazas ni detalles del framework.' docs/adr/009-contrato-errores-api.md
rg -qF 'evm-fixture.json' docs/adr/009-contrato-errores-api.md
```

Expected: todos los comandos terminan con código cero; `git diff --check` no
produce salida; el ADR tiene como máximo 510 palabras; el diff de trabajo solo
contiene ADR-009; y las decisiones obligatorias, RFC 9457, la restricción de
seguridad y el fixture aparecen explícitamente.

- [ ] **Step 4: Revisar el diff completo**

Run:

```bash
git diff -- docs/adr/009-contrato-errores-api.md
```

Expected: el archivo sigue la estructura obligatoria, cada frase de Decisión
expresa una idea, el ejemplo ocupa cuatro líneas, solo se modifican las dos
decisiones aprobadas y no aparecen decisiones de logging, observabilidad ni
estados exitosos.

- [ ] **Step 5: Consolidar la corrección en el commit lógico del ADR**

Run:

```bash
git add -- docs/adr/009-contrato-errores-api.md
git diff --cached --check
git diff --cached --name-only
git commit --fixup="$(git log -1 --format=%H -- docs/adr/009-contrato-errores-api.md)"
GIT_SEQUENCE_EDITOR=true git rebase -i --autosquash origin/develop
```

Expected: el área preparada contiene únicamente
`docs/adr/009-contrato-errores-api.md`; la corrección queda consolidada en el
commit lógico del ADR y no permanece un commit de microajuste.

### Task 2: Verificar el cambio documental completo

**Files:**
- Verify: `docs/adr/009-contrato-errores-api.md`
- Verify: `docs/superpowers/specs/2026-07-27-adr-009-api-error-contract-design.md`
- Verify: `docs/superpowers/plans/2026-07-27-adr-009-api-error-contract.md`
- Reference: `/home/unix_trycore/repositories/trycore/evm-pmi-fullstack/evm-fixture.json`

- [ ] **Step 1: Aplicar la verificación previa al cierre**

Read and apply `superpowers:verification-before-completion` before claiming
that ADR-009 is complete or creating any PR.

- [ ] **Step 2: Ejecutar las comprobaciones finales frescas**

Run:

```bash
git diff --check origin/develop...HEAD
test "$(wc -w < docs/adr/009-contrato-errores-api.md)" -le 510
rg -nF '# ADR-009 — Contrato de errores del API' docs/adr/009-contrato-errores-api.md
rg -nF '**Estado:** Aceptada · **Fecha:** 2026-07-27' docs/adr/009-contrato-errores-api.md
rg -nF '**Relacionada con:** RF-02; reglas del PRD §7.5' docs/adr/009-contrato-errores-api.md
rg -nF '**Depende de:** ADR-006a y ADR-006b' docs/adr/009-contrato-errores-api.md
test "$(rg -c '^## (Contexto|Decisión|Alternativas consideradas|Consecuencias|Verificación)$' docs/adr/009-contrato-errores-api.md)" -eq 5
rg -nF '"validationChecks"' /home/unix_trycore/repositories/trycore/evm-pmi-fullstack/evm-fixture.json
rg -nF '"field": "cpi"' /home/unix_trycore/repositories/trycore/evm-pmi-fullstack/evm-fixture.json
git diff --name-only origin/develop...HEAD
git log --oneline --decorate origin/develop..HEAD
git status --short --branch
```

Expected: no hay errores de whitespace; el ADR conserva el límite y todas las
secciones obligatorias; el fixture de referencia conserva `validationChecks`
y el caso `cpi`; la rama contiene únicamente diseño, plan y ADR en commits
lógicos; el worktree no tiene cambios pendientes.

- [ ] **Step 3: Auditar dependientes y entrega**

Run:

```bash
git diff --quiet origin/develop...HEAD -- docs/PRD.md
git diff --quiet origin/develop...HEAD -- docs/adr/006a-diseno-recursos-rest.md
git diff --quiet origin/develop...HEAD -- docs/adr/006b-forma-respuesta-contrato-datos.md
git diff --quiet origin/develop...HEAD -- AGENTS.md
git diff --quiet origin/develop...HEAD -- openspec
git status --porcelain=v1
```

Expected: todos los comandos terminan con código cero. Las fuentes superiores,
los ADR dependientes, las instrucciones y OpenSpec permanecen sin cambios; no
hay estado local pendiente. No se crea PR sin una solicitud explícita.
