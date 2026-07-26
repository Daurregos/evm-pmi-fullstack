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
| EAC — Estimate at Completion | [E] Costo total estimado al terminar. [D] Supone que continúa la eficiencia de costo observada. | [E] `BAC / CPI` |
| VAC — Variance at Completion | [E] Variación presupuestal estimada al terminar. | [E] `BAC − EAC` |

### Otros términos

| Término | Definición | Fórmula |
|---|---|---|
| Fecha de corte | [S] Fecha del proyecto para la cual se reportan plan, avance y costo. | [D] No aplica. |
| Avance del proyecto | [D] Proporción del presupuesto correspondiente al trabajo ganado. | [D] `EV_total / BAC_total` |

[E] Los ocho indicadores EVM son resultados calculados automáticamente; nunca se capturan ni se editan.

## 4. Actor y job to be done

[E] El actor es el líder de proyecto. [E] Al actualizar avance y costo en una fecha de corte, necesita comparar plan, trabajo completado y gasto. [D] Así detecta desviaciones de costo o cronograma por actividad y proyecto sin calcular ni interpretar EVM manualmente.

## 5. Modelo de dominio (entidades y datos)

[D] Proyecto agrupa actividades y es la unidad consolidada. [D] Su nombre lo distingue. [S] Su fecha de corte rige todos sus datos y puede seleccionarse entre varios proyectos.

[E] Actividad pertenece a un proyecto. [E] Conserva exclusivamente cinco datos capturados: nombre, BAC, avance planificado, avance real y AC. [D] Sus ocho indicadores se derivan de esos datos y no forman parte de la captura editable.

[S] El BAC del proyecto deriva de sus actividades. [D] Los resultados consolidados incluyen BAC, PV, EV, AC, CV, SV, CPI, SPI, EAC, VAC, avance e interpretaciones. [S] No existe estado de actividad; toda actividad existente participa en el análisis.

## 6. Requisitos funcionales con criterios de aceptación

| ID | Requisito | Criterio de aceptación |
|---|---|---|
| RF-01 | [E] Crear, editar y eliminar proyectos; [S] seleccionar uno entre varios. | [S] Dado un proyecto, crearlo o editarlo lo actualiza; seleccionarlo cambia la vista; eliminarlo lo retira con sus actividades. |
| RF-02 | [E] Crear, editar y eliminar actividades capturando solo los cinco datos. | [E] Dados valores válidos, las operaciones actualizan la tabla; [S] un valor inválido se rechaza con campo y regla; los indicadores no son editables. |
| RF-03 | [E] Calcular automáticamente los ocho indicadores por actividad, en tiempo real. | [D] Con BAC 1.000, plan 50%, avance 40% y AC 500, muestra PV 500,00, EV 400,00, CV −100,00, SV −100,00, CPI 0,80, SPI 0,80, EAC 1.250,00 y VAC −250,00; [S] recalcula al confirmar, no al digitar. |
| RF-04 | [D] Consolidar sumas antes de ratios y avance; nunca promediar índices. | [D] Dadas dos actividades con BAC 100, plan 100% y avance 100%, una con AC 50 y otra con AC 200, muestra BAC 200,00, PV 200,00, EV 200,00, AC 250,00, CPI 0,80, SPI 1,00 y avance 100%; no muestra CPI 1,25. |
| RF-05 | [E] Entregar interpretaciones de CPI y SPI; [S] aplicar la banda neutral. | [E] CPI 0,87 y SPI 1,02 muestran “sobre presupuesto” y “adelantado”; [S] ambos en 0,997 muestran “en presupuesto” y “en cronograma”; [D] dividir por cero muestra “indefinido”, no error. |
| RF-06 | [E] Mostrar una tabla de actividades con datos e indicadores. | [E] Dadas actividades, entonces cada fila muestra cinco datos y ocho indicadores; una edición actualiza la fila sin recargar. |
| RF-07 | [E] Mostrar los indicadores consolidados del proyecto. | [D] Dadas actividades, entonces el resumen muestra BAC, PV, EV, AC, CV, SV, CPI, SPI, EAC, VAC y avance sobre totales. |
| RF-08 | [E] Mostrar el estado visual de CPI y SPI. | [S] Dados CPI o SPI 0,87, 1,00 y 1,02, entonces muestra respectivamente rojo, neutral y verde, con el texto correspondiente; “indefinido” es neutral. |
| RF-09 | [E] Graficar PV, EV y AC por actividad. | [E] Dadas tres actividades, entonces la gráfica presenta tres valores por actividad e identifica las series PV, EV y AC. |

