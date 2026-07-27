# Product Requirements Document — Seguimiento de Valor Ganado

> Convención de marcas: `[E]` explícito en el enunciado · `[D]` derivado necesariamente del dominio EVM · `[S]` supuesto adoptado en este documento.

## 1. Problema y propósito

[E] Los líderes de proyecto necesitan registrar el avance de sus actividades y detectar, en tiempo real, desviaciones de cronograma y presupuesto. [E] Revisar el gasto y el avance por separado oculta el caso crítico: consumir presupuesto por encima del trabajo efectivamente completado. [E] El producto relaciona plan, avance y costo mediante la metodología de Valor Ganado. [D] Convierte cinco datos capturados en indicadores e interpretaciones que distinguen condiciones favorables, desfavorables y no evaluables, sin exigir al usuario que calcule ni interprete los índices.

## 2. Alcance y no-objetivos

[E] El alcance incluye gestionar proyectos y actividades, calcular los indicadores EVM por actividad y consolidados por proyecto, e informar su interpretación. [E] Incluye un dashboard para capturar y editar actividades, consultar los resultados consolidados y comparar valores. [S] El producto permite registrar varios proyectos, pero analiza uno seleccionado a la vez.

[S] No busca gestionar portafolios, usuarios, permisos, dependencias entre actividades, asignación de recursos, facturación ni cronogramas detallados. [E] Tampoco busca un diseño visual elaborado: prioriza que el estado del proyecto sea comprensible de un vistazo.

## 3. Glosario del dominio

### Datos capturados por actividad

| Término | Definición |
|---|---|
| Nombre | [E] Identificador legible de la actividad. Capturado y editable. |
| BAC — Budget at Completion | [E] Presupuesto total planificado de la actividad. Capturado y editable. |
| Avance planificado | [E] Porcentaje del trabajo que debería estar completado en la fecha de corte. Capturado y editable. |
| Avance real | [E] Porcentaje del trabajo efectivamente completado. Capturado y editable. |
| AC — Actual Cost | [E] Costo real incurrido hasta la fecha de corte. Capturado y editable. |

### Indicadores derivados

| Indicador | Significado | Fórmula |
|---|---|---|
| PV — Planned Value | [D] Valor presupuestado del trabajo que debía estar completado. | [E] `% planificado × BAC` |
| EV — Earned Value | [D] Valor presupuestado del trabajo efectivamente completado. | [E] `% completado × BAC` |
| CV — Cost Variance | [D] Diferencia entre el valor ganado y el dinero gastado. | [E] `EV − AC` |
| SV — Schedule Variance | [D] Diferencia, expresada en dinero, entre el trabajo hecho y el planificado. | [E] `EV − PV` |
| CPI — Cost Performance Index | [D] Valor obtenido por cada unidad monetaria gastada. | [E] `EV / AC` |
| SPI — Schedule Performance Index | [D] Fracción del avance planificado que se ha logrado. | [E] `EV / PV` |
| EAC — Estimate at Completion | [D] Costo total proyectado al terminar, suponiendo que la eficiencia actual se mantiene. | [E] `BAC / CPI` |
| VAC — Variance at Completion | [D] Desviación presupuestal proyectada al terminar. | [E] `BAC − EAC` |

[E] Los ocho indicadores se calculan automáticamente. [E] Nunca se capturan ni se editan.

### Otros términos

| Término | Definición | Fórmula |
|---|---|---|
| Fecha de corte | [S] Fecha del proyecto para la cual se reportan plan, avance y costo. Rige a todas sus actividades. | [D] No aplica. |
| Avance del proyecto | [D] Proporción del presupuesto total correspondiente al trabajo ganado. | [D] `EV_total / BAC_total` |
| Banda neutral | [S] Rango alrededor de 1 dentro del cual un índice se considera conforme al plan, no favorable ni desfavorable. | [S] `0,99 ≤ índice ≤ 1,01` |
| Estado de la actividad | [D] Clasificación derivada de los datos capturados que determina qué indicadores son evaluables y cómo se interpretan. Ver §7. | [D] No aplica. |

