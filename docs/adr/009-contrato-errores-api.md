# ADR-009 — Contrato de errores del API

**Estado:** Aceptada · **Fecha:** 2026-07-27
**Relacionada con:** RF-02; reglas del PRD §7.5
**Depende de:** ADR-006a y ADR-006b

## Contexto

RF-02 y el PRD §7.5 exigen rechazar entradas inválidas, identificar el campo y la regla incumplida, y conservar el estado previo. ADR-006a fija `404 Not Found` para recursos inexistentes. ADR-006b separa enumerados estables legibles por máquina de textos en español para personas. Una escritura puede infringir varias reglas. El consumidor interno favorece una forma simple.

## Decisión

Una escritura JSON sintácticamente correcta que incumple el PRD §7.5 devuelve `422 Unprocessable Content`.

`400 Bad Request` cubre JSON malformado y JSON bien formado con un valor de tipo incompatible con el esquema de escritura de ADR-006b.

La capa estructural comprueba sintaxis JSON y, en valores no nulos, tipos y formatos. Negocio comprueba obligatoriedad, restricciones numéricas, campos de lectura, propiedades desconocidas y nombres normalizados; sus infracciones producen `422`.

Un `null` explícito en un campo obligatorio se trata como ausencia de valor: devuelve `422` con `rule: "required"`, no `400` por tipo incompatible.

Por ello, los esquemas de petición admiten `null` en campos obligatorios y no cierran las propiedades antes de negocio. Esta permisividad distingue `required`, `read_only` y `unknown` sin validarlas para el dominio.

El `400` usa la misma envolvente con `code: "malformed_request"` y `violations: []`.

Se clasifica como `400` porque el fallo pertenece a la interpretación del esquema de entrada, anterior a las reglas de negocio del PRD §7.5.

La validación reporta todas las infracciones detectadas en la petición.

La petición rechazada no altera el estado previo.

Todo campo de solo lectura presente en una escritura se rechaza con `422`.

Ningún campo de solo lectura se ignora.

Una propiedad ajena a los esquemas de escritura y lectura se rechaza con `422`, conserva su nombre en `field` y produce `rule: "unknown"`. No se ignora.

Se recortan los espacios laterales de `name` antes de validar y persistir. Un nombre compuesto solo por espacios queda vacío e incumple `required`; los interiores se conservan.

El cuerpo JSON contiene `code`, `message` y `violations`.

`code` es un enumerado estable en inglés.

`message` es texto humano en español.

Cada elemento de `violations` contiene `field`, `rule` y `message`.

`field` usa el nombre `lowerCamelCase` exacto de ADR-006b para campos conocidos; una propiedad desconocida conserva el nombre recibido.

`rule` es un enumerado estable en inglés.

El conjunto de `rule` es cerrado.

El `message` de la infracción explica la corrección en español.

Los consumidores automatizan sobre `code` y `rule`, no sobre `message`.

Agregar un valor a `rule` no es compatible hacia atrás.

Ante un valor desconocido, el consumidor conserva `field`.

También muestra `message`.

La infracción se trata como validación genérica sin fallar.

Las reglas iniciales son `required`, `positive`, `non_negative`, `range_0_100`, `read_only` y `unknown`.

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
- **Esquema estricto como barrera automática:** describiría entradas válidas, pero adelantaría `400` a los `422` de negocio.
- **Ignorar propiedades desconocidas o preservar espacios laterales:** toleraría imprecisiones, pero ocultaría errores y nombres sin contenido.

## Consecuencias

- El usuario puede corregir todos los campos afectados en un intento.
- OpenAPI debe declarar la envolvente, sus enumerados y `violations`.
- `400`, `404` y `422` comparten una forma. El consumidor necesita un único manejador de errores.
- Los errores de sintaxis o deserialización no generan infracciones por campo ni amplían el conjunto cerrado de `rule`.
- Acumular infracciones exige ejecutar todas las validaciones independientes.
- El formato propio exige mantenimiento.
- La localización futura exigiría revisar los mensajes en español.
- Validaciones costosas o dependientes obligarían a reconsiderar la acumulación.
- Varios consumidores externos o una exigencia de interoperabilidad obligarían a reconsiderar RFC 9457.
- El esquema publicado es menos restrictivo que las reglas reales. Un cliente generado no debe equiparar nulabilidad o propiedades adicionales con validez de negocio.
- Un validador automático debe reservar `400` para sintaxis, tipo y formato, y dejar pasar o mapear las demás infracciones a la envolvente `422` de este ADR.
- Añadir `unknown` al conjunto cerrado de `rule` no es compatible hacia atrás.
- Recortar espacios laterales puede persistir un nombre distinto del recibido.

## Verificación

Pruebas de contrato contrastan `contracts/evm/evm-fixture.json`: cada `validationChecks` devuelve `422`, `field`, `rule`, mensaje humano y estado intacto. Casos nuevos cubren ausencia y `null` de cada campo obligatorio, una propiedad desconocida con `unknown`, campos de lectura con `read_only` y nombres con espacios laterales o solo espacios. Un caso compuesto acumula infracciones. Una prueba con `{"bac":"diez"}` devuelve `400`, `malformed_request`, `violations: []` y conserva el estado. Otros casos cubren `404` y excluyen detalles internos.
