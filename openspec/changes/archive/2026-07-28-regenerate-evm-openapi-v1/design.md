## Context

`contracts/evm/openapi.yaml` conserva el estado provisional anterior al cierre
de ADR-006a, ADR-006b y ADR-009. Esos ADR ya definen la colección de proyectos,
los reemplazos completos, los campos obligatorios, el límite entre validación
estructural y de negocio, la regla `unknown` y la normalización de nombres.
El fixture `contracts/evm/evm-fixture.json` v5.0.0 aporta los cuerpos literales
que deben aparecer como ejemplos.

La precedencia aplicable sigue siendo PRD, ADR, OpenSpec y evidencia. Este
cambio no reabre decisiones ni modifica PRD o ADR; únicamente materializa las
decisiones vigentes en el contrato y valida la nueva versión del fixture.

## Goals / Non-Goals

**Goals:**

- Publicar un contrato OpenAPI 3.1 completo con `info.version: 1.0.0`.
- Añadir la colección de proyectos y los dos reemplazos completos definidos por
  ADR-006a, con sus respuestas de éxito y error.
- Representar los esquemas de escritura decididos por ADR-006b y la
  permisividad estructural advertida por ADR-009.
- Incorporar literalmente los ejemplos v5.0.0 del fixture y comprobarlos de
  forma estructural.
- Eliminar el marcador provisional de decisiones faltantes tras comprobar que
  no subsiste ninguna pregunta sin respuesta.

**Non-Goals:**

- Modificar o reinterpretar ADR, PRD o reglas EVM.
- Añadir autenticación, paginación, filtros, ordenamiento, servidores,
  cabeceras o versionado en la URI.
- Convertir `validationChecks` en una matriz combinatoria de ausencia y `null`
  para cada campo obligatorio.
- Endurecer el esquema publicado para que replique todas las reglas de negocio.

## Decisions

### Mantener un único contrato editado sobre la estructura existente

Se actualizará `contracts/evm/openapi.yaml` conservando sus componentes y
referencias reutilizables. Se añadirán `GET /projects`,
`PUT /projects/{projectId}` y
`PUT /projects/{projectId}/activities/{activityId}` sin introducir rutas
nuevas.

Los `PUT` son reemplazos completos. Responderán `200` con `ProjectRead` o
`ActivityRead`, y declararán `400`, `404` y `422`. La respuesta `404` para una
URI inexistente es una derivación explícita: ADR-006a fija `404` para recursos
inexistentes y reserva al servidor la asignación de identificadores, por lo que
el reemplazo no crea el recurso indicado.

### Expresar la frontera de validación de ADR-009

`ProjectWrite` exigirá `name` y `cutoffDate`; `ActivityWrite` exigirá sus cinco
campos capturados. Cada propiedad obligatoria admitirá estructuralmente
`null` mediante un tipo unión OpenAPI 3.1, y los esquemas no establecerán
`additionalProperties: false`.

La descripción de cada esquema de escritura advertirá que el esquema publicado
es menos restrictivo que las reglas reales y que un cliente generado no debe
equiparar nulabilidad ni propiedades adicionales con validez de negocio. Las
descripciones de `name` documentarán el recorte de espacios laterales antes de
validar y persistir. `cutoffDate` será `string` con formato `date` cuando no sea
`null`.

### Reutilizar únicamente datos literales del fixture

El ejemplo agregado se obtendrá de `readResponse` eliminando recursivamente
claves cuyo nombre empieza por `$`. La colección y su caso vacío provendrán de
`collectionResponse`; `400` y `404`, de `errorEnvelopes`; y los ejemplos `422`,
de `validationChecks`, incluido V9.

El verificador comparará objetos deserializados, no texto YAML. También
comprobará la versión del fixture y respetará `$scopeNote`: los casos
enumerados prueban comportamientos distintos; la combinatoria de ausencia y
`null` corresponde a una prueba parametrizada de `writeSchemas`.

### Publicar SemVer del contrato sin versionar la ruta

`info.version` será `1.0.0` y su descripción indicará que sigue SemVer para el
contrato. Esto no añade prefijos ni parámetros de versión a las rutas.

### Hacer condicional el registro de decisiones faltantes

La auditoría final contrastará cada elemento con PRD y ADR vigentes. Si todas
las preguntas están resueltas, `x-decisions-missing` no aparecerá. Si surge una
pregunta no respondida, la implementación se detendrá y restaurará la extensión
con la pregunta concreta; no se empleará un valor por defecto de framework.

## Risks / Trade-offs

- La nulabilidad estructural y las propiedades adicionales pueden producir
  clientes generados más permisivos que el dominio. La advertencia obligatoria
  en ambos esquemas hace explícita esta consecuencia de ADR-009.
- Copiar manualmente ejemplos puede introducir deriva respecto del fixture. La
  verificación estructural literal reduce ese riesgo.
- `unknown` amplía un enumerado antes cerrado y puede afectar clientes
  exhaustivos. El cambio se publica con la versión contractual aprobada y queda
  señalado como incompatible en la propuesta.
- El fixture y su guía ya contienen cambios locales del usuario. Solo se
  corregirán inconsistencias objetivas necesarias para que v5.0.0 sea
  autoconsistente; no se ampliará el alcance deliberadamente acotado de
  `validationChecks`.
