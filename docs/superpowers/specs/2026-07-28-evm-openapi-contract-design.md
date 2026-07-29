# Diseño del contrato OpenAPI EVM

**Fecha:** 2026-07-28

**Estado:** Aprobado para ejecución por el encargo

**Entregable:** `contracts/evm/openapi.yaml`

## Objetivo

Transcribir a OpenAPI 3.1.0 el API decidido por `docs/PRD.md`,
ADR-003, ADR-004, ADR-006a, ADR-006b, ADR-007 y ADR-009, usando
`contracts/evm/evm-fixture.json` como fuente literal de ejemplos. El contrato
no completará decisiones ausentes mediante convenciones de framework o
preferencias de implementación.

## Enfoque

El entregable será un único archivo YAML junto al fixture canónico. Separará
los esquemas de escritura y lectura, reutilizará un único objeto de índice para
`cpi` y `spi`, y reutilizará una sola envolvente de error para `400`, `404` y
`422`.

Las rutas se limitarán a los cuatro recursos decididos en ADR-006a. El contrato
incluirá únicamente las operaciones cuya semántica puede derivarse sin elegir
una alternativa ausente:

- crear proyectos y actividades en sus colecciones, con `201` y la
  representación de lectura;
- obtener la foto analítica de un proyecto, con `200`;
- eliminar proyectos y actividades, con `204` y sin cuerpo.

`GET /projects` quedará fuera porque ADR-006a fija su propósito, pero no la
forma de la colección. Las operaciones de edición quedarán fuera porque las
fuentes no eligen entre `PUT` y `PATCH` ni definen semántica de reemplazo o
actualización parcial.

## Esquemas

`ProjectWrite`, `ProjectRead`, `ActivityWrite` y `ActivityRead` serán esquemas
distintos. `ActivityWrite` contendrá exclusivamente `name`, `bac`,
`plannedProgress`, `actualProgress` y `ac`; `ActivityRead` añadirá `id` y los
ocho indicadores. `ProjectRead` contendrá `id`, `name` y `cutoffDate`, mientras
que `ProjectWrite` excluirá `id`.

`IndexResult` contendrá siempre `value`, `display`, `status` y `label`.
`value` y `display` admitirán `null`; el objeto no. `status` tendrá exactamente
`unfavorable`, `neutral`, `favorable` y `not_evaluable`.

`Error` contendrá `code`, `message` y `violations`. Cada infracción contendrá
`field`, `rule` y `message`; `rule` tendrá exactamente `required`, `positive`,
`non_negative`, `range_0_100` y `read_only`.

Los porcentajes de escritura usarán límites inclusivos de 0 y 100, `bac` un
límite inferior exclusivo de cero y `ac` un límite inferior inclusivo de cero.
No se añadirán formatos, tamaños de entero, longitudes máximas ni políticas de
propiedades desconocidas que las fuentes no decidan.

## Ejemplos y respuestas

El ejemplo de `GET /projects/{projectId}` será `readResponse` después de
eliminar recursivamente toda clave cuyo nombre empiece por `$`. Los ejemplos de
escritura y lectura reutilizarán objetos completos del fixture sin cambiar
nombres ni números.

Las respuestas de error reutilizarán literalmente `errorEnvelopes`. El `422`
también incluirá V9 completo para evidenciar la acumulación de las cinco reglas.
Cada operación declarará únicamente los errores que le sean aplicables según
los recursos que resuelve y si procesa o no un cuerpo JSON.

## Decisiones faltantes

El YAML terminará con la extensión `x-decisions-missing`, titulada
«Decisiones faltantes». Cada entrada contendrá la pregunta concreta, el motivo
por el que impide cerrar el contrato, el ADR que debe resolverla y cualquier
insinuación del fixture expresamente marcada como no decisoria.

Como mínimo se registrarán:

- la forma de respuesta de `GET /projects`;
- el verbo y la semántica de edición de proyectos y actividades;
- la obligatoriedad de los cuatro campos numéricos de `ActivityWrite`;
- el tipo y formato de `cutoffDate`;
- la versión documental exigida por `info.version`;
- el tratamiento de propiedades de escritura desconocidas y de nombres
  compuestos solo por espacios.

Para mantener válido el documento mientras falta `info.version`, ese campo
usará una cadena explícita que indique que la decisión está pendiente; no
representará versionado del API ni aparecerá en las rutas.

## Verificación

La verificación validará el YAML contra el esquema oficial de OpenAPI 3.1,
resolverá todas las referencias, comparará programáticamente cada ejemplo con
el bloque exacto del fixture y auditará rutas, operaciones, campos,
enumerados, nulabilidad y restricciones. También ejecutará `git diff --check`
y confirmará que la rama no contiene cambios locales ajenos.