## 4. Actor y job to be done

[E] El actor principal es el líder de proyecto. [S] Es el único actor contemplado.

[E] Cuando actualiza el avance y el costo de sus actividades a una fecha de corte, necesita ver la relación entre trabajo planificado, trabajo completado y dinero gastado. [D] El propósito es que detecte desviaciones de costo y de cronograma —tanto por actividad como para el proyecto completo— sin calcular ni interpretar manualmente los índices EVM.

## 5. Modelo de dominio

**Proyecto.** [D] Agrupa actividades y es la unidad de consolidación del análisis. [D] Se distingue por su nombre. [S] Tiene una fecha de corte que rige los datos de todas sus actividades. [S] Pueden existir varios proyectos; el dashboard opera sobre el que esté seleccionado.

**Actividad.** [D] Pertenece a un proyecto y no existe fuera de él. [E] Conserva exclusivamente los cinco datos capturados. [D] Sus ocho indicadores se derivan de esos datos y no forman parte de la captura editable.

**Consolidación.** [S] El BAC del proyecto es la suma de los BAC de sus actividades. [D] Los resultados consolidados comprenden BAC, PV, EV, AC, CV, SV, CPI, SPI, EAC, VAC, el avance del proyecto y las interpretaciones de costo y cronograma. [S] No existe un estado capturado de actividad —activa, cerrada o cancelada—: toda actividad existente participa en el análisis.

## 6. Requisitos funcionales y criterios de aceptación

| ID | Requisito | Criterio de aceptación |
|---|---|---|
| RF-01 | [E] Crear, editar y eliminar proyectos. [S] Seleccionar uno entre varios. | [S] Dado un proyecto, crearlo o editarlo lo actualiza; seleccionarlo cambia la vista analizada; eliminarlo lo retira junto con sus actividades. |
| RF-02 | [E] Crear, editar y eliminar actividades, capturando únicamente los cinco datos. | [E] Dados valores válidos, la operación actualiza la tabla. [S] Un valor inválido se rechaza indicando el campo y la regla incumplida. [D] Ningún indicador es editable. |
| RF-03 | [E] Calcular automáticamente los ocho indicadores por actividad. [S] Recalcular al confirmar la edición, no durante la digitación. | [D] Dados BAC 1.000, plan 50 %, avance 40 % y AC 500, entonces se muestran PV 500,00 · EV 400,00 · CV −100,00 · SV −100,00 · CPI 0,80 · SPI 0,80 · EAC 1.250,00 · VAC −250,00. |
| RF-04 | [D] Consolidar sumando magnitudes monetarias antes de calcular ratios y avance. Nunca promediar índices. | [D] Dadas dos actividades con BAC/PV/EV/AC de 100/100/100/50 y 100/100/100/200, entonces los totales son 200/200/200/250, con CPI 0,80, SPI 1,00 y avance 100 %. Un CPI consolidado de 1,25 (promedio de índices) incumple el criterio. |
| RF-05 | [E] Entregar la interpretación de CPI y SPI junto con su valor. [S] Aplicar la banda neutral. | [E] Dado CPI 0,87 y SPI 1,02, entonces se muestran «sobre presupuesto» y «adelantado». [S] Dados ambos en 0,997, entonces se muestran «en presupuesto» y «en cronograma». [S] Dado CPI 0,98912, se muestra `<0,99`, «sobre presupuesto» y estado desfavorable; dado SPI 0,98912, se muestra `<0,99`, «atrasado» y estado desfavorable. [S] Dados CPI y SPI en 0,99000 o 1,01000, se muestran respectivamente como `0,99` o `1,01`, sin marcador y con estado neutral: «en presupuesto» para CPI y «en cronograma» para SPI. [S] Dado CPI 1,01088, se muestra `>1,01`, «eficiente en costos» y estado favorable; dado SPI 1,01088, se muestra `>1,01`, «adelantado» y estado favorable. [D] Un indicador no evaluable se reporta como tal, no como error. |
| RF-06 | [E] Mostrar una tabla de actividades con sus datos e indicadores. | [E] Dadas actividades registradas, entonces cada fila muestra los cinco datos capturados y los ocho indicadores. [S] Una edición confirmada actualiza la fila sin recargar la página. |
| RF-07 | [E] Mostrar los indicadores consolidados del proyecto. | [D] Dadas actividades registradas, entonces el resumen muestra BAC, PV, EV, AC, CV, SV, CPI, SPI, EAC, VAC y avance, calculados sobre los totales. [S] Además informa cuántas actividades tienen EV mayor que cero y AC igual a cero. |
| RF-08 | [E] Mostrar el estado visual de CPI y SPI. [S] Cubrir los cinco casos derivados de §7. | [S] Dados CPI o SPI de 0,87, 1,00 y 1,02, entonces se muestran respectivamente desfavorable, neutral y favorable, con su texto. [D] Dada una actividad con EV 0 y AC 800, entonces su estado de costo es desfavorable, no neutral. [D] Dada una actividad con PV 0, entonces SPI es no evaluable, incluso si EV es mayor que cero. [S] En ese último caso puede mostrarse «avance anticipado» como información separada, sin clasificar SPI como favorable. [S] Un indicador no evaluable se muestra neutral. |
| RF-09 | [E] Graficar PV, EV y AC por actividad. | [E] Dadas tres actividades, entonces la gráfica presenta tres valores por actividad e identifica las series PV, EV y AC. |

