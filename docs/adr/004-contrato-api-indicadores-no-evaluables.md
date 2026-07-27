# ADR-004 — Contrato de API para indicadores no evaluables

**Estado:** Aceptada · **Fecha:** 2026-07-26

**Relacionada con:** RF-05, RF-07, RF-08; reglas del PRD §§7.1–7.3 y definición de terminado del §9

**Depende de:** ADR-003

## Contexto

RF-05, RF-08 y las reglas del PRD §§7.1–7.3 reconocen «no evaluable» como un resultado legítimo del dominio, no como un fallo técnico. Algunos ceros sí son resultados definidos y desfavorables, mientras otros cocientes carecen de valor. ADR-003 fija precisión y presentación de los indicadores evaluables, pero reserva su tipo y formato externos a ADR-006. El contrato debe distinguir estos casos sin hacer variable la presencia del indicador ni invadir la forma general reservada a ADR-006.

## Decisión

La API mantiene cada indicador derivado en una respuesta exitosa y usa `null` exclusivamente como valor cuando el dominio lo declara no evaluable, sin sustituirlo por cero ni convertirlo en error.

## Alternativas consideradas

- **Omitir el indicador:** reduciría el payload, pero haría variable su estructura y no distinguiría la no evaluabilidad de un defecto de serialización.
- **Usar un resultado etiquetado con estado y valor:** haría explícita la condición y admitiría más estados, pero añadiría estructura que el único caso especial actual no requiere.
- **Usar cero como centinela:** simplificaría consumidores, pero falsearía casos donde cero es un resultado definido y desfavorable.

## Consecuencias

- Los consumidores comprueban `null` antes de interpretar u operar con el valor; ADR-006 decide el tipo y formato de los valores evaluables.
- `null` no puede significar dato desconocido, no solicitado ni cálculo pendiente.
- Los errores reales de validación o infraestructura conservan un canal distinto de esta condición de negocio.
- La presencia de los indicadores permanece estable; ADR-006 decide sus nombres, agrupación y envolvente.
- El estado visual neutral de RF-08 representa la ausencia de evaluación, no un índice neutral.
- Como costo, cada consumidor incorpora manejo condicional antes de usar el valor.

## Verificación

Pruebas de contrato cubren los cinco estados del PRD §7.3 y un proyecto vacío: comprueban `null` en las divisiones no evaluables, `CPI = 0` cuando `EV = 0` y `AC > 0`, `SPI = 0` cuando `EV = 0` y `PV > 0`, presencia estable de cada indicador y respuesta exitosa. Un caso con una actividad cuyo CPI es no evaluable verifica que el CPI consolidado, calculado desde los totales, sí puede ser evaluable.
