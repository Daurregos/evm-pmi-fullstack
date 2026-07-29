Genera un prompt para generar el PRD  con base a un enunciado original, con un cap de 2 paginas, que tenga en cuenta glosario de terminos (propsito: estandarizar), hechos del producto, assumptions y agrega tambien ambiguedades para solucionarlas en el proceso.



---



Crea el siguiente repo layout (the openspec layout is already created):

```

├── README.md                    # 1 screen: what, why, run it, limitations, index

├── AGENTS.md                    # agent operating rules (symlink CLAUDE.md → this)

├── docs/

│   ├── PRD.md                   # problem, users, scope, assumptions, priorities

│   ├── ARCHITECTURE.md          # container view + layers + data flow (1 diagram)

│   ├── adr/

│   │   ├── 0001-stack-and-architecture-style.md

│   │   ├── 0002-persistence-strategy.md

│   │   ├── 0003-branching-and-release-flow.md

│   │   └── ...                  # emitted as changes make decisions

│   ├── TESTING.md               # strategy, layers, gates, how to run

│   ├── OPERATIONS.md            # security, validation, logging, observability, prod

│   └── PROCESS.md               # how the agentic loop was run + evidence

├── openspec/

│   ├── specs/                   # current truth (capabilities + scenarios)

│   └── changes/

│       ├── <change-id>/{proposal.md, design.md, specs/, tasks.md}

│       └── archive/

├── api/openapi.yaml             # contract — source of truth, served as Swagger UI

├── apps/api/  apps/web/

└── .github/workflows/ci.yml     # the only definition of "done"

```



---



## Prompt PRD - Usando Brainstorming (Superpowers)

Actúa como Product Manager técnico redactando un PRD (docs/PRD.md) para un ejercicio de

evaluación. El PRD será el insumo de una serie de ADRs y luego de un SDD, así

que debe describir QUÉ y POR QUÉ, nunca CÓMO técnico.



## Insumo: enunciado original



#### El problema

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



#### Qué debes construir

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

PV — Planned Value % planificado × BAC

EV — Earned Value % completado × BAC

CV — Cost Variance EV − AC

SV — Schedule Variance EV − PV

CPI — Cost Performance Index EV / AC

SPI — Schedule Performance Index EV / PV

EAC — Estimate at Completion BAC / CPI

VAC — Variance at Completion BAC − EAC

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



## Restricción dura de longitud



Máximo 2 páginas (900–1100 palabras totales, sin contar tablas de glosario).

Respeta este presupuesto por sección; si te excedes, recorta prosa, nunca

contenido sustantivo:



1. Problema y propósito ............................ 80 palabras

2. Alcance y no-objetivos .......................... 80

3. Glosario del dominio ............................ tabla, sin límite

4. Actor y job to be done .......................... 60

5. Modelo de dominio (entidades y datos) ........... 120

6. Requisitos funcionales con criterios de aceptación 320

7. Reglas de negocio y validación .................. 120

8. Supuestos y ambigüedades resueltas .............. 180

9. Definición de terminado ......................... 60

10. Fuera de alcance y limitaciones conocidas ...... 60



Formato: markdown, tablas donde aplique, sin relleno corporativo, sin

introducciones ni cierres, sin adjetivos de marketing. Frases cortas.



## Reglas de contenido



**Distingue tres tipos de afirmación y márcalas:**

- `[E]` explícito en el enunciado

- `[D]` derivado necesariamente del dominio EVM

- `[S]` supuesto que estoy adoptando yo



**Separa con total claridad:**

- Los 5 datos CAPTURADOS por actividad (nombre, BAC, % planificado a la fecha

  de corte, % real completado, AC)

- Los 8 indicadores DERIVADOS (PV, EV, CV, SV, CPI, SPI, EAC, VAC), que nunca

  se capturan ni se editan.



**Incluye obligatoriamente estas reglas de negocio:**

- Consolidación por proyecto: se SUMAN PV, EV y AC de las actividades y los

  ratios se calculan DESPUÉS. Prohibido promediar índices. El avance del

  proyecto es EV_total / BAC_total.

- Interpretación de CPI y SPI como salida del sistema, no como cálculo del

  usuario: >1 favorable, <1 desfavorable, con banda de tolerancia alrededor de

  1 para no reportar 0.997 como desviación.

