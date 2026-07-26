# ADR-003 — Representación de dinero, porcentajes y redondeo

**Estado:** Aceptada · **Fecha:** 2026-07-26

**Relacionada con:** RF-03, RF-04, RF-05, RF-07; reglas del PRD §§7.1, 7.2, 7.4 y 7.5

**Depende de:** ninguno

## Contexto

RF-03 y RF-04 exigen resultados por actividad y consolidados; §7.1 ordena sumar magnitudes antes de calcular ratios. El PRD §7.4 exige conservar precisión en cálculos encadenados, redondear únicamente lo presentado y clasificar CPI y SPI usando el valor mostrado; §7.5 admite porcentajes entre 0 % y 100 %. Una representación técnica imprecisa o un redondeo anticipado puede alterar totales por centavos y cambiar estados cerca de la banda neutral.

## Decisión

Los montos se representan en decimal base diez y los porcentajes internamente como fracciones entre cero y uno; todos los cálculos por actividad y consolidados conservan precisión completa, y cada resultado final se redondea exclusivamente al proyectarlo para presentación conforme al PRD §7.4.

## Alternativas consideradas

- **Punto flotante binario:** simplificaría la implementación y sería habitual para una aplicación pequeña, pero sus aproximaciones pueden cambiar redondeos y clasificaciones en valores límite.
- **Enteros escalados:** representarían montos exactamente, pero porcentajes, índices y resultados encadenados requerirían escalas distintas y conversiones adicionales.
- **Redondear PV y EV antes de consolidar:** haría coincidir cada suma visual, pero acumularía diferencias y contradiría la consolidación y precisión exigidas por §§7.1 y 7.4.

## Consecuencias

- Las fórmulas reciben porcentajes normalizados entre cero y uno, mientras la validación conserva el rango de negocio de 0 % a 100 %.
- PV y EV completos se suman antes de derivar y redondear el consolidado; CPI y SPI se clasifican después de redondear su proyección visible.
- Persistencia, serialización y pruebas deben preservar semántica decimal, lo que restringe representaciones técnicas permisibles.
- Como costo visible, la suma de montos redondeados por actividad puede diferir por centavos del consolidado calculado desde valores completos.
- La codificación externa de porcentajes queda para ADR-006.

## Verificación

Pruebas unitarias usan valores con fracciones de centavo para comprobar que PV y EV no se redondean antes de consolidarse. Casos a ambos lados de 0,99 y 1,01 comprueban que el índice mostrado y su clasificación coinciden. Pruebas de integración verifican que las fronteras de persistencia y salida no introducen punto flotante binario ni redondeo intermedio.
