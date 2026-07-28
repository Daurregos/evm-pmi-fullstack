# ADR-003 — Representación de dinero, porcentajes y redondeo

**Estado:** Aceptada · **Fecha:** 2026-07-26

**Relacionada con:** RF-03, RF-04, RF-05, RF-07, RF-08; reglas del PRD §§7.1, 7.2, 7.4 y 7.5

**Depende de:** ninguno

## Contexto

RF-03, RF-04, RF-05 y RF-08 exigen resultados, consolidación e interpretaciones coherentes. Las §§7.1 y 7.4 del PRD exigen sumar antes de calcular ratios, evitar redondeo intermedio, redondear la presentación y clasificar CPI y SPI sin redondear; §7.5 admite porcentajes de 0 % a 100 %.

## Decisión

Los montos usan decimal base diez. Los porcentajes se representan internamente como fracciones entre cero y uno. Ningún resultado intermedio se cuantiza ni redondea; los cálculos usan precisión suficiente para garantizar el redondeo final matemáticamente correcto, incluso de cocientes no terminantes. La presentación clasifica CPI y SPI sin redondearlos, redondea montos e índices a dos decimales y el avance a porcentaje entero, aleja de cero los empates exactos y antepone `<` a 0,99 o `>` a 1,01 solo si el valor completo está fuera de la banda.

## Alternativas consideradas

- **Punto flotante binario:** simplifica, pero sus aproximaciones pueden alterar redondeos y clasificaciones límite.
- **Enteros escalados:** dan montos exactos, pero porcentajes, cocientes no terminantes e índices requerirían distintas escalas y conversiones.
- **Clasificar el índice mostrado:** evita marcadores, pero amplía la banda neutral efectiva y cambia estados de §7.4.

## Consecuencias

- Las fórmulas reciben porcentajes normalizados; la validación conserva 0 % a 100 %.
- PV y EV sin cuantizar se suman antes de derivar el consolidado; CPI y SPI se clasifican sin redondear contra la banda inclusiva 0,99–1,01.
- Persistencia, serialización y pruebas preservan decimales y precisión suficiente; el tipo y formato externos quedan para ADR-006.
- Los marcadores aparecen solo cuando la proyección en 0,99 o 1,01 oculta un valor completo fuera de la banda.
- En la tabla de actividades, la suma de los montos mostrados ya redondeados puede diferir por centavos del total que muestra el resumen consolidado; el líder del proyecto podría interpretarlo como un error del sistema.
- Este ADR no define el tipo ni el formato con que los valores cruzan el API. ADR-004 decide únicamente la semántica del indicador no evaluable; el tipo de dato en el cable pertenece a ADR-006.

## Verificación

Pruebas unitarias y de integración verifican contra `contracts/evm/evm-fixture.json` los resultados esperados de precisión, redondeo, presentación, clasificación y round-trips observables, sin decidir el contrato externo.