- Indicadores indefinidos por división por cero (AC=0 → CPI; PV=0 → SPI;

  EV=0 → EAC) son estados de negocio legítimos, no errores.



**Los 4 elementos obligatorios del dashboard** (tabla de actividades con

indicadores, indicadores consolidados del proyecto, indicación visual del

estado de CPI y SPI, gráfica comparativa PV/EV/AC por actividad) van como

requisitos funcionales con criterio de aceptación observable cada uno.



## Ambigüedades: resuélvelas, no las listes como preguntas



Para CADA una de las siguientes, adopta la resolución más simple que sea

defendible, márcala `[S]`, y regístrala en la sección 8 con este formato de

tabla: supuesto | justificación en una línea | impacto si resulta falso.



1. ¿La fecha de corte es atributo del proyecto, de la actividad, o es "ahora"?

2. ¿El % real puede superar el 100%? ¿Y el planificado?

3. ¿Las actividades cuyo plan aún no inicia (PV = 0) entran en la

   consolidación del proyecto?

4. ¿Existe estado de actividad (activa / cerrada / cancelada)?

5. ¿El BAC del proyecto es la suma de los BAC de sus actividades o un valor

   propio independiente?

6. ¿Eliminar un proyecto elimina sus actividades? ¿Borrado físico o lógico?

7. ¿Qué banda de tolerancia define "en plan" alrededor de CPI/SPI = 1?

8. ¿Hay más de un proyecto simultáneo o el dashboard opera sobre uno a la vez?



No inventes ambigüedades adicionales ni dejes ninguna sin resolver. Si una

resolución tiene consecuencia arquitectónica relevante, añade al final de la

fila la marca `→ ADR` para que yo la escale después, pero NO discutas la

arquitectura aquí.



## Prohibiciones



- Nada de stack, lenguaje, framework, base de datos, librerías, esquemas de

  tablas, endpoints ni nombres de archivos.

- Nada de estimaciones de esfuerzo, roadmap por fases ni cronograma.

- Nada de personas ficticias, historias de usuario narrativas ni métricas de

  negocio inventadas (adopción, retención, ingresos).

- No repitas las fórmulas EVM más de una vez: van una sola vez, en el glosario.



## Criterio de calidad



Cada criterio de aceptación debe ser verificable por un tercero sin

interpretación. Ejemplo de lo esperado: "Dado CPI = 0.87, el sistema muestra

indicador rojo y el texto 'sobre presupuesto' sin requerir que el usuario

interprete el número". Ejemplo de lo NO aceptable: "el sistema debe mostrar

el CPI de forma clara".



---



Genera un prompt reutilizable para crear ADRs basado en el PRD del proyecto ./docs/PRD.md y lista los ADRs pendintes identificados hasta el momento para tener un set cerrado, no inventes mas ADRs.



---

Actúa como arquitecto de software redactando un ADR para un proyecto de

portafolio que debe demostrar criterio senior. El ADR será insumo de un SDD.



## Contexto compartido



Lee detalladamente el PRD ubicado en ./docs/PRD.md



Set cerrado de ADRs de este proyecto:

001 Ubicación de la lógica de cálculo EVM

002 Indicadores derivados vs. persistidos

003 Representación de dinero, porcentajes y redondeo

004 Contrato de API para indicadores indefinidos

005 Modelo temporal: foto única vs. historial

006 Diseño de recursos REST y forma de la respuesta

007 Estrategia de recálculo y "tiempo real"

008 Ciclo de vida y borrado en cascada



Contexto del proyecto: aplicación pequeña, un solo usuario concurrente,

decenas de actividades por proyecto, tiempo de desarrollo limitado. La

simplicidad es un criterio de evaluación explícito; sobre-ingeniería es un

defecto, no una virtud.



## ADR a redactar



Número: <<<006a o 006b>>>

Título: <<<TÍTULO>>>

Depende de: <<<dependencias>>>

## Estructura obligatoria



# ADR-NNN — <título>

**Estado:** Aceptada · **Fecha:** <fecha>

**Relacionada con:** <IDs de requisitos, reglas o supuestos del PRD>

**Depende de:** <ADRs previos, o "ninguno">



## Contexto

## Decisión

## Alternativas consideradas