## 7. Reglas de negocio y validación

[D] Se suman BAC, PV, EV y AC antes de derivar los resultados consolidados; nunca se promedian índices. [S] Se incluyen actividades cuyo plan no ha iniciado. [D] En un proyecto sin actividades, BAC, PV, EV, AC, CV y SV son cero; CPI, SPI, EAC, VAC, avance e interpretaciones son indefinidos.

[E] CPI mayor que 1 indica eficiencia en costos y menor que 1, sobrecosto. [E] SPI mayor que 1 indica adelanto y menor que 1, atraso. [S] El sistema clasifica como neutral todo índice entre 0,99 y 1,01, inclusive; fuera de esa banda aplica la interpretación EVM.

[D] AC igual a cero deja CPI indefinido; PV igual a cero deja SPI indefinido; EV igual a cero deja EAC indefinido. [D] EAC también es indefinido cuando CPI lo es; VAC es indefinido cuando EAC lo es. [D] La indefinición de una actividad no se propaga por sí sola: el proyecto calcula sobre las magnitudes totales. [D] Son estados legítimos, no errores.

[S] Los nombres y la fecha de corte son obligatorios; el BAC de cada actividad debe ser mayor que cero; AC no puede ser negativo; ambos porcentajes deben estar entre 0% y 100%. [S] Una entrada inválida se rechaza indicando campo y regla.

[S] Los montos y los índices se presentan con dos decimales; el avance, como porcentaje entero; todos se redondean al valor más cercano. [D] Los cálculos encadenados conservan la precisión sin redondear. [S] La interpretación usa el índice ya redondeado para coincidir con el valor mostrado.

## 8. Supuestos y ambigüedades resueltas

| Supuesto | Justificación en una línea | Impacto si resulta falso |
|---|---|---|
| [S] Fecha de corte común por proyecto. | [S] Alinea consolidados. | [S] Requeriría cortes individuales o históricos. → ADR |
| [S] Ambos avances limitados a 0%–100%. | [S] Miden terminación. | [S] Admitirían sobrecumplimiento. |
| [S] Actividades con PV cero se consolidan. | [S] Conservan presupuesto. | [S] Exigiría inclusión condicional. |
| [S] Sin estados de actividad. | [S] Solo importa existencia. | [S] Exigiría reglas por estado. |
| [S] BAC del proyecto suma BAC de actividades. | [S] Evita contradicciones. | [S] Exigiría conciliar valores. → ADR |
| [S] Borrado físico del proyecto y sus actividades. | [S] No se exige auditoría. | [S] Exigiría conservación lógica. → ADR |
| [S] Banda neutral inclusiva 0,99–1,01. | [S] Tolera desviación de 1%. | [S] Cambiarían estados cercanos. |
| [S] Varios proyectos; dashboard muestra uno. | [S] Evita portafolios. | [S] Cambiarían navegación o consolidación. → ADR |
| [S] Tres estados visuales: desfavorable, neutral, favorable. | [S] Responde “bien o mal”. | [S] Más niveles exigirían umbrales. |
| [S] Recálculo al confirmar la edición. | [S] Evita estados intermedios. | [S] El cálculo continuo cambiaría la experiencia. → ADR |
| [S] Interpretación posterior al redondeo. | [S] Coincide con el valor mostrado. | [S] En límites, número y estado podrían discrepar. |

## 9. Definición de terminado

[S] Está terminado cuando un tercero ejecuta todos los criterios y obtiene los resultados indicados. [E] Los cinco datos son editables; los ocho indicadores no. [E] El dashboard contiene tabla, consolidado, estados visuales y gráfica. [D] Las divisiones por cero aparecen indefinidas. [S] El comportamiento puede comprenderse y validarse sin decisiones técnicas.

## 10. Fuera de alcance y limitaciones conocidas

[S] Quedan fuera autenticación, permisos, portafolios consolidados, estados, históricos y recuperación de eliminaciones. [S] No se administran dependencias, calendarios, recursos ni líneas base. [E] La única proyección es EAC. [S] No se calculan variantes alternativas de EAC. [S] El análisis depende de la calidad y actualidad de los datos. [S] La banda neutral es fija. [S] El dashboard muestra un proyecto por vez.
