# Product Requirements Document — Seguimiento de Valor Ganado

## 1. Problema y propósito

[E] Los líderes de proyecto necesitan registrar avances y detectar, en tiempo real, desviaciones de cronograma y presupuesto. [E] Revisar gasto y avance por separado oculta consumos superiores al trabajo completado. [E] El producto relacionará plan, avance y costo mediante Valor Ganado. [D] Convertirá datos en indicadores e interpretaciones que distingan condiciones favorables, desfavorables o no evaluables.

## 2. Alcance y no-objetivos

[E] El alcance incluye gestionar proyectos y actividades, calcular indicadores EVM por actividad y proyecto, e informar su interpretación. [E] Incluye un dashboard para capturar y editar actividades, consultar resultados consolidados y comparar valores. [S] El producto permite varios proyectos, pero analiza uno seleccionado a la vez. [S] No busca gestionar portafolios, usuarios, permisos, dependencias, recursos, facturación ni cronogramas detallados. [E] Tampoco busca diseño visual elaborado; prioriza que el estado sea comprensible de un vistazo.

## 3. Glosario del dominio

### Datos capturados

| Término | Definición |
|---|---|
| Nombre | [E] Identificador legible de la actividad, capturado y editable. |
| BAC — Budget at Completion | [E] Presupuesto total planificado de la actividad, capturado y editable. |
| Avance planificado | [E] Porcentaje del trabajo que debería estar completado en la fecha de corte, capturado y editable. |
| Avance real | [E] Porcentaje del trabajo efectivamente completado, capturado y editable. |
| AC — Actual Cost | [E] Costo real incurrido hasta la fecha de corte, capturado y editable. |

### Indicadores derivados

| Indicador | Significado | Fórmula |
|---|---|---|
| PV — Planned Value | [E] Valor presupuestado del trabajo planificado. | [E] `% planificado × BAC` |
| EV — Earned Value | [E] Valor presupuestado del trabajo completado. | [E] `% completado × BAC` |
| CV — Cost Variance | [E] Variación de costo. | [E] `EV − AC` |
| SV — Schedule Variance | [E] Variación de cronograma. | [E] `EV − PV` |
| CPI — Cost Performance Index | [E] Índice de eficiencia del costo. | [E] `EV / AC` |
| SPI — Schedule Performance Index | [E] Índice de desempeño del cronograma. | [E] `EV / PV` |
| EAC — Estimate at Completion | [E] Costo total estimado al terminar. | [E] `BAC / CPI` |
| VAC — Variance at Completion | [E] Variación presupuestal estimada al terminar. | [E] `BAC − EAC` |

### Otros términos

| Término | Definición | Fórmula |
|---|---|---|
| Fecha de corte | [S] Fecha del proyecto para la cual se reportan plan, avance y costo. | [D] No aplica. |
| Avance del proyecto | [D] Proporción del presupuesto correspondiente al trabajo ganado. | [D] `EV_total / BAC_total` |

[E] Los ocho indicadores EVM son resultados calculados automáticamente; nunca se capturan ni se editan.

## 4. Actor y job to be done

[E] El actor principal es el líder de proyecto. [E] Cuando actualiza el avance y costo de las actividades en una fecha de corte, necesita ver la relación entre trabajo planificado, trabajo completado y gasto. [D] Así puede detectar desviaciones de costo o cronograma sin calcular ni interpretar manualmente los índices EVM, tanto por actividad como para el proyecto completo.

## 5. Modelo de dominio (entidades y datos)

[D] Proyecto agrupa actividades y es la unidad consolidada. [D] Su nombre lo distingue. [S] Su fecha de corte rige todos sus datos y puede seleccionarse entre varios proyectos.

[E] Actividad pertenece a un proyecto. [E] Conserva exclusivamente cinco datos capturados: nombre, BAC, avance planificado, avance real y AC. [D] Sus ocho indicadores se derivan de esos datos y no forman parte de la captura editable.

[S] El BAC del proyecto deriva de sus actividades. [D] Los resultados consolidados incluyen BAC, PV, EV, AC, CV, SV, CPI, SPI, EAC, VAC, avance e interpretaciones. [S] No existe estado de actividad; toda actividad existente participa en el análisis.

## 6. Requisitos funcionales con criterios de aceptación