## Consecuencias

## Verificación



## Reglas de contenido



- Máximo 400 palabras en total.

- **Contexto**: qué fuerza del problema obliga a decidir. Cita el requisito o

  supuesto del PRD que lo motiva. No repitas el PRD: refiérelo.

- **Decisión**: una sola frase declarativa en presente. "Los indicadores se

  calculan en X y no se persisten." Nada de "se podría" ni "se recomienda".

- **Alternativas consideradas**: mínimo dos, cada una con una línea de por qué

  se descartó. Una de ellas debe ser una alternativa genuinamente razonable

  que alguien competente habría elegido, no un hombre de paja.

- **Consecuencias**: la sección más importante. Obligatorio incluir al menos

  una consecuencia NEGATIVA o un costo asumido. Un ADR sin costos declarados

  se rechaza.

- **Verificación**: cómo se comprueba en el código o en un test que la

  decisión efectivamente se respetó.



## Prohibiciones



- No re-decidas ningún supuesto [S] ya cerrado en el PRD; hereda su

  resolución y, si acaso, deriva su consecuencia técnica.

- No contradigas ningún hecho marcado [E] o [D] en el PRD.

- No decidas cosas que pertenecen a otro ADR del set: si el tema aparece,

  refiérelo por número y sigue.

- No propongas: caché, colas, event sourcing, CQRS, microservicios,

  websockets, ni capas de abstracción sin un requisito que las exija.

- No incluyas código, esquemas SQL ni firmas de funciones. El ADR decide, el

  SDD diseña. Se permite un ejemplo mínimo de forma de payload SOLO en

  ADR-004 y ADR-006, de tres líneas como máximo.

- No elijas lenguaje, framework, base de datos ni librerías salvo que el

  título del ADR lo pida explícitamente.



## Criterio de calidad



La prueba es: ¿un lector que discrepe con la decisión entiende exactamente

qué tendría que cambiar en el contexto para que la decisión fuera distinta?

Si el ADR no permite eso, le falta contexto o le faltan consecuencias.



---



## Prompt agente orquestador (Superpowers y OpenSpec cargados)

Eres un agente orquestador de un framework agentico de desarrollo de productos y de software, iniciamos a partir del PRD ./docs/PRD.md. El siguiente paso son los ADRs (utiliza el prompt reutilizable para generarlas), tienes a tu disposicion otro agente usando codex por terminal. Adicionalmente tienes un fixture canonico ./evm-fixture.json el cual debemos ir evolucionando.

---



#### Prompt correccion PRD y ADR-003

Entiendo, para la primera decision utilicemos tu recomendacion "alejandose de cero". Para la segunda, desde mi perspectiva los dos son bastante importantes, pero la prioridad es la tolerancia real calculada sin redondear. Que te parece si dejamos la tolerancia real, clasificar antess de redondear (seguir mostrando valor redondeado en presentacion) y agregar un signo mayor que `>` o un signo menor que `<` que comunique al usuario que es menor o mayor a ese valor y cumplimos con coincidencia visual



---

#### Prompt ADR 6

Actúa como arquitecto de software redactando un ADR para un proyecto de

portafolio que debe demostrar criterio senior. El ADR será insumo del SDD y

del contrato OpenAPI, que es un entregable exigido.



## Contexto compartido (idéntico en ambas invocaciones)



<<<PEGAR AQUÍ EL PRD COMPLETO (ya corregido)>>>

<<<PEGAR AQUÍ evm-fixture.json>>>

<<<PEGAR AQUÍ LOS ADRs 001, 002, 003, 004, 005 y 008 (ya corregidos)>>>



Set cerrado de ADRs de este proyecto:

001 Ubicación de la lógica de cálculo EVM

002 Indicadores derivados vs. persistidos

003 Representación de dinero, porcentajes y redondeo

004 Contrato de API para indicadores no evaluables

005 Modelo temporal: foto única vs. historial

006a Diseño de recursos REST

006b Forma de la respuesta y contrato de datos

007 Estrategia de recálculo tras una edición

008 Ciclo de vida y borrado en cascada



Contexto del proyecto: aplicación pequeña, un solo usuario concurrente,

decenas de actividades por proyecto, tiempo de desarrollo limitado. La

