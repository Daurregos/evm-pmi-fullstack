# ADR-003 — Representación de dinero, porcentajes y redondeo

**Estado:** Aceptada · **Fecha:** 2026-07-26

**Relacionada con:** RF-03, RF-04, RF-05, RF-07, RF-08; reglas del PRD §§7.1, 7.2, 7.4 y 7.5

**Depende de:** ninguno

## Contexto

RF-03, RF-04, RF-05 y RF-08 exigen resultados, consolidación e interpretaciones coherentes. Las §§7.1 y 7.4 del PRD exigen sumar antes de calcular ratios, evitar redondeo intermedio, redondear la presentación y clasificar CPI y SPI sin redondear; §7.5 admite porcentajes de 0 % a 100 %.

## Decisión

Los montos usan decimal base diez y los porcentajes fracciones internas entre cero y uno; ningún resultado intermedio se cuantiza o redondea y se usa precisión suficiente para garantizar el redondeo final matemáticamente correcto, incluso de cocientes no terminantes; CPI y SPI se clasifican sin redondear; la presentación redondea montos e índices a dos decimales y el avance a porcentaje entero, aleja de cero los empates exactos y antepone `<` a 0,99 o `>` a 1,01 solo si el valor completo está fuera de la banda.

## Alternativas consideradas

- **Punto flotante binario:** simplifica, pero sus aproximaciones alteran redondeos y clasificaciones límite.
- **Enteros escalados:** dan montos exactos, pero porcentajes, cocientes no terminantes e índices requerirían distintas escalas y conversiones.
- **Clasificar el índice mostrado:** evita marcadores, pero amplía la banda neutral efectiva y cambia estados de §7.4.

## Consecuencias

- Las fórmulas reciben porcentajes normalizados; la validación conserva 0 % a 100 %.
- PV y EV sin cuantizar se suman antes de derivar el consolidado; CPI y SPI se clasifican sin redondear contra la banda inclusiva 0,99–1,01.
- Persistencia, serialización y pruebas preservan decimales y precisión suficiente; el tipo y formato externos quedan para ADR-006.
- Los marcadores aparecen solo cuando la proyección en 0,99 o 1,01 oculta un valor completo fuera de la banda.
- Como costos, sumar montos redondeados por actividad puede diferir por centavos del consolidado y los marcadores complican la presentación.

## Verificación

Pruebas unitarias cubren fracciones de centavo, cocientes no terminantes sin cuantización intermedia y los empates `1,005 → 1,01` y `−1,005 → −1,01`. Casos 0,98912 → `<0,99` desfavorable, 0,99000 → `0,99` neutral, 1,01000 → `1,01` neutral y 1,01088 → `>1,01` favorable verifican presentación y clasificación. Pruebas de integración verifican que persistencia y salida conservan resultados y round-trips observables, sin decidir el contrato externo.
