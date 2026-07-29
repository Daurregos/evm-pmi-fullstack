# UI

Componentes de cliente. Presentan payloads recibidos y no calculan indicadores.

`api-base-url.ts` resuelve la base HTTP desde `NEXT_PUBLIC_EVM_API_BASE_URL`.
`evm-api-client.ts` cubre las ocho operaciones publicadas y `dashboard-data.ts`
compone la carga inicial y la aplicación de un refresco; ambos reciben una
implementación de `fetch` para poder probarse contra la API simulada.
`format.ts` e `index-status.ts` concentran la presentación numérica y el
tratamiento visual del estado.

La edición vive en módulos sin React, de modo que su comportamiento se prueba sin
DOM:

- `activity-form-state.ts` y `project-form-state.ts` guardan lo digitado como
  cadenas crudas y solo serializan al confirmar. No validan, no redondean y no
  recortan: eso pertenece al backend.
- `form-feedback.ts` reparte las infracciones de un `422` por `field` y clasifica
  por `code`. El texto de `message` se muestra y nunca se inspecciona.
- `mutation-flow.ts` ejecuta la escritura y, solo si tuvo éxito, el refresco. Su
  resultado desactualizado conserva únicamente la lectura, así que un reintento
  no puede repetir la escritura.
- `dashboard-mutations.ts` declara, por operación, qué lecturas componen el
  refresco.

Los componentes son presentacionales y reciben datos por props.
`dashboard-view.tsx` es el único con estado y solo enlaza React con esos módulos:
ADR-007 reemplaza tabla, consolidado y gráfica desde una única lectura, que se
aplica en un solo `setState`, así que no hay fusión ni recálculo en el cliente.

`modal.tsx` es la excepción deliberada: contiene un efecto que abre y cierra el
`<dialog>` nativo, que el nivel de cliente no ejercita. Por eso no contiene nada
más.

Ningún componente importa CSS. Toda la presentación vive en
`src/app/globals.css`, de modo que las pruebas de cliente renderizan los
componentes sin resolver hojas de estilo.

Invariante que respalda ADR-001 y ADR-007: un módulo que menciona vocabulario
EVM no contiene aritmética. La geometría de la gráfica pertenece a Recharts, no
a este árbol.
