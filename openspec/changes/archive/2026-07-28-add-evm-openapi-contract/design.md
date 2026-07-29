## Context

`docs/PRD.md` define el comportamiento de producto; ADR-003, ADR-004,
ADR-006a, ADR-006b, ADR-007 y ADR-009 distribuyen la forma técnica del API; y
`contracts/evm/evm-fixture.json` contiene los ejemplos canónicos. Ninguna de
esas fuentes es un contrato OpenAPI ejecutable y algunas dejan preguntas
abiertas que el generador no puede contestar.

El cambio es documental. No existe todavía backend, frontend ni toolchain de
validación en el repositorio. El contrato debe ser útil para ambos lados sin
convertirse en una nueva fuente de decisiones.

## Goals / Non-Goals

**Goals:**

- producir un único YAML OpenAPI 3.1.0 válido y con referencias resolubles;
- conservar trazabilidad directa hacia PRD, ADR y fixture;
- expresar los esquemas de escritura, lectura, índices y errores ya decididos;
- usar ejemplos literales y verificables;
- hacer visibles las decisiones ausentes, incluida la omisión de operaciones
  que no puedan definirse responsablemente.

**Non-Goals:**

- decidir verbos de edición, forma del selector o detalles de tipos no
  establecidos;
- añadir rutas, consultas, paginación, filtros, orden, versionado,
  autenticación, cabeceras o servidores;
- modificar PRD, ADR, fixture o comportamiento de producto;
- implementar el API o sus consumidores.

## Decisions

### Ubicación y estructura

El documento se crea como `contracts/evm/openapi.yaml`, junto al fixture que
alimenta sus ejemplos. Se usan componentes reutilizables para parámetros,
esquemas, ejemplos, cuerpos de petición y respuestas, manteniendo todo en el
mismo archivo.

Separar el contrato en varios YAML facilitaría editar componentes, pero
incumpliría el formato exigido y debilitaría la evaluación del entregable.

### Límite de la superficie

Se declaran las cuatro rutas de ADR-006a. Se incluyen `POST` sobre las
colecciones, `GET` sobre el proyecto analítico y `DELETE` sobre miembros. Los
códigos exitosos son `201`, `200` y `204`, derivados de creación con
representación, lectura con cuerpo y eliminación sin cuerpo.

`GET /projects` no se declara hasta conocer su cuerpo. Tampoco se declaran
ediciones hasta que ADR-006a elija verbo y semántica. Usar convenciones REST
por intuición produciría un contrato aparentemente completo pero no aprobado.

### Modelado de datos

Los esquemas `ProjectWrite`, `ProjectRead`, `ActivityWrite` y `ActivityRead`
permanecen separados. No se usa `readOnly`, porque ADR-009 necesita detectar la
presencia de campos de lectura como una infracción de negocio y ADR-006b ya
eligió esquemas distintos.

`IndexResult` se referencia tanto desde actividad como desde consolidado.
El objeto y sus cuatro miembros son obligatorios; únicamente `value` y
`display` aceptan `null` mediante tipos unión de JSON Schema 2020-12.

No se fija `additionalProperties`, formato de entero, tamaño, signo, precisión
decimal ni formato de fecha. Las restricciones numéricas se limitan a las que
define el PRD.

### Errores

`Error` es la única envolvente. `code` enumera `malformed_request`,
`not_found` y `validation_failed`; `Violation.rule` usa el conjunto cerrado de
ADR-009. Las respuestas reutilizables conservan el mismo esquema, pero cada
operación referencia solo los estados que le corresponden.

### Ejemplos literales

Un verificador temporal cargará el JSON, eliminará recursivamente claves con
prefijo `$` de `readResponse` y comparará el resultado con el ejemplo analítico
del YAML. El mismo verificador contrastará los ejemplos de
`errorEnvelopes` y V9. De esta manera, una diferencia de número, nombre,
nulabilidad o cantidad de infracciones falla de forma objetiva.

### Registro de huecos

La última clave del documento será `x-decisions-missing`, con título
«Decisiones faltantes». Es una extensión válida de OpenAPI y mantiene los
huecos dentro del único archivo solicitado. Cada elemento identifica pregunta,
impacto, ADR responsable e insinuación no normativa del fixture cuando exista.

## Risks / Trade-offs

- [La superficie queda incompleta por diseño] → Cada operación omitida se
  registra con la decisión exacta que la desbloquea.
- [Una cadena provisional en `info.version` puede confundirse con versionado
  del API] → La descripción y el registro de huecos aclaran que solo satisface
  el miembro obligatorio de OpenAPI y no aparece en rutas.
- [Un validador puede aceptar el YAML sin comprobar la fidelidad del fixture]
  → La validación combina esquema OpenAPI, resolución de referencias y
  comparaciones semánticas propias.
- [Los esquemas permiten aspectos aún no decididos] → Se omiten restricciones
  silenciosas y se documentan los huecos en lugar de endurecer el contrato.

## Migration Plan

No hay migración de runtime. El archivo se añade de forma aditiva. Si una
validación detecta contradicción con una fuente superior, se corrige o escala
esa fuente antes de completar el contrato. Revertir el cambio consiste en
retirar el YAML y sus artefactos OpenSpec sin alterar datos ni servicios.

## Open Questions

- ¿Qué forma exacta devuelve `GET /projects`? Debe cerrarla ADR-006b.
- ¿Las ediciones usan `PUT` o `PATCH` y son totales o parciales? Debe cerrarlo
  ADR-006a.
- ¿Son obligatorios `bac`, `plannedProgress`, `actualProgress` y `ac` en toda
  escritura? Deben cerrarlo ADR-006b y ADR-009.
- ¿Qué tipo y formato de cable tiene `cutoffDate`? Debe cerrarlo ADR-006b; el
  fixture solo insinúa una cadena ISO `YYYY-MM-DD`.
- ¿Qué versión identifica el documento? Debe cerrarlo ADR-006a o una decisión
  documental equivalente.
- ¿Cómo se tratan propiedades desconocidas y nombres formados solo por
  espacios? Debe cerrarlo ADR-009.