## 7. Reglas de negocio y validación

### 7.1 Consolidación

[D] La consolidación suma BAC, PV, EV y AC de las actividades; sobre esos totales calcula variaciones, índices, estimaciones e interpretaciones. [D] Nunca promedia índices. [S] Incluye a las actividades cuyo plan aún no ha iniciado.

[D] La condición no evaluable de una actividad no se propaga al proyecto: como se suman magnitudes antes de dividir, el proyecto puede tener un CPI válido aunque alguna de sus actividades no lo tenga.

[D] Un proyecto sin actividades presenta BAC, PV, EV, AC, CV y SV en cero; CPI, SPI, EAC, VAC, avance e interpretaciones son no evaluables.

### 7.2 Interpretación

[E] Un CPI mayor que 1 indica eficiencia en costos y menor que 1, sobrecosto. [E] Un SPI mayor que 1 indica adelanto y menor que 1, atraso. [S] Dentro de la banda neutral se reporta «en presupuesto» o «en cronograma».

[D] La interpretación de costo se deriva de CPI y la de cronograma, de SPI. [D] CV y SV se presentan como montos informativos pero no determinan el estado visual, porque pueden ser favorables mientras su índice correspondiente no es evaluable.

### 7.3 Estados de la actividad

[D] El estado se deriva de los datos capturados y determina qué indicadores son evaluables:

| Caso | Condición | CPI | SPI | EAC y VAC | Lectura |
|---|---|---|---|---|---|
| [D] Sin iniciar | [D] `PV = 0`, `EV = 0`, `AC = 0` | [D] No evaluable | [D] No evaluable | [D] No evaluables | [D] No debía haber empezado y no empezó. |
| [D] Sin avance con plan vigente | [D] `PV > 0`, `EV = 0`, `AC = 0` | [D] No evaluable | [D] `0` | [D] No evaluables | [D] Atrasada: cero avance contra un plan vigente. |
| [D] Avance con AC cero | [D] `EV > 0`, `AC = 0` | [D] No evaluable | [D] Evaluable solo si `PV > 0`; de lo contrario, no evaluable | [D] No evaluables | [S] Puede existir un costo pendiente de registro; nunca se reporta como favorable en costo. |
| [D] Costo sin avance | [D] `EV = 0`, `AC > 0` | [D] `0` | [D] `0` si `PV > 0`; de lo contrario, no evaluable | [D] No evaluables | [D] Consumió presupuesto sin producir valor. Desfavorable en costo. |
| [D] Avance con costo | [D] `EV > 0`, `AC > 0` | [D] Evaluable | [D] Evaluable solo si `PV > 0`; de lo contrario, no evaluable | [D] Evaluables | [D] El costo se interpreta según CPI; el cronograma, según SPI cuando sea evaluable. |