simplicidad es criterio de evaluación explícito; sobre-ingeniería es un

defecto, no una virtud.



## ADR a redactar



Número: <<<006a o 006b>>>

Título: <<<TÍTULO>>>

Depende de: <<<006a: ADR-005 y ADR-008 · 006b: ADR-003, ADR-004 y ADR-006a>>>



## Estructura obligatoria



# ADR-NNN — <título>

**Estado:** Aceptada · **Fecha:** <fecha>

**Relacionada con:** <requisitos, reglas o supuestos del PRD>

**Depende de:** <ADRs previos>



## Contexto

## Decisión

## Alternativas consideradas

## Consecuencias

## Verificación



## Reglas de contenido



- Máximo 450 palabras.

- **Contexto**: qué fuerza obliga a decidir. Cita el requisito o ADR que lo

  motiva; no repitas el PRD, refiérelo.

- **Decisión**: frases declarativas en presente, UNA IDEA POR FRASE. Nada de

  oraciones encadenadas con varias cláusulas.

- **Alternativas consideradas**: mínimo dos, con una línea de descarte cada

  una. Al menos una debe ser una opción que alguien competente habría

  elegido, no un hombre de paja.

- **Consecuencias**: obligatorio incluir al menos un costo o consecuencia

  negativa. Un ADR sin costos declarados se rechaza.

- **Verificación**: cómo se comprueba en pruebas que la decisión se

  respetó. Nombra `evm-fixture.json` explícitamente como artefacto de

  referencia.



## Preguntas que este ADR DEBE cerrar



### Si es 006a — Diseño de recursos REST

1. Anidamiento de actividades bajo proyecto frente a recursos planos con

   clave foránea, coherente con la composición que fija ADR-008.

2. Si los indicadores derivados forman parte del recurso o son un

   sub-recurso independiente.

3. Cómo se expresa la selección del proyecto que analiza el dashboard.

4. Cuántas llamadas necesita el dashboard para pintar la pantalla completa

   (tabla, consolidado y gráfica).

5. Semántica de eliminar un recurso inexistente.

No decidas nombres de campo, tipos ni formatos: son de 006b.



### Si es 006b — Forma de la respuesta y contrato de datos

1. Nombres de campo, alineados al glosario del PRD y a `evm-fixture.json`.

   Si el fixture dice `cpi`, el contrato dice `cpi`.

2. Rango del porcentaje en el cable: 0–100 o 0–1. ADR-003 fija 0–1 interno

   y el PRD §7.5 valida 0–100; el fixture usa 0–100.

3. Tipo del número en JSON: numérico o cadena. ADR-003 fija decimal interno

   y JSON usa doble IEEE; la elección debe ser consciente.

4. Si el estado y la etiqueta de interpretación viajan junto al valor.

5. Cómo viaja el par valor + representación de CPI y SPI. RESTRICCIÓN YA

   DECIDIDA, no la reabras: el API entrega el valor con precisión completa

   Y la representación ya resuelta por el backend, porque el redondeo

   destruye la información necesaria para determinar el marcador de RF-05 y

   derivarlo en el cliente duplicaría lógica de negocio contra ADR-001.

   Acota el alcance: solo CPI y SPI tienen banda, así que solo ellos

   requieren representación resuelta; los montos nunca llevan marcador.

6. Si la representación se entrega para todos los índices o solo cuando

   difiere del redondeo simple, y qué implica eso para las pruebas de

   contrato y para el fixture.

No decidas rutas ni anidamiento: son de 006a.



## Prohibiciones



- No re-decidas supuestos [S] ya cerrados en el PRD ni decisiones de ADRs

  previos; heredálos y deriva sus consecuencias.

- No decidas lo que pertenece al otro ADR del par: refiérelo por número.

- No propongas paginación, versionado de API, HATEOAS, caché, GraphQL ni

  websockets sin un requisito que los exija.

- No incluyas esquemas OpenAPI completos ni definiciones de tipos. Se

  permite un ejemplo mínimo de payload de hasta cinco líneas.

- No elijas lenguaje, framework ni librerías.



## Criterio de calidad



La prueba es: ¿un lector que discrepe entiende exactamente qué tendría que

cambiar en el contexto para que la decisión fuera distinta? Si no, falta

contexto o faltan consecuencias.
