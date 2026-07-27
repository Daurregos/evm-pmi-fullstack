# Registro de supuestos del proyecto

Este documento hace explícitas todas las decisiones marcadas `[S]` en el PRD, incluidas las que aparecen fuera de §8, y registra su trazabilidad a los ADR.

| Supuesto | Origen | Justificación | Impacto si resulta falso | Resuelto en |
|---|---|---|---|---|
| Existen varios proyectos y el dashboard analiza uno seleccionado a la vez. | §2; §5; RF-01; §8; §10 | Evita el análisis de portafolio y mantiene el dashboard centrado en un proyecto. | Cambiarían la navegación y el nivel de análisis hacia un portafolio. | ADR-006a |
| La gestión de portafolios, gestión de usuarios, autenticación, permisos, estados de ciclo de vida, historial de reportes, recuperación de elementos eliminados, dependencias, calendarios, recursos, líneas base, facturación y cronogramas detallados está fuera de alcance. | §2; §10 | El producto no busca gestionar esas capacidades. | Habría que ampliar el alcance para gestionarlas. | — |
| Cada proyecto tiene una fecha de corte común para sus actividades y conserva una sola foto vigente, sin historial; la curva S y el historial son una evolución fuera de alcance. | §3; §5; RF-01; RF-02; §8; §10 | Una fecha común alinea el reporte; la foto única deja el historial y la curva S como evolución futura. | Requeriría cortes por actividad, versiones históricas y un modelo para la evolución temporal. | ADR-005 |
| El líder de proyecto es el único actor contemplado. | §4 | El producto contempla al líder de proyecto como único actor. | Requeriría definir otros actores y sus responsabilidades. | — |
| Crear o editar un proyecto actualiza ese proyecto. | RF-01 | La operación sobre un proyecto modifica el proyecto dado. | Cambiaría el resultado esperado de la gestión de proyectos. | — |
| El BAC del proyecto es la suma de los BAC de sus actividades. | §5; §8 | Evita dos presupuestos contradictorios. | Requeriría conciliar un valor propio del proyecto con la suma de actividades. | ADR-006b |
| Las actividades con PV cero participan en la consolidación. | §7.1; §8 | Conservan su alcance presupuestal aunque no hayan iniciado. | Los totales requerirían una inclusión condicional. | — |
| No existe un estado capturado de ciclo de vida de la actividad y toda actividad existente participa en el análisis. | §5; RF-08; §8; §10 | Solo la existencia determina la participación en el análisis. | Un estado capturado necesitaría reglas propias de inclusión. | — |
| Eliminar un proyecto elimina físicamente sus actividades en cascada. | RF-01; §8; §10 | No se exige auditoría, recuperación ni conservación de elementos eliminados. | Requeriría conservación, borrado lógico o recuperación. | ADR-008 |
| Eliminar el proyecto seleccionado deja el dashboard sin selección. | RF-01 | El dashboard no conserva una selección que ya no existe. | El dashboard tendría que seleccionar otro proyecto o mostrar una referencia inválida. | — |
| El dashboard recalcula al confirmar la edición y no durante la digitación. | RF-03; §8 | Evita estados intermedios inconsistentes durante la digitación. | El cálculo continuo cambiaría la experiencia y el contrato de lectura. | ADR-007 |
| Una edición confirmada actualiza la fila sin recargar la página. | RF-06 | La tabla refleja la edición confirmada en la fila correspondiente. | La interacción exigiría una recarga para mostrar el cambio. | — |
| La banda neutral es inclusiva de 0,99 a 1,01 y es fija, no configurable. | §3; RF-05; §7.2; §8; §10 | Tolera desviaciones de hasta 1 % sin reportar alarma y mantiene un criterio fijo. | Cambiaría el estado de los valores cercanos a 1 y su configuración permitida. | ADR-003 |
| El estado visual tiene tres niveles: desfavorable, neutral y favorable. | RF-05; RF-08; §8 | Responde si el resultado es favorable, neutral o desfavorable sin escalonar severidad. | Requeriría niveles de alerta y umbrales adicionales. | — |
| Un indicador no evaluable se muestra con apariencia neutral. | RF-05; RF-08 | El estado visual de la condición es neutral. | Cambiaría el tratamiento visual de esa condición. | ADR-004 |
| Con PV cero y EV positivo puede mostrarse «avance anticipado» separado de SPI. | RF-08; §7.3; §8 | La nota informa del trabajo ejecutado antes del plan sin convertirlo en una lectura de SPI. | Omitirla ocultaría trabajo ejecutado antes del plan. | — |
| El consolidado cuenta las actividades con EV positivo y AC cero para advertir un posible costo pendiente, sin declarar inválidos los datos. | RF-07; RF-08; §7.3 | El conteo advierte un posible rezago en el registro de costos sin declarar un error. | El CPI podría parecer optimista sin contexto sobre ese posible rezago. | ADR-006b (solo el conteo) |
| Con EV positivo y AC cero puede existir un costo pendiente de registro y el caso nunca se muestra como favorable en costo. | RF-08; §7.3 | Puede existir un costo pendiente de registro; nunca se reporta como favorable en costo. | Podría comunicarse como favorable un caso cuyo costo aún no está registrado. | — |
| Los montos y los índices se presentan con dos decimales, el avance como porcentaje entero, los empates exactos se redondean alejándose de cero, la clasificación usa el índice sin redondear y los marcadores solo aparecen cuando el redondeo oculta un cruce de la banda. | RF-05; §7.4; §8 | Define una presentación única y conserva visible un cruce de la banda que el redondeo ocultaría. | Cambiarían los valores mostrados, la clasificación de límites y el lenguaje de los marcadores. | ADR-003 |
| Una entrada inválida se rechaza indicando el campo y la regla incumplida, y el estado previo permanece intacto. | RF-02; §7.5 | La persona recibe el campo y la regla incumplida sin perder el estado previo. | La validación podría ocultar el problema o dejar datos parcialmente modificados. | — |
| El nombre y la fecha de corte son obligatorios; el BAC es positivo; el AC no es negativo; y ambos porcentajes admiten de 0 % a 100 %, inclusive. | RF-02; §7.5; §8 | Define los límites de captura aceptados para el proyecto y sus actividades. | Cambiarían los datos que pueden registrarse y las validaciones de entrada. | — |
| Un tercero puede validar todo el comportamiento descrito sin conocer las decisiones técnicas. | §9 | El comportamiento del producto debe poder validarse sin conocimiento técnico. | La validación requeriría conocer decisiones técnicas adicionales. | — |

## Supuestos con mayor riesgo

- **Modelo temporal:** cambiaría la foto vigente, la fecha común y la evolución histórica.
- **Selección frente a portafolio:** cambiaría la navegación y el nivel de análisis.
- **Borrado físico en cascada:** cambiaría la conservación, recuperación y ciclo de vida de las actividades.