[D] `EV = 0` con `AC > 0` produce `CPI = 0`: un valor definido y desfavorable, no un indicador no evaluable. [D] EAC queda no evaluable porque CPI es cero; VAC queda no evaluable porque depende de EAC. [D] `PV = 0` deja SPI no evaluable para cualquier valor de EV. [S] Si además EV es mayor que cero, puede mostrarse «avance anticipado» como información basada en SV positivo, separada de la interpretación de SPI.

[S] El consolidado informa cuántas actividades tienen EV mayor que cero y AC igual a cero. [S] El conteo advierte un posible rezago en el registro de costos: esas actividades aportan al numerador del CPI consolidado sin aportar al denominador y pueden elevarlo. [S] El conteo no declara que los datos sean erróneos.

### 7.4 Presentación numérica

[D] Cada valor presentado coincide con el redondeo matemáticamente correcto del resultado obtenido al aplicar las fórmulas sin redondear ni cuantizar resultados intermedios. [S] Los montos y los índices se presentan con dos decimales y el avance, como porcentaje entero; todos se redondean al más cercano y los empates exactos se resuelven alejándose de cero. [S] La banda neutral inclusiva de 0,99 a 1,01, la interpretación y el estado visual se aplican al índice sin redondear. [S] Solo cuando un índice fuera de la banda se presenta exactamente como 0,99 o 1,01, se antepone respectivamente `<` o `>` para revelar el cruce que oculta el redondeo; ningún otro valor presentado lleva esos marcadores.

### 7.5 Validación de entrada

[S] El nombre y la fecha de corte son obligatorios. [S] El BAC es positivo. [S] El AC no es negativo. [S] Ambos porcentajes están entre 0 % y 100 %, inclusive. [S] Una entrada inválida se rechaza indicando el campo y la regla incumplida, sin alterar el estado previo.

## 8. Supuestos y ambigüedades resueltas

