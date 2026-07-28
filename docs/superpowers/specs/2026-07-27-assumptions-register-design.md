# Diseño: registro de supuestos del proyecto

## Objetivo

Crear `docs/ASSUMPTIONS.md` como inventario completo de las decisiones marcadas `[S]` en `docs/PRD.md`, incluidas las que aparecen fuera de §8. El documento debe ser breve fuera de la tabla, trazable al PRD y explícito sobre la decisión arquitectónica que absorbió cada supuesto.

## Alcance y estructura

- Incluir un título, un propósito de no más de tres líneas, una tabla y la sección final «Supuestos con mayor riesgo».
- Usar una fila por decisión única; cuando el mismo supuesto reaparezca, registrar todos sus orígenes en la misma fila.
- Mantener exclusivamente supuestos `[S]`; excluir hechos `[E]`, derivaciones `[D]`, fórmulas, reglas de negocio y criterios de aceptación.
- Usar las cinco columnas solicitadas: `Supuesto`, `Origen`, `Justificación`, `Impacto si resulta falso` y `Resuelto en`.
- Conservar la justificación y el impacto del PRD cuando existan. Completar solo consecuencias ya implicadas por el supuesto, sin abrir decisiones nuevas.

## Trazabilidad de ADR

Aplicar literalmente el mapeo indicado por el PRD para fecha de corte/ADR-005, BAC sumado/ADR-006b, borrado físico/ADR-008, selección de proyecto/ADR-006a y recálculo al confirmar/ADR-007. Para los restantes supuestos, asignar un ADR solo cuando su decisión esté realmente absorbida allí; en los demás casos usar `—`.

## Cierre y riesgos

La sección de riesgo nombrará tres supuestos elegidos por el alcance del cambio que provocarían, no por frecuencia. La selección prevista es: modelo temporal de foto única y fecha común, un proyecto seleccionado frente a portafolio y borrado físico en cascada.

## Verificación

- Comparar cada aparición `[S]` del PRD con una fila o un grupo de filas del registro.
- Revisar que no haya `[E]`, `[D]`, fórmulas, stack ni detalles de implementación.
- Verificar la correspondencia obligatoria de ADR y que los casos sin absorción indiquen `—`.
- Ejecutar `git diff --check` incluyendo el archivo nuevo y revisar el diff para confirmar que solo contiene el documento solicitado.
