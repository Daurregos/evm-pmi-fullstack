# Pruebas de cliente

Este nivel prueba el dashboard contra una API simulada que sirve
`contracts/evm/evm-fixture.json`. Los valores esperados se leen del fixture;
nunca se recalculan.

`simulated-api.ts` construye una implementación de `fetch` sobre las rutas de
ADR-006a: la colección, el proyecto de referencia, el proyecto sin actividades y
las envolventes de error. Sustituye al mock HTTP sin levantar Next.

`render.tsx` renderiza componentes con `react-dom/server` y ofrece utilidades
para leer el marcado: texto visible, atributos, filas de tabla y campos
`data-field`.

Los componentes son presentacionales y reciben datos por props, así que este
nivel no monta React ni necesita DOM. La contrapartida es que los efectos y el
`change` del selector no se ejercitan: `src/ui/dashboard-view.tsx` se mantiene
sin lógica propia por esa razón.

Las cadenas de presentación de montos y porcentajes son la única expectativa
autorizada aquí que no proviene del fixture, porque el contrato los transporta
sin redondear y `docs/TESTING.md` asigna su verificación a este nivel.

`client-boundaries.test.ts` es la revisión estructural de ADR-001 y ADR-007:
comprueba la frontera de importaciones y que ningún módulo del cliente mezcle
vocabulario EVM con aritmética. Lo que no puede descartar —copiar los valores a
nombres neutros antes de operar— lo cubre la carga centinela de
`dashboard-data.test.tsx`.
