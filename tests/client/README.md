# Pruebas de cliente

Este nivel prueba el dashboard contra una API simulada que sirve
`contracts/evm/evm-fixture.json`. Los valores esperados se leen del fixture;
nunca se recalculan.

`simulated-api.ts` construye una implementación de `fetch` sobre las rutas de
ADR-006a: la colección, el proyecto de referencia, el proyecto sin actividades,
las ocho operaciones y las envolventes de error. Sustituye al mock HTTP sin
levantar Next. `requests` registra las rutas, y `calls`, el verbo, la ruta y el
cuerpo de cada petición en orden: sin ese orden no se puede demostrar que un
reintento de refresco no repite la escritura.

`render.tsx` renderiza componentes con `react-dom/server` y ofrece utilidades
para leer el marcado: texto visible, atributos, filas de tabla y campos
`data-field`.

Los componentes son presentacionales y reciben datos por props, así que este
nivel no monta React ni necesita DOM. La contrapartida es que los efectos no se
ejercitan: ni el `change` del selector ni el `showModal` de `src/ui/modal.tsx`.
Por eso el comportamiento de la edición vive en módulos sin React
—`activity-form-state.ts`, `project-form-state.ts`, `form-feedback.ts`,
`mutation-flow.ts` y `dashboard-mutations.ts`—, y es allí donde se prueba.

`mutation-flow.test.tsx` cubre la mitad de cliente de la sección `Verificación`
de ADR-007: la digitación no dispara peticiones, una mutación rechazada no
refresca y una exitosa sí, y un refresco fallido se reintenta con una sola
escritura registrada. También comprueba el criterio de RF-01 al eliminar el
proyecto seleccionado.

Las cadenas de presentación de montos y porcentajes son la única expectativa
autorizada aquí que no proviene del fixture, porque el contrato los transporta
sin redondear y `docs/TESTING.md` asigna su verificación a este nivel. Del texto
de `message` se asevera la presencia, nunca la redacción: las pruebas de
infracciones comparan `field` y `rule`.

`client-boundaries.test.ts` es la revisión estructural de ADR-001 y ADR-007:
comprueba la frontera de importaciones y que ningún módulo del cliente mezcle
vocabulario EVM con aritmética. Lo que no puede descartar —copiar los valores a
nombres neutros antes de operar— lo cubre la carga centinela de
`dashboard-data.test.tsx`.
