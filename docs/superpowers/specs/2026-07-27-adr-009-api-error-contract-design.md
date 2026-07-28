# Diseño del contrato de errores del API

**Fecha:** 2026-07-27

**Estado:** Aprobado para redacción

**Alcance:** ADR-009 — Contrato de errores del API

## Objetivo

Definir un contrato de error pequeño y estable que permita generar el SDD y el
contrato OpenAPI sin reabrir las decisiones de ADR-006a ni ADR-006b. El diseño
cubre la validación de entrada del PRD §7.5, los campos de solo lectura, el
`400 Bad Request` sintáctico y el `404 Not Found` ya fijado por ADR-006a.

## Contexto determinante

RF-02 y el PRD §7.5 exigen rechazar entradas inválidas, identificar el campo y
la regla incumplida, y conservar el estado previo. ADR-006b distingue
enumerados estables legibles por máquina de textos en español legibles por
personas. Una sola escritura puede infringir varias reglas.

El producto tiene un único consumidor interno, un usuario concurrente y
esquemas de escritura planos. La interoperabilidad entre organizaciones no es
un requisito. Si la API se hiciera pública o tuviera varios clientes
independientes, aumentaría el valor de adoptar un estándar como
[RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html).

## Semántica diseñada

Una escritura JSON correctamente formada que incumple el PRD §7.5 devuelve
`422 Unprocessable Content`. Este código distingue el contenido
semánticamente inválido de una petición sintácticamente inválida, para la cual
se reserva `400 Bad Request`. El `400` usa la envolvente común con
`code: "malformed_request"` y `violations: []`.

La validación informa todas las infracciones detectadas en la petición. La
petición rechazada no modifica el estado previo.

La presencia de un campo de solo lectura se rechaza con `422`. El servidor no
ignora `id`, indicadores derivados ni otros campos reservados por el esquema
de lectura.

## Forma diseñada

Los errores `400`, `404` y `422` comparten una envolvente JSON con `code`,
`message` y `violations`. `code` es un enumerado estable en inglés. `message`
es texto para personas en el idioma español del producto.

Cada elemento de `violations` contiene `field`, `rule` y `message`. `field`
usa el nombre `lowerCamelCase` exacto de ADR-006b. `rule` es un enumerado
estable y cerrado en inglés. El segundo `message` explica cómo corregir esa
infracción. Los consumidores automatizan sobre `code` y `rule`, no sobre los
mensajes.

Las reglas iniciales son `required`, `positive`, `non_negative`,
`range_0_100` y `read_only`.

Agregar un valor a `rule` no es compatible hacia atrás. Un consumidor que
recibe un valor desconocido conserva `field`, muestra `message` y trata la
infracción como validación genérica sin fallar.

Ejemplo mínimo:

```json
{"code":"validation_failed","message":"La entrada contiene errores.",
"violations":[{"field":"bac","rule":"positive",
"message":"Debe ser positivo."}]}
```

El `404` usa `code: "not_found"`, un mensaje humano y `violations: []`.
El `400` usa `code: "malformed_request"`, un mensaje humano y
`violations: []`.

Ningún cuerpo de error incluye mensajes de excepción, trazas, nombres internos
ni detalles del framework. Este diseño no decide logging u observabilidad.
Tampoco decide códigos de estado exitosos.

## Alternativas consideradas

- **RFC 9457 con una extensión de validación:** aportaría un formato estándar
  y sería razonable para una API pública. Sus miembros, tipos de problema y
  documentación asociada añaden contrato sin un consumidor presente.
- **`400` para toda entrada inválida:** reduciría la cantidad de códigos, pero
  mezclaría errores de sintaxis con instrucciones semánticamente inválidas.
- **Informar solo la primera infracción:** simplificaría el recorrido de
  validación, pero obligaría al usuario a repetir ciclos de corrección.

## Consecuencias

- El cliente puede asociar todas las infracciones con sus campos en un intento.
- Los tres códigos comparten una forma y el cliente necesita un único manejador
  de errores.
- OpenAPI debe declarar la envolvente, los enumerados y `violations`.
- Acumular infracciones exige ejecutar todas las validaciones independientes.
- El formato propio se convierte en un contrato que debe mantenerse.
- Un requisito de localización obliga a revisar los mensajes en español.
- Validaciones costosas o dependientes podrían justificar volver a evaluar la
  acumulación.

## Verificación diseñada

Pruebas de contrato usan `evm-fixture.json` como artefacto de referencia.
Comprueban `422`, estado previo intacto y `field`, `rule` y `message` para cada
caso de `validationChecks`. Un caso compuesto verifica que una respuesta
contiene todas las infracciones detectadas. Otro rechaza `cpi` con
`read_only`.

Pruebas de contrato verifican que el `404` use la misma envolvente con
`violations` vacío. Casos representativos confirman que ningún cuerpo expone
excepciones, trazas ni detalles del framework.

## Límites y entregable

La redacción posterior modifica únicamente
`docs/adr/009-contrato-errores-api.md`. No actualiza el PRD, ADRs previos,
OpenSpec ni `evm-fixture.json`, porque este cambio dedicado registra una
decisión técnica derivada de fuentes ya vigentes.

El límite revisado para ADR-009 es de 510 palabras.