| ID | Requisito | Criterio de aceptación |
|---|---|---|
| RF-01 | [E] Crear, editar y eliminar proyectos; [S] seleccionar uno entre varios. | [S] Dado un proyecto, crearlo o editarlo lo actualiza; seleccionarlo cambia la vista; eliminarlo lo retira con sus actividades. |
| RF-02 | [E] Crear, editar y eliminar actividades capturando solo los cinco datos. | [E] Dados valores válidos, las operaciones actualizan la tabla; [S] un valor inválido se rechaza con campo y regla; los indicadores no son editables. |
| RF-03 | [E] Calcular automáticamente los ocho indicadores por actividad, en tiempo real. | [D] Dados BAC 1.000, plan 50%, avance 40% y AC 500, entonces muestra PV 500, EV 400, CV −100, SV −100, CPI 0,80, SPI 0,80, EAC 1.250 y VAC −250. |
| RF-04 | [D] Consolidar sumas antes de ratios y avance; nunca promediar índices. | [D] Dadas actividades BAC/PV/EV/AC 100/100/100/50 y 100/100/100/200, entonces muestra totales 200/200/200/250, CPI 0,80, SPI 1,00 y avance 100%; no CPI 1,25. |
| RF-05 | [E] Entregar interpretaciones de CPI y SPI; [S] aplicar la banda neutral. | [E] CPI 0,87 y SPI 1,02 muestran “sobre presupuesto” y “adelantado”; [S] ambos en 0,997 muestran “en presupuesto” y “en cronograma”; [D] dividir por cero muestra “indefinido”, no error. |
| RF-06 | [E] Mostrar una tabla de actividades con datos e indicadores. | [E] Dadas actividades, entonces cada fila muestra cinco datos y ocho indicadores; una edición actualiza la fila sin recargar. |
| RF-07 | [E] Mostrar los indicadores consolidados del proyecto. | [D] Dadas actividades, entonces el resumen muestra BAC, PV, EV, AC, CV, SV, CPI, SPI, EAC, VAC y avance sobre totales. |
| RF-08 | [E] Mostrar el estado visual de CPI y SPI. | [S] Dados CPI o SPI 0,87, 1,00 y 1,02, entonces muestra respectivamente rojo, neutral y verde, con el texto correspondiente; “indefinido” es neutral. |
| RF-09 | [E] Graficar PV, EV y AC por actividad. | [E] Dadas tres actividades, entonces la gráfica presenta tres valores por actividad e identifica las series PV, EV y AC. |

## 7. Reglas de negocio y validación

[D] La consolidación suma BAC, PV, EV y AC; después calcula variaciones, índices, estimaciones y avance. [D] Nunca promedia índices. [S] Incluye actividades sin plan iniciado.

[E] CPI mayor que 1 indica eficiencia y menor que 1, sobrecosto; SPI mayor que 1 indica adelanto y menor que 1, atraso. [S] Entre 0,99 y 1,01, inclusive, produce “en presupuesto” o “en cronograma”.

[D] AC cero deja CPI indefinido; PV cero, SPI indefinido; EV cero, EAC indefinido. [D] EAC también es indefinido si CPI lo es. [D] Son estados legítimos, no errores.

[S] Nombre y fecha son obligatorios; BAC es positivo; AC, no negativo; ambos porcentajes están entre 0% y 100%. [S] Una entrada inválida se rechaza indicando campo y regla.

## 8. Supuestos y ambigüedades resueltas

| Supuesto | Justificación en una línea | Impacto si resulta falso |
|---|---|---|
| [S] La fecha de corte pertenece al proyecto y rige sus actividades. | [S] Alinea los datos consolidados. | [S] Requeriría cortes por actividad o históricos. → ADR |
| [S] Ambos porcentajes admiten 0%–100%, inclusive. | [S] Miden terminación física. | [S] Validación e interpretación aceptarían sobrecumplimiento. |
| [S] Actividades con PV cero entran en la consolidación. | [S] Conservan alcance presupuestal. | [S] Los totales necesitarían inclusión condicional. |
| [S] No hay estado activa, cerrada o cancelada. | [S] Solo se exige existencia. | [S] Cada estado necesitaría reglas propias. |
| [S] BAC del proyecto suma los BAC de actividades. | [S] Evita presupuestos contradictorios. | [S] Requeriría conciliar dos valores. → ADR |
| [S] Eliminar un proyecto elimina físicamente sus actividades. | [S] No se exige auditoría. | [S] Requeriría conservación y borrado lógico. → ADR |
| [S] La banda neutral inclusiva es 0,99–1,01. | [S] Tolera desviaciones de 1%. | [S] Cambiarían estados cercanos a 1. |
| [S] Hay varios proyectos; el dashboard muestra uno seleccionado. | [S] Evita análisis de portafolio. | [S] Cambiarían navegación o consolidación. → ADR |

## 9. Definición de terminado

[S] Está terminado cuando un tercero ejecuta todos los criterios y obtiene los resultados indicados. [E] Los cinco datos son editables; los ocho indicadores no. [E] El dashboard contiene tabla, consolidado, estados visuales y gráfica. [D] Las divisiones por cero aparecen indefinidas. [S] El comportamiento puede comprenderse y validarse sin decisiones técnicas.

## 10. Fuera de alcance y limitaciones conocidas

[S] Quedan fuera autenticación, permisos, portafolios consolidados, estados, históricos y recuperación de eliminaciones. [S] No se administran dependencias, calendarios, recursos ni líneas base. [E] La única proyección es EAC. [S] El análisis depende de la calidad y actualidad de los datos. [S] La banda neutral es fija. [S] El dashboard muestra un proyecto por vez.
