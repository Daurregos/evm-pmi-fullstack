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
