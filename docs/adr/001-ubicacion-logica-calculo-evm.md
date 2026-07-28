# ADR-001 — Ubicación de la lógica de cálculo EVM

**Estado:** Aceptada · **Fecha:** 2026-07-26

**Relacionada con:** RF-03, RF-04, RF-05, RF-07; reglas del PRD §7.1–§7.4

**Depende de:** ninguno

## Contexto

RF-03 exige calcular automáticamente por actividad; RF-04 y §7.1 exigen consolidar magnitudes antes de calcular ratios; RF-05 y §7.2–§7.4 añaden estados no evaluables, interpretación y redondeo. Las capas consumidoras deben recibir resultados coherentes. En una aplicación pequeña, con un único usuario concurrente, decenas de actividades y tiempo limitado, duplicar reglas aumentaría el riesgo de divergencia sin aportar capacidad necesaria.

## Decisión

La lógica de cálculo EVM reside en un único módulo de dominio del backend, invocado por la capa de aplicación para obtener indicadores por actividad y consolidados.

## Alternativas consideradas

- **Calcular en el frontend:** sería simple y daría respuesta inmediata, pero dejaría al backend sin resultados autoritativos y acoplaría las reglas a la interfaz.
- **Compartir un paquete entre frontend y backend:** reutilizaría fórmulas, pero exigiría coordinar versiones y conservaría dos puntos de ejecución innecesarios para la escala prevista.
- **Calcular en la base de datos:** centralizaría cerca de los datos, pero acoplaría reglas y casos límite al almacenamiento, dificultando sus pruebas y evolución.

## Consecuencias

- Actividades y consolidado reutilizan las mismas reglas y casos límite.
- Las pruebas del dominio cubren fórmulas, consolidación e interpretaciones sin depender de la interfaz ni del almacenamiento.
- El backend es responsable de entregar resultados coherentes a todos sus consumidores.
- Como consecuencia de esa ubicación, la interfaz presenta los resultados producidos por el backend en lugar de calcularlos.
- Por la misma razón, la interfaz no produce resultados autoritativos durante la digitación. ADR-007 decide la estrategia de recálculo y el contrato de respuesta tras una edición.
- Si el producto necesitara operar sin conexión o sin backend, esta decisión debería revisarse, probablemente a favor de un módulo compartido.

## Verificación

Pruebas unitarias y de integración verifican contra `contracts/evm/evm-fixture.json` los resultados esperados del módulo de dominio y de los casos de uso. Una revisión de dependencias confirma que controladores, persistencia e interfaz no contienen fórmulas ni clasificación EVM duplicadas.
