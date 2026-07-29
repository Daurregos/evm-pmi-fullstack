# UI

Componentes de cliente. Presentan payloads recibidos y no calculan indicadores.

`api-base-url.ts` resuelve la base HTTP desde `NEXT_PUBLIC_EVM_API_BASE_URL`.
`evm-api-client.ts` y `dashboard-data.ts` leen la colección y el análisis del
proyecto; reciben una implementación de `fetch` para poder probarse contra la
API simulada. `format.ts` e `index-status.ts` concentran la presentación
numérica y el tratamiento visual del estado.

Los componentes son presentacionales y reciben datos por props.
`dashboard-view.tsx` es el único con estado y solo enlaza React con las
funciones de carga: ADR-007 reemplaza tabla, consolidado y gráfica desde una
única lectura, así que no hay fusión ni recálculo en el cliente.

Ningún componente importa CSS. Toda la presentación vive en
`src/app/globals.css`, de modo que las pruebas de cliente renderizan los
componentes sin resolver hojas de estilo.

Invariante que respalda ADR-001 y ADR-007: un módulo que menciona vocabulario
EVM no contiene aritmética. La geometría de la gráfica pertenece a Recharts, no
a este árbol.
