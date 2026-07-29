# Diseño del primer slice de dominio EVM

**Fecha:** 2026-07-28
**Estado:** Aprobado para planificación
**Base:** `origin/develop`, que ya integra `chore/phase-0-scaffold`

## Objetivo

Implementar el primer slice de la fase 1: un módulo de dominio EVM puro,
exhaustivamente probado contra el fixture contractual, junto con las reglas de
lint y CI que protegen sus fronteras. El slice no introduce persistencia, casos
de uso, HTTP ni interfaz.

Las fuentes cerradas aplicables son `docs/PRD.md`, `docs/TESTING.md`, los ADR
aceptados, `contracts/evm/openapi.yaml` y
`contracts/evm/evm-fixture.json`. La implementación no modifica ninguna.

## Integración y trazabilidad

La rama de trabajo parte de `origin/develop`. El commit
`ed0107f745fe6bbd231f4db254a235e6b4f47a47` se integra mediante un merge
explícito de `chore/phase-0-lint-rules-wip`; los conflictos se resuelven contra
la estructura final del scaffold sin conservar tipos o archivos paralelos que
dupliquen el contrato de dominio vigente.

El trabajo se administra mediante un cambio OpenSpec dedicado. La propuesta,
el diseño, las specs y las tareas de ese cambio referencian este documento y
las fuentes cerradas, pero no reproducen ni alteran sus decisiones.

## Arquitectura de dominio

El dominio expone tres operaciones puras:

1. `deriveFromMagnitudes(bac, pv, ev, ac)` es la única primitiva que calcula
   CV, SV, CPI, SPI, EAC, VAC, el estado derivado y las interpretaciones.
2. `deriveActivity(input)` recibe los porcentajes ya normalizados como
   fracciones internas, deriva PV y EV sin redondeo intermedio y delega las
   cuatro magnitudes a `deriveFromMagnitudes`. La conversión desde el rango
   externo 0–100 pertenece a una frontera posterior y queda fuera del slice.
3. `consolidateProject(activities)` deriva las magnitudes de cada actividad,
   suma únicamente BAC, PV, EV y AC, y delega los totales a la misma
   `deriveFromMagnitudes`. Después añade el avance del proyecto y el conteo de
   actividades con EV positivo y AC cero.

No habrá dos funciones paralelas para fórmulas, clasificación o
interpretación. El proyecto vacío usa la misma primitiva con cuatro magnitudes
en cero y añade sus dos campos propios.

## Modelo de resultados

Los montos calculados permanecen como `Decimal` hasta la frontera consumidora.
CPI y SPI siempre están presentes con `value`, `display`, `status` y `label`;
solo `value` y `display` admiten `null`. Los estados son `unfavorable`,
`neutral`, `favorable` y `not_evaluable`, y las etiquetas se mantienen en
español.

El resultado de una actividad contiene los ocho indicadores y su estado
derivado. El consolidado contiene las magnitudes y los ocho indicadores, más
`progress` y `activitiesWithEvAndZeroAc`. La representación interna no conoce
JSON, HTTP, Next, Drizzle ni PostgreSQL.

`ActivityState` usa los valores internos en inglés `not_started`,
`planned_without_progress`, `progress_without_cost`,
`cost_without_progress` y `progress_with_cost`. No se publica en el contrato
HTTP. Las pruebas enlazan esos valores con las anotaciones `$state` del fixture
sin incorporar dichas claves auxiliares a una respuesta contractual.

Las divisiones no evaluables se modelan como resultados legítimos. En
particular, CPI cero definido se conserva como valor desfavorable, mientras
EAC y VAC permanecen no evaluables cuando CPI es cero.

## Precisión y presentación

`src/domain/decimal.ts` continúa como único propietario de la configuración de
`decimal.js` y de las operaciones de presentación. Los cálculos no cuantizan
resultados intermedios. La clasificación usa el índice completo contra la
banda inclusiva y el `display` se deriva después mediante el único redondeo de
presentación.

La función de presentación cubre índices y magnitudes sin dispersar llamadas a
`toDecimalPlaces`, `toFixed`, `Decimal.set` ni equivalentes. Los marcadores
solo aparecen cuando un valor fuera de la banda se proyecta exactamente sobre
uno de sus límites visibles.

## Estrategia TDD y oráculo

Cada comportamiento de dominio entra mediante un ciclo rojo-verde-refactor. Las
pruebas cargan directamente `contracts/evm/evm-fixture.json`; nunca calculan el
valor esperado con fórmulas equivalentes ni modifican el fixture.

La suite de dominio se organiza por responsabilidad:

- aritmética y forma de las ocho actividades;
- consolidación, avance y conteo del resumen;
- proyecto vacío;
- cinco estados del PRD y cuatro combinaciones de evaluabilidad;
- forma estable de CPI/SPI y distinción entre cero definido y `null`;
- siete casos de banda neutral y marcadores;
- tres aserciones negativas obligatorias de consolidación y precisión;
- redondeo decimal, incluidos `1,005`, `-1,005`, `0,625` y la ida y vuelta por
  número JSON.

Las comparaciones numéricas convierten los valores del fixture a `Decimal` y
comprueban igualdad decimal; los tests no vuelven a derivar resultados
esperados.

## Lint y CI

La configuración base de ESLint se recupera del WIP y se adapta a los archivos
actuales. Solo `src/` queda sujeto a las prohibiciones de arquitectura y
política decimal; `scripts/` y `contracts/` permanecen fuera de ellas.

Las fronteras exigidas son:

- `domain/` no depende de `app/`, `ui/`, `infrastructure/`, Next ni ORM;
- `ui/` no depende de `domain/`, `application/` ni `infrastructure/`;
- `application/` no depende de `app/` ni `ui/`;
- fuera de `src/domain/decimal.ts`, ningún archivo de `src/` configura o
  cuantiza un `Decimal` de dominio.

Los tests estructurales ejercitan imports estáticos, reexports, imports
dinámicos, `require`, rutas relativas y alias. Además de esas sondas
automatizadas, se añadirá temporalmente un import prohibido real en un archivo
de `domain/`, se ejecutará `npm run lint` para observar el fallo y se restaurará
el archivo antes del cierre.

CI ejecutará `npm run lint` y `npm run lint:imports` además de las verificaciones
ya existentes.

## Retirada de la sonda decimal

`scripts/verify-decimal.mjs` solo se elimina después de que las pruebas de
dominio demuestren los tres empates exigidos y la ida y vuelta mediante número
JSON. Si alguna garantía no puede trasladarse sin violar el alcance del
dominio, la sonda se conserva y el motivo se informa; no se elimina por
redundancia presumida.

## Verificación y cierre

El cierre exige evidencia fresca de:

- suite de dominio aislada, sin base de datos, Next ni HTTP;
- aserciones positivas y negativas contra el fixture;
- `npm run lint`, `npm run lint:imports`, `npm run typecheck` y suite completa;
- demostración fallida y revertida del import prohibido;
- `git diff --check`;
- correspondencia explícita entre cada afirmación de `Verificación` de ADR-001
  y una prueba o revisión estructural;
- ausencia de cambios en las fuentes cerradas y de cambios locales ajenos;
- PR dirigido a `develop`, sin fusionarlo sin autorización.

El cambio OpenSpec se archiva únicamente después de completar sus tareas y
repetir todas las verificaciones.
