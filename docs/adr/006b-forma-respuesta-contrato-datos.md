# ADR-006b — Forma de la respuesta y contrato de datos

**Estado:** Aceptada · **Fecha:** 2026-07-27

**Relacionada con:** RF-02–RF-09; glosario del PRD §3 y reglas §§7.1–7.5

**Depende de:** ADR-003, ADR-004 y ADR-006a

## Contexto

ADR-006a fija una lectura con proyecto, actividades y consolidado. ADR-003 exige precisión decimal interna y presentar CPI y SPI sin perder su clasificación. ADR-004 usa `null` para indicadores no evaluables. RF-02 limita la escritura a cinco datos. RF-06 exige leer trece campos de dominio por actividad. OpenAPI y `contracts/evm/evm-fixture.json` necesitan una forma única.

## Decisión

Los nombres usan inglés en `lowerCamelCase`. Los acrónimos EVM conservan minúsculas exactas.

La envolvente heredada de ADR-006a denomina sus bloques `project`, `activities` y `summary`. `project` contiene `id`, `name` y `cutoffDate`. Cada actividad leída contiene `id`, `name`, `bac`, `plannedProgress`, `actualProgress`, `ac`, `pv`, `ev`, `cv`, `sv`, `cpi`, `spi`, `eac` y `vac`. `summary` contiene `bac`, `pv`, `ev`, `ac`, `cv`, `sv`, `cpi`, `spi`, `eac`, `vac`, `progress` y `activitiesWithEvAndZeroAc`.

Los identificadores de proyecto y actividad son enteros tanto en los campos `id` de las representaciones como en los parámetros `projectId` y `activityId` de las rutas definidas por ADR-006a.

Cada elemento de `GET /projects` contiene el `id` entero y `name`; omite `cutoffDate` porque la colección abastece solo el selector.

`cutoffDate` cruza el cable como cadena `format: date`: un `full-date` de RFC 3339 con forma `YYYY-MM-DD`.

Los porcentajes cruzan el API entre 0 y 100. El backend los convierte a la fracción interna de ADR-003.

Los valores cuantitativos se serializan como números JSON. El contrato acepta la aproximación IEEE-754 del consumidor. El backend conserva su aritmética decimal.

Los montos y `progress` cruzan el API sin redondear; el frontend aplica al mostrarlos el redondeo de presentación fijado por ADR-003.

`cpi` y `spi` contienen siempre `value`, `display`, `status` y `label`. La forma es idéntica en actividades y consolidado. `value` entrega el número sin redondear. `display` entrega la representación resuelta por el backend. `status` admite `unfavorable`, `neutral`, `favorable` o `not_evaluable`. `status` es un enumerado legible por máquina, en inglés y estable; `label` es texto legible por personas en el idioma español del producto y entrega la interpretación del PRD.

Un índice no evaluable usa `null` en `value` y `display`. Su `status` es `not_evaluable`. Su `label` es `no evaluable`. El frontend mapea `neutral` y `not_evaluable` al mismo color según RF-08, pero el contrato conserva la distinción del dominio.

Los demás indicadores usan un número o `null`. Los montos nunca incluyen marcador.

La escritura de proyecto contiene exactamente `name` y `cutoffDate`; ambos son obligatorios al crear y reemplazar. La escritura de actividad contiene exactamente `name`, `bac`, `plannedProgress`, `actualProgress` y `ac`. Los cinco campos son obligatorios en toda creación y reemplazo.

## Alternativas consideradas

- **Cadenas decimales:** preservarían exactitud en el cable, pero exigirían conversiones para gráficas y operaciones básicas.
- **Campos paralelos para CPI y SPI:** producirían objetos planos, pero separarían valor, presentación e interpretación.
- **Valores numéricos opcionales o predeterminados:** dejarían la actividad incompleta o inventarían datos para calcular indicadores.
- **Fecha como instante o época:** aportaría hora y zona que la foto vigente no necesita y podría desplazar el día de corte.

## Consecuencias

- OpenAPI distingue los esquemas de escritura y lectura.
- El frontend no reproduce la banda neutral ni los marcadores de ADR-003.
- `display` viaja aunque coincida con el redondeo simple. Esto aumenta el payload y la evidencia del fixture.
- La respuesta contiene dos formas de indicador: `cpi` y `spi` son objetos con valor, presentación e interpretación, mientras los otros seis son escalares. El consumidor maneja ambas formas porque solo CPI y SPI tienen banda y marcador.
- Un requisito futuro de varios idiomas obligaría a revisar si `label` sigue viajando desde el backend o se deriva en el cliente desde `status`.
- Los consumidores pueden observar aproximaciones binarias. Un intercambio financiero exacto obligaría a revisar el uso de números JSON.
- Los identificadores son secuenciales y, por tanto, adivinables y enumerables. Esto sería inaceptable en un recurso expuesto públicamente, pero resulta irrelevante en una herramienta interna sin control de acceso.
- Crear o reemplazar exige todos los datos capturados; una ausencia o `null` se informa como `required` según ADR-009.
- `cutoffDate` conserva el día, pero no expresa hora ni zona.
- La colección usa una representación de proyecto menor que la lectura individual.

## Verificación

Pruebas de contrato validan contra `contracts/evm/evm-fixture.json` nombres, bloques, rango 0–100, tipos JSON y esquemas distintos. Comprueban `{id, name}` en la colección, `name` y `cutoffDate` obligatorios en proyecto, los cinco campos obligatorios en actividad y `cutoffDate` como `YYYY-MM-DD`. El fixture conserva para CPI y SPI el valor completo, `display`, `status` y `label`; los casos cubren actividad, consolidado, marcadores y no evaluabilidad. Ningún monto lleva marcador.
