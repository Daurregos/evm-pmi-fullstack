## Context

`develop` no tiene interfaz. `src/shared/contract.ts` está congelado y cubre
todos los tipos que la lectura necesita. El mock sirve el fixture bajo
`/mock-api` y `src/ui/api-base-url.ts` ya resuelve la base pública.

Las fuentes cerradas son `docs/PRD.md`, los ADR, `contracts/evm/openapi.yaml` y
`contracts/evm/evm-fixture.json`. El diseño exploratorio aprobado, con sus
alternativas y supuestos, está en
`docs/superpowers/specs/2026-07-29-slice-b1-readonly-dashboard-design.md`.

## Goals / Non-Goals

**Goals:**

- Materializar RF-06, RF-07, RF-08 y RF-09 sobre una sola lectura.
- Seleccionar proyecto desde la colección y tolerar el proyecto vacío.
- Presentar índices con `display` y formatear montos y avance en el cliente.
- Respaldar con pruebas las afirmaciones de ADR-001 y ADR-007 sobre el cliente.

**Non-Goals:**

- Mutaciones, formularios y validación de entrada.
- Backend real, persistencia y casos de uso.
- Cambios a las fuentes cerradas, a `src/shared/` o al mock.

## Decisions

### El cliente presenta, no interpreta

ADR-001 y ADR-004 dejan en el backend el cálculo, la clasificación y la
resolución de los marcadores. La interfaz muestra `cpi.display` y `spi.display`
literalmente y usa `value` solo para la gráfica. El texto de estado proviene de
`label`.

Los montos son la única excepción: `$wirePrecision` los transporta sin redondear
y encarga su presentación al frontend. Se presentan con dos decimales, coma
decimal, punto de millar y `−` para el negativo, según el criterio literal de
RF-03. El avance se presenta como porcentaje entero. `toFixed` redondea los
empates alejándose de cero sobre el valor absoluto, la convención del PRD §7.4,
y el agrupamiento se aplica a la cadena para no depender del locale del entorno.

### Aritmética y vocabulario EVM no coexisten en un módulo

ADR-001 y ADR-007 afirman que el cliente no contiene fórmulas EVM. La revisión
estructural recorre el AST de `src/ui/**` y `src/app/**`, excluido
`src/app/mock-api/**`, y falla si un módulo que menciona vocabulario EVM
contiene una expresión aritmética. Una fórmula EVM requiere operar sobre ese
vocabulario, de modo que la afirmación queda comprobable sin inferencia de
tipos.

La revisión no puede descartar que alguien copie los valores a nombres neutros
antes de operar. Para cubrir ese hueco, una prueba de comportamiento sirve una
carga centinela desde la API simulada y comprueba que la vista muestra
exactamente lo que llegó.

### Presentación pura y un contenedor delgado

`evm-api-client.ts` y `dashboard-data.ts` reciben una implementación de `fetch`
y devuelven datos; los componentes reciben props. `dashboard-view.tsx` es el
único con estado y solo enlaza `useState` y `useEffect` con esas funciones.

Así las pruebas de cliente usan `react-dom/server` sin DOM ni dependencias
nuevas de prueba. El precio es que los efectos y el `change` del selector no se
ejercitan en ejecución, y el contenedor se mantiene delgado a propósito.

### Recharts 2.15.4

Recharts 3 traslada el trazado a efectos y en `renderToStaticMarkup` produce un
contenedor vacío, con lo que RF-09 quedaría sin prueba en el nivel de cliente.
La rama 2.x renderiza el SVG completo en servidor. Se acepta su marca de rama no
activa y se registra como deuda técnica en `README.md`.

El eje se rotula con `activity.id`, que la tabla repite en su primera columna:
los nombres completos no caben y derivar `A1…A8` exigiría aritmética sobre un
índice.

### «Avance anticipado» se omite

RF-08 lo permite sin exigirlo y el fixture declara que el contrato no lleva
campo propio para ese caso. Derivarlo de `sv > 0` sería interpretación en el
cliente. Se registra como candidato a campo del contrato.

## Risks / Trade-offs

- **Recharts 2.x no recibe correcciones.** Mitigación: la gráfica es un
  componente aislado y su reemplazo no toca el resto de la vista.
- **Los efectos del contenedor no se prueban.** Mitigación: el contenedor no
  contiene lógica propia; la carga y la presentación sí se prueban.
- **La suma de montos redondeados de la tabla puede diferir del consolidado por
  centavos**, como advierte ADR-003. No se corrige: corregirlo exigiría
  redondear en el cálculo.

## Migration Plan

Cambio aditivo. `NEXT_PUBLIC_EVM_API_BASE_URL` sigue apuntando al mock por
omisión; apuntarla al backend real no requiere editar código.

## Open Questions

Ninguna que bloquee la implementación.
