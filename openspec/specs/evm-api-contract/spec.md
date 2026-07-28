# evm-api-contract Specification

## Purpose

Definir el contrato OpenAPI validable y trazable del API de proyectos,
actividades, resultados EVM y errores, sin convertir el contrato en fuente de
decisiones de producto o arquitectura.

## Requirements
### Requirement: Documento OpenAPI único y válido

El entregable MUST ser un único archivo YAML en
`contracts/evm/openapi.yaml`, MUST declarar `openapi: 3.1.0` y MUST validar
contra el esquema de OpenAPI 3.1 con todas sus referencias resolubles.

#### Scenario: Validación estructural

- **WHEN** se valida `contracts/evm/openapi.yaml` contra OpenAPI 3.1
- **THEN** el documento es válido y ninguna referencia queda sin resolver

### Requirement: Lenguaje y nombres contractuales

Los nombres de campo, enumerados y `operationId` MUST estar en inglés y
conservar exactamente los nombres de ADR-006b y ADR-009. Los resúmenes,
descripciones, etiquetas y demás textos dirigidos a personas MUST estar en
español.

#### Scenario: Auditoría de idioma y nombres

- **WHEN** se inspeccionan operaciones, esquemas y enumerados
- **THEN** los identificadores de máquina coinciden con los ADR y los textos
  humanos están en español

### Requirement: Superficie limitada por ADR-006a y ADR-007

El contrato MUST declarar solo las cuatro rutas de recursos de ADR-006a. MUST
incluir las operaciones plenamente derivables para crear proyectos y
actividades, leer la foto analítica y eliminar miembros. MUST usar los cuerpos
de éxito de ADR-007 y los códigos `201`, `200` y `204` que corresponden a esas
semánticas. MUST omitir las operaciones bloqueadas por una decisión ausente.

#### Scenario: Creación con representación

- **WHEN** se inspecciona la creación de un proyecto o una actividad
- **THEN** la operación devuelve `201` con su esquema de lectura

#### Scenario: Lectura analítica

- **WHEN** se inspecciona `GET /projects/{projectId}`
- **THEN** la operación devuelve `200` con proyecto, actividades y consolidado

#### Scenario: Eliminación sin cuerpo

- **WHEN** se inspecciona el borrado de un proyecto o actividad
- **THEN** la operación devuelve `204` sin contenido

#### Scenario: Operación bloqueada

- **WHEN** una fuente no decide el cuerpo o el verbo de una operación
- **THEN** la operación no aparece y la decisión faltante queda registrada

### Requirement: Esquemas de escritura y lectura separados

El contrato MUST definir esquemas distintos de escritura y lectura para
proyectos y actividades. `ActivityWrite` MUST contener solo `name`, `bac`,
`plannedProgress`, `actualProgress` y `ac`. `ActivityRead` MUST añadir `id`,
`pv`, `ev`, `cv`, `sv`, `cpi`, `spi`, `eac` y `vac`. El contrato MUST NOT
fusionar ambas formas mediante `readOnly`.

#### Scenario: Revisión de escritura de actividad

- **WHEN** se enumeran las propiedades de `ActivityWrite`
- **THEN** aparecen exactamente los cinco datos capturados y ningún indicador

#### Scenario: Revisión de lectura de actividad

- **WHEN** se enumeran las propiedades de `ActivityRead`
- **THEN** aparecen los datos capturados, `id` y los ocho indicadores

### Requirement: Índice estable y nulabilidad OpenAPI 3.1

`cpi` y `spi` MUST referenciar un mismo objeto con `value`, `display`,
`status` y `label`. El objeto y sus miembros MUST estar siempre presentes.
Solo `value` y `display` MUST aceptar `null`, usando tipos unión de OpenAPI 3.1.
`status` MUST admitir exactamente `unfavorable`, `neutral`, `favorable` y
`not_evaluable`.

#### Scenario: Índice no evaluable

- **WHEN** un índice no es evaluable
- **THEN** el objeto sigue presente, `value` y `display` son `null`, `status`
  es `not_evaluable` y `label` es `no evaluable`

#### Scenario: Ausencia de nulabilidad heredada

- **WHEN** se busca `nullable` en el documento
- **THEN** no aparece la sintaxis de OpenAPI 3.0

### Requirement: Restricciones de entrada

`bac` MUST ser mayor que cero, `ac` MUST ser mayor o igual que cero y
`plannedProgress` y `actualProgress` MUST estar entre cero y cien inclusive.
El contrato MUST NOT añadir restricciones no decididas por el PRD o los ADR.

#### Scenario: Límites numéricos

- **WHEN** se inspeccionan los cuatro campos numéricos de `ActivityWrite`
- **THEN** sus límites coinciden exactamente con PRD §7.5

### Requirement: Envolvente única de error

Las respuestas `400`, `404` y `422` MUST usar un único esquema con `code`,
`message` y `violations`. Cada infracción MUST contener `field`, `rule` y
`message`. `rule` MUST admitir únicamente `required`, `positive`,
`non_negative`, `range_0_100` y `read_only`. Cada operación MUST declarar los
errores aplicables y no estados añadidos por un framework.

#### Scenario: Error malformado

- **WHEN** se inspecciona una respuesta `400`
- **THEN** usa `code: malformed_request` y una lista `violations` vacía

#### Scenario: Recurso inexistente

- **WHEN** se inspecciona una respuesta `404`
- **THEN** usa `code: not_found` y una lista `violations` vacía

#### Scenario: Validación acumulada

- **WHEN** se inspecciona el ejemplo V9 de una respuesta `422`
- **THEN** contiene las seis infracciones literales que acumulan las cinco
  reglas cerradas

### Requirement: Ejemplos literales del fixture

Todos los números y cuerpos de ejemplo MUST proceder literalmente de
`contracts/evm/evm-fixture.json`. El ejemplo de
`GET /projects/{projectId}` MUST igualar `readResponse` después de eliminar
recursivamente las claves con prefijo `$`. Los errores MUST usar
`errorEnvelopes` y `validationChecks`, incluido V9.

#### Scenario: Comparación de lectura

- **WHEN** un verificador elimina las claves de metadatos del fixture
- **THEN** el resultado coincide profundamente con el ejemplo de lectura del
  contrato

#### Scenario: Comparación de errores

- **WHEN** un verificador compara `400`, `404`, `422` y V9 con el fixture
- **THEN** sus estados y cuerpos coinciden profundamente

### Requirement: Decisiones faltantes visibles

El documento MUST terminar con una sección titulada «Decisiones faltantes».
Cada hueco MUST indicar la pregunta concreta, por qué impide escribir el
contrato, qué ADR debe cerrarlo y, cuando exista, qué lectura insinúa el fixture
marcada explícitamente como insinuación y no decisión.

#### Scenario: Hueco que bloquea una operación

- **WHEN** una decisión ausente impide definir una operación completa
- **THEN** la operación queda fuera y la sección final explica el bloqueo

### Requirement: Ausencia de superficie inventada

El contrato MUST NOT añadir rutas, parámetros de consulta, paginación, filtros,
ordenamiento, versionado en rutas, autenticación, cabeceras, servidores ni
campos ausentes de ADR-006b.

#### Scenario: Auditoría negativa

- **WHEN** se revisa la superficie completa del YAML
- **THEN** no aparece ningún elemento prohibido o decidido por defecto
