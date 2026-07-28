## ADDED Requirements

### Requirement: Versión SemVer del contrato

El documento MUST declarar `info.version: 1.0.0` y MUST documentar que ese valor
sigue SemVer para el contrato. El versionado MUST NOT introducir un prefijo,
parámetro ni otra variante en las rutas.

#### Scenario: Publicación inicial estable

- **WHEN** se inspecciona la información del contrato
- **THEN** la versión es exactamente `1.0.0` y la descripción identifica SemVer
  como convención contractual

### Requirement: Colección mínima de proyectos

`GET /projects` MUST responder `200` con un arreglo JSON desnudo. Cada elemento
MUST contener únicamente `id` y `name`, y una colección sin proyectos MUST
representarse como `[]`.

#### Scenario: Colección con proyectos

- **WHEN** se consulta la colección del fixture v5.0.0
- **THEN** el cuerpo coincide literalmente con
  `collectionResponse.expectedBody`

#### Scenario: Colección vacía

- **WHEN** no existe ningún proyecto
- **THEN** el cuerpo coincide literalmente con
  `collectionResponse.empty.expectedBody`

## MODIFIED Requirements

### Requirement: Superficie limitada por ADR-006a y ADR-007

El contrato MUST declarar solo las cuatro rutas de recursos de ADR-006a. MUST
incluir las operaciones para crear proyectos y actividades, listar proyectos,
leer la foto analítica, reemplazar completamente proyectos y actividades, y
eliminar miembros. Las creaciones MUST responder `201`, las lecturas y
reemplazos MUST responder `200`, y las eliminaciones MUST responder `204`, con
los cuerpos definidos por ADR-007.

Cada `PUT` MUST declarar `400`, `404` y `422`. Un `PUT` dirigido a un proyecto o
actividad inexistente MUST responder `404` y MUST NOT crear el recurso en esa
URI, porque ADR-006a reserva al servidor la asignación de identificadores.

#### Scenario: Creación con representación

- **WHEN** se inspecciona la creación de un proyecto o una actividad
- **THEN** la operación devuelve `201` con su esquema de lectura

#### Scenario: Lectura analítica

- **WHEN** se inspecciona `GET /projects/{projectId}`
- **THEN** la operación devuelve `200` con proyecto, actividades y consolidado

#### Scenario: Reemplazo de proyecto

- **WHEN** se inspecciona `PUT /projects/{projectId}`
- **THEN** la operación devuelve `200` con `ProjectRead` y declara `400`, `404`
  y `422`

#### Scenario: Reemplazo de actividad

- **WHEN** se inspecciona
  `PUT /projects/{projectId}/activities/{activityId}`
- **THEN** la operación devuelve `200` con `ActivityRead` y declara `400`,
  `404` y `422`

#### Scenario: Reemplazo inexistente

- **WHEN** el identificador indicado en un `PUT` no corresponde a un recurso
  existente
- **THEN** la respuesta es `404` y no se crea un recurso en esa URI

#### Scenario: Eliminación sin cuerpo

- **WHEN** se inspecciona el borrado de un proyecto o actividad
- **THEN** la operación devuelve `204` sin contenido

### Requirement: Esquemas de escritura y lectura separados

El contrato MUST definir esquemas distintos de escritura y lectura para
proyectos y actividades. `ProjectWrite` MUST requerir `name` y `cutoffDate`.
`ActivityWrite` MUST contener y requerir exactamente `name`, `bac`,
`plannedProgress`, `actualProgress` y `ac`. `ActivityRead` MUST añadir `id`,
`pv`, `ev`, `cv`, `sv`, `cpi`, `spi`, `eac` y `vac`. El contrato MUST NOT
fusionar ambas formas mediante `readOnly`.

#### Scenario: Revisión de escritura de proyecto

- **WHEN** se inspecciona `ProjectWrite.required`
- **THEN** contiene exactamente `name` y `cutoffDate`

#### Scenario: Revisión de escritura de actividad

- **WHEN** se enumeran las propiedades y los campos requeridos de
  `ActivityWrite`
- **THEN** aparecen exactamente los cinco datos capturados en ambos conjuntos
  y ningún indicador

#### Scenario: Revisión de lectura de actividad

- **WHEN** se enumeran las propiedades de `ActivityRead`
- **THEN** aparecen los datos capturados, `id` y los ocho indicadores

### Requirement: Índice estable y nulabilidad OpenAPI 3.1

`cpi` y `spi` MUST referenciar un mismo objeto con `value`, `display`,
`status` y `label`. El objeto y sus miembros MUST estar siempre presentes.
Entre los miembros del índice, solo `value` y `display` MUST aceptar `null`,
usando tipos unión de OpenAPI 3.1. `status` MUST admitir exactamente
`unfavorable`, `neutral`, `favorable` y `not_evaluable`. El documento MUST NOT
usar la sintaxis `nullable` de OpenAPI 3.0.

#### Scenario: Índice no evaluable

- **WHEN** un índice no es evaluable
- **THEN** el objeto sigue presente, `value` y `display` son `null`, `status`
  es `not_evaluable` y `label` es `no evaluable`

#### Scenario: Ausencia de nulabilidad heredada

- **WHEN** se busca `nullable` en el documento
- **THEN** no aparece la sintaxis de OpenAPI 3.0

