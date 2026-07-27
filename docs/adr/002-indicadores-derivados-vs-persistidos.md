# ADR-002 — Indicadores derivados vs. persistidos

**Estado:** Aceptada · **Fecha:** 2026-07-26

**Relacionada con:** RF-02, RF-03, RF-04, RF-05, RF-07, RF-08; modelo del PRD §5 y reglas §7.1–§7.3

**Depende de:** ADR-001

## Contexto

RF-02 y el modelo del PRD §5 limitan el estado editable de una actividad a los cinco datos capturados; RF-03, RF-04 y §7 definen indicadores, consolidado e interpretaciones como resultados derivados. ADR-001 ubica su cálculo en un único módulo del backend. Debe decidirse si esos resultados también forman parte del estado persistente. Para un usuario concurrente y decenas de actividades, evitar inconsistencias pesa más que optimizar lecturas.

## Decisión

La persistencia conserva únicamente los datos fuente del proyecto y sus actividades; los indicadores EVM, las interpretaciones y los resultados consolidados se obtienen del módulo definido por ADR-001 y no se persisten.

## Alternativas consideradas

- **Persistir todos los resultados derivados:** aceleraría lecturas y facilitaría consultas por indicador, pero duplicaría el estado y exigiría sincronizarlo después de cada edición.
- **Persistir solo PV y EV:** facilitaría algunas agregaciones y sería razonable con una carga analítica mayor, pero todavía introduciría fuentes redundantes con poco beneficio en la escala prevista.

## Consecuencias

- Los datos capturados son la única fuente de verdad y no existen indicadores almacenados que puedan quedar obsoletos.
- Corregir una regla modifica cálculos posteriores sin migrar resultados derivados.
- Materializar los resultados exige calcularlos desde los datos fuente; el costo es asumible para decenas de actividades.
- Filtrar u ordenar directamente en persistencia por CPI, SPI u otros derivados deja de ser trivial. Si esas consultas dominan el uso, la decisión deberá revisarse.
- ADR-007 decide cuándo y en qué flujo calcular; ADR-006 define nombres, agrupación y forma general de las respuestas REST.

## Verificación

Una revisión del modelo de persistencia confirma que no contiene PV, EV, CV, SV, CPI, SPI, EAC, VAC, interpretaciones ni consolidados. Pruebas de integración modifican BAC, avance planificado, avance real y AC para comprobar los cambios derivados correspondientes; editar el nombre conserva los indicadores y ninguna operación escribe resultados calculados.
