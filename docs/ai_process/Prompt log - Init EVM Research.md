Analiza el siguiente challenge tecnico, fijate principalmente en los conceptos y el problema de dominio y de negocio:

'''

### El problema

Queremos construir una herramienta interna para que los líderes de proyecto puedan

registrar el avance de sus actividades y entender, en tiempo real, si su proyecto va bien o

mal en términos de cronograma y presupuesto.

La metodología que usaremos para ese análisis es el Valor Ganado (Earned Value

Management), un estándar del PMI que probablemente no conoces. Eso está bien — de

hecho, es parte intencional del ejercicio. Tendrás que aprenderlo durante el desarrollo.

La idea central del Valor Ganado es sencilla: no basta con saber cuánto has gastado ni

cuánto has avanzado por separado. Lo que importa es la relación entre los dos. Un

proyecto puede haber gastado el 60% del presupuesto habiendo completado solo el 40%

del trabajo — y eso es una señal de alerta. Los indicadores EVM te permiten cuantificar

exactamente eso.



### Qué debes construir

Una aplicación fullstack que permita gestionar proyectos y sus actividades, y que calcule

automáticamente los indicadores de Valor Ganado.

Backend

Necesitamos una API REST que exponga operaciones para crear, editar y eliminar

proyectos y actividades. Cada actividad debe registrar los siguientes datos:

- Nombre

- Presupuesto total planificado (BAC — Budget at Completion)

- Porcentaje de avance planificado a la fecha de corte

- Porcentaje de avance real completado

- Costo real incurrido hasta la fecha (AC — Actual Cost)

Con esos datos, el sistema debe calcular automáticamente los siguientes indicadores por

actividad y de forma consolidada por proyecto:

Indicador Fórmula

PV — Planned Value     | % planificado × BAC

EV — Earned Value     | % completado × BAC

CV — Cost Variance     |EV − AC

SV — Schedule Variance     |EV − PV

CPI — Cost Performance Index     |EV / AC

SPI — Schedule Performance Index     |EV / PV

EAC — Estimate at Completion     |BAC / CPI

VAC — Variance at Completion     |BAC − EAC

El API también debe retornar la interpretación de CPI y SPI: si el proyecto está bajo

presupuesto o sobre presupuesto, adelantado o atrasado. Un CPI mayor a 1 indica

2

eficiencia en costos; menor a 1 indica que se está gastando más de lo que se avanza. El

SPI funciona con la misma lógica pero sobre el cronograma.

Frontend

Un dashboard donde el líder de proyecto pueda ingresar y editar sus actividades, y ver el

resultado del análisis en tiempo real. Debe incluir la tabla de actividades con sus

indicadores calculados, los indicadores consolidados del proyecto, una indicación visual

del estado de CPI y SPI, y una gráfica que compare PV, EV y AC por actividad.

No pedimos un diseño elaborado. Pedimos que la información sea clara y que quien la

mire entienda de un vistazo si el proyecto va bien o mal.



'''

Explicame el problema y los conceptos de dominio y negocio, teniendo en cuenta el contexto tecnico tambien. Explica para alguien que no sabe nada del problema de dominio para ayudarle a interiorizar y entender a fondo el problema.



---

Segrega todos los aspectos claves en tres secciones:



- Hechos del producto (El proposito es usarlos para construir un PRD)

- Decisiones abiertas (El proposito es procesarlas para emitir ADRs)

- Aspectos clave faltantes que no son agrupados en los anteriores (Sugiereme como debo procesar estos aspectos)



---



Genera un fixture canonico del producto para ir agregando y probando cada decision y que se va tomando y que sirva para los tests del dominio en la fase de implementacion.