### Requirement: Restricciones y permisividad de entrada

`bac` MUST ser mayor que cero, `ac` MUST ser mayor o igual que cero y
`plannedProgress` y `actualProgress` MUST estar entre cero y cien inclusive.
`cutoffDate` MUST ser `string` con formato `date` cuando no sea `null`.

Cada propiedad obligatoria de `ProjectWrite` y `ActivityWrite` MUST admitir
estructuralmente `null`. Ninguno de esos esquemas MUST cerrar
`additionalProperties`. La descripción de cada esquema MUST advertir que, por
la consecuencia declarada en ADR-009, el esquema publicado es menos restrictivo
que las reglas reales y un cliente generado no debe equiparar nulabilidad ni
propiedades adicionales con validez de negocio.

La descripción de cada propiedad `name` de escritura MUST indicar que se
recortan los espacios laterales antes de validar y persistir. El contrato MUST
NOT añadir otras restricciones no decididas por el PRD o los ADR.

#### Scenario: Límites numéricos

- **WHEN** se inspeccionan los cuatro campos numéricos de `ActivityWrite`
- **THEN** sus límites coinciden exactamente con PRD §7.5 y su tipo también
  admite `null`

#### Scenario: Fecha de corte

- **WHEN** se inspecciona `ProjectWrite.cutoffDate`
- **THEN** su tipo admite `string` y `null`, y declara `format: date`

#### Scenario: Esquemas deliberadamente permisivos

- **WHEN** se inspeccionan los esquemas de escritura
- **THEN** no cierran propiedades adicionales, admiten estructuralmente `null`
  en todos sus campos obligatorios y contienen la advertencia de ADR-009

#### Scenario: Normalización de nombre

- **WHEN** se inspecciona la descripción de un `name` de escritura
- **THEN** documenta el recorte de espacios laterales antes de validar y
  persistir

### Requirement: Envolvente única de error

Las respuestas `400`, `404` y `422` MUST usar un único esquema con `code`,
`message` y `violations`. Cada infracción MUST contener `field`, `rule` y
`message`. `rule` MUST admitir únicamente `required`, `positive`,
`non_negative`, `range_0_100`, `read_only` y `unknown`. Cada operación MUST
declarar los errores aplicables y no estados añadidos por un framework.

#### Scenario: Error malformado

- **WHEN** se inspecciona una respuesta `400`
- **THEN** usa `code: malformed_request` y una lista `violations` vacía

#### Scenario: Recurso inexistente

- **WHEN** se inspecciona una respuesta `404`
- **THEN** usa `code: not_found` y una lista `violations` vacía

#### Scenario: Validación acumulada

- **WHEN** se inspecciona el ejemplo V9 de una respuesta `422`
- **THEN** contiene las siete infracciones literales que acumulan las seis
  reglas cerradas

### Requirement: Ejemplos literales del fixture

Todos los números y cuerpos de ejemplo MUST proceder literalmente de
`contracts/evm/evm-fixture.json` v5.0.0. El ejemplo de
`GET /projects/{projectId}` y de lectura agregada MUST igualar `readResponse`
después de eliminar recursivamente las claves con prefijo `$`. La colección y
su caso vacío MUST usar `collectionResponse`. Los errores `400` y `404` MUST
usar `errorEnvelopes`, y los ejemplos `422` MUST usar `validationChecks`,
incluido el caso compuesto V9.

`validationChecks.$scopeNote` MUST conservarse como límite deliberado: los
casos capturan comportamientos distintos, no la combinatoria completa. La
ausencia y el `null` de cada campo obligatorio MUST verificarse mediante una
prueba parametrizada basada en `writeSchemas`, no agregando casos al fixture.

#### Scenario: Comparación de lectura

- **WHEN** un verificador elimina las claves de metadatos del fixture
- **THEN** el resultado coincide profundamente con el ejemplo de lectura del
  contrato

#### Scenario: Comparación de colección

- **WHEN** un verificador compara la colección poblada y vacía
- **THEN** ambas coinciden profundamente con `collectionResponse`

#### Scenario: Comparación de errores

- **WHEN** un verificador compara `400`, `404`, los ejemplos `422` y V9 con el
  fixture
- **THEN** sus estados y cuerpos coinciden profundamente

#### Scenario: Cobertura parametrizada de obligatorios

- **WHEN** se verifica cada campo enumerado en `writeSchemas`
- **THEN** tanto su ausencia como `null` se cubren de forma parametrizada sin
  ampliar `validationChecks`

### Requirement: Decisiones faltantes visibles

El documento MUST omitir `x-decisions-missing` cuando PRD y ADR respondan todas
las preguntas necesarias para el contrato. Si aparece una pregunta que ninguna
fuente responde, la implementación MUST NOT resolverla ni adoptar un valor por
defecto de framework: MUST restaurar `x-decisions-missing` y registrar la
pregunta concreta.

#### Scenario: Contrato completamente decidido

- **WHEN** la auditoría no encuentra una pregunta sin respuesta
- **THEN** `x-decisions-missing` no aparece en el documento

#### Scenario: Nuevo hueco de decisión

- **WHEN** la auditoría encuentra una pregunta que ningún ADR responde
- **THEN** el valor no se inventa y `x-decisions-missing` registra el hueco