| Supuesto | Justificación | Impacto si resulta falso |
|---|---|---|
| [S] La fecha de corte pertenece al proyecto y rige a sus actividades. | [S] Alinea todos los datos consolidados a un mismo instante. | [S] Requeriría cortes por actividad o series históricas. → ADR |
| [S] Ambos porcentajes admiten valores de 0 % a 100 %, inclusive. | [S] Miden terminación física, que no excede el alcance. | [S] La validación y la interpretación deberían admitir sobrecumplimiento. |
| [S] Las actividades con PV cero entran en la consolidación. | [S] Conservan su alcance presupuestal aunque no hayan iniciado. | [S] Los totales requerirían inclusión condicional. |
| [S] No existe estado capturado de actividad; los casos de §7 son derivados. | [S] Solo la existencia determina la participación en el análisis. | [S] Un estado capturado necesitaría reglas propias de inclusión. |
| [S] El BAC del proyecto es la suma de los BAC de sus actividades. | [S] Evita dos presupuestos contradictorios. | [S] Requeriría conciliar el valor propio con la suma. → ADR |
| [S] Eliminar un proyecto elimina físicamente sus actividades. | [S] No se exige auditoría ni recuperación. | [S] Requeriría conservación y borrado lógico. → ADR |
| [S] La banda neutral inclusiva es 0,99–1,01. | [S] Tolera desviaciones de hasta 1 % sin reportar alarma. | [S] Cambiaría el estado de los valores cercanos a 1. |
| [S] Existen varios proyectos y el dashboard muestra uno seleccionado. | [S] Evita el análisis de portafolio, fuera de alcance. | [S] Cambiarían la navegación y el nivel de consolidación. → ADR |
| [S] El estado visual tiene tres niveles: desfavorable, neutral y favorable. | [S] Responde «bien o mal» sin escalonar severidad. | [S] Un nivel de alerta intermedio requeriría umbrales adicionales. |
| [S] El recálculo se dispara al confirmar la edición. | [S] Evita estados intermedios inconsistentes durante la digitación. | [S] El cálculo continuo cambiaría la experiencia y el contrato de lectura. → ADR |
| [S] Con PV cero y EV positivo se muestra «avance anticipado» separado de SPI. | [D] SPI no es evaluable; SV positivo aporta contexto. | [S] Omitir la nota ocultaría trabajo ejecutado antes del plan. |
| [S] El consolidado cuenta actividades con EV positivo y AC cero. | [S] Advierte un posible rezago de costos sin declarar un error. | [S] Sin el conteo, el CPI podría parecer optimista sin contexto. |
| [S] La interpretación y el estado visual se aplican al índice sin redondear. | [S] Conserva la banda neutral inclusiva real de 0,99 a 1,01. | [S] Clasificar el valor mostrado ampliaría la banda hasta media centésima por cada límite. |
| [S] Los empates exactos se redondean alejándose de cero. | [S] Define un resultado único y simétrico para valores positivos y negativos. | [S] Otra convención cambiaría montos, índices o avance justo en los empates. |
| [S] Un índice fuera de la banda cuya presentación sea exactamente 0,99 o 1,01 lleva respectivamente `<` o `>`, y ningún otro valor lleva esos marcadores. | [S] Evita que el redondeo oculte un cruce de la banda sin recargar el resto de la presentación. | [S] Sin marcadores, un límite visible podría parecer neutral; usarlos en más casos cambiaría el lenguaje de salida. |

## 9. Definición de terminado

[S] El producto está terminado cuando un tercero ejecuta todos los criterios de aceptación de §6 y obtiene los resultados indicados, sin interpretación adicional. [E] Los cinco datos son editables y los ocho indicadores no lo son. [E] El dashboard contiene la tabla de actividades, los indicadores consolidados, el estado visual de CPI y SPI, y la gráfica comparativa. [D] Los indicadores no evaluables se presentan como tales en lugar de producir errores. [S] Todo el comportamiento descrito puede validarse sin conocer decisiones técnicas.

## 10. Fuera de alcance y limitaciones conocidas

**Fuera de alcance.** [S] Autenticación, permisos, consolidación de portafolios, estados de actividad, historial de reportes y recuperación de elementos eliminados. [S] Gestión de dependencias, calendarios, recursos y líneas base.

**Limitaciones conocidas.**

[E] La única proyección disponible es EAC, definida en el glosario. [D] Supone que la eficiencia observada se mantendrá hasta el final; el estándar del PMI contempla otras fórmulas para supuestos distintos, no incluidas aquí.

[D] SPI mide dinero de trabajo, no tiempo: no considera la ruta crítica y converge a 1 al completarse el proyecto, incluso si terminó tarde.

[S] El gráfico de mayor valor diagnóstico de la metodología es la curva S —PV, EV y AC acumulados a lo largo del tiempo—, que revela la tendencia y no solo la fotografía actual. [S] Exige un historial de reportes por periodo, declarado fuera de alcance en esta sección. [S] Se documenta como ruta de evolución, no como funcionalidad omitida por descuido.

[D] El análisis depende por completo de la calidad del avance real reportado, que es una estimación humana. [S] La banda neutral es fija y no configurable. [S] El dashboard analiza un proyecto por vez.
