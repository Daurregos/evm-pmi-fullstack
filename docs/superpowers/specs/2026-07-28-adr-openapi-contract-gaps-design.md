# Diseño de cierre de huecos del contrato OpenAPI

**Fecha:** 2026-07-28

**Estado:** Aprobado para redacción

**Alcance:** ADR-006a, ADR-006b y ADR-009

## Objetivo

Cerrar las decisiones que el contrato OpenAPI no pudo derivar sin reabrir las
decisiones aceptadas ni modificar todavía `contracts/evm/openapi.yaml` o
`contracts/evm/evm-fixture.json`. La instrucción específica de este encargo
ubica estas decisiones de contrato en los ADR y mantiene `docs/PRD.md`
inalterado.

## Problemas verificados

ADR-006a no fija verbo ni semántica de edición y no concreta la respuesta de
`GET /projects`. ADR-006b solo declara la escritura de actividad, no resuelve la
obligatoriedad de sus cuatro valores numéricos y deja `cutoffDate` sin
representación de cable. ADR-009 decide resultados para `null` y campos de solo
lectura, pero no separa validación estructural y de negocio, ni trata
propiedades desconocidas o nombres compuestos solo por espacios.

La sección `x-decisions-missing` de OpenAPI confirma siete huecos. La revisión
añade la falta de un esquema de escritura de proyecto y explicita la
inconsistencia de validación. El fixture solo insinúa formas y casos; no decide
ninguno. `info.version` exige una convención documental, no un ADR.

## Diseño de recursos y escrituras

Proyecto y actividad se editan con `PUT` sobre sus URI de miembro. `PUT`
reemplaza la totalidad de los campos editables, no la representación de
lectura. Todo campo editable ausente incumple `required`; no se conserva el
valor anterior ni se aplica un valor predeterminado. Un campo de solo lectura
presente conserva el tratamiento `422 read_only` de ADR-009.

`GET /projects` devuelve un arreglo JSON desnudo. Cada elemento contiene solo
`id` y `name`, porque su único consumidor conocido es el selector del
dashboard. No se introduce una envolvente ni metadatos de paginación.

## Diseño de datos

La escritura de proyecto contiene exactamente `name` y `cutoffDate`; ambos son
obligatorios en creación y reemplazo. La escritura de actividad contiene
exactamente `name`, `bac`, `plannedProgress`, `actualProgress` y `ac`; los cinco
son obligatorios en toda creación y reemplazo.

`cutoffDate` cruza el cable como una cadena OpenAPI `format: date`, es decir, un
`full-date` de RFC 3339 con forma `YYYY-MM-DD`, sin hora ni zona horaria.

## Diseño de validación y errores

`400 malformed_request` queda limitado a JSON malformado y valores no nulos
cuyo tipo o formato de cable sea incompatible. Las reglas de contenido se
evalúan como negocio y producen `422 validation_failed`: ausencia o `null` de
un campo obligatorio, positividad, no negatividad, rango, solo lectura,
propiedades desconocidas y nombre vacío tras normalización.

El esquema de petición debe permitir `null` en campos obligatorios y no cerrar
las propiedades antes de la validación de negocio. Así el servidor distingue
un campo de lectura conocido de una propiedad arbitraria y devuelve la
infracción pactada. Esta permisividad estructural no convierte esas entradas en
válidas para el dominio.

Una propiedad arbitraria se rechaza con `422`; produce una infracción cuyo
`field` conserva literalmente el nombre recibido y cuya nueva regla cerrada es
`unknown`. Ampliar el enumerado `rule` no es compatible hacia atrás.

Los nombres de proyecto y actividad se normalizan recortando solo espacios
iniciales y finales antes de validar y persistir. Un resultado vacío incumple
`required`; los espacios interiores no se colapsan.

## Costos aceptados

- `PUT` obliga al cliente a enviar todos los campos editables y hace más
  costosas las ediciones pequeñas.
- El arreglo desnudo no puede incorporar metadatos sin cambiar su forma.
- El esquema publicado acepta estructuralmente valores que negocio rechaza.
  Los clientes generados no deben interpretar nulabilidad o propiedades
  adicionales como validez de negocio. Un validador automático de peticiones
  debe limitar `400` a sintaxis, tipo y formato, y dejar pasar o mapear las
  demás reglas a `422` con la envolvente de ADR-009.
- Recortar nombres cambia el valor persistido respecto del texto recibido.
- Añadir `unknown` al conjunto cerrado de `rule` es incompatible hacia atrás.

## Alternativas descartadas

- `PATCH` con JSON Merge Patch o JSON Patch permitiría cambios parciales, pero
  introduciría un tipo de medio y reglas de parche sin necesidad para el
  formulario completo del consumidor actual.
- Una envolvente de colección facilitaría paginación futura, pero añade una
  forma que el selector actual no consume.
- Ignorar propiedades desconocidas o conservar nombres de solo espacios
  ocultaría errores de entrada y debilitaría la respuesta por campo de RF-02.
- Un esquema estricto usado como barrera automática produciría `400` antes de
  que negocio pudiera cumplir los `422` ya aceptados.

## Versión documental

Al regenerar OpenAPI, `info.version` será `1.0.0`. Sigue SemVer para el contrato:
major para cambios incompatibles, minor para adiciones compatibles y patch
para correcciones documentales sin cambio de superficie. No versiona las URI.

## Límites y verificación

La redacción modifica únicamente los tres ADR. No modifica PRD, OpenSpec,
`AGENTS.md`, OpenAPI ni fixture. Las adiciones serán puntuales; se preservarán
las decisiones aceptadas y se declarará cada costo nuevo en Consecuencias.

El límite ordinario de 450 palabras se conservará cuando no obligue a eliminar
fundamentos aceptados. Como ADR-006b y ADR-009 ya tienen 627 y 595 palabras, y
ADR-006a tiene 448 antes de estas decisiones, la verificación informará el
conteo final y justificará el aumento mínimo necesario en vez de reescribir
secciones ajenas.

La revisión final comprobará cada decisión contra el diff, ejecutará
`git diff --check`, confirmará que OpenAPI y el fixture no cambiaron y entregará
la lista exacta de modificaciones futuras para ambos artefactos.
