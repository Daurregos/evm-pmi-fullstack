## Why

El producto tiene dominio, contrato y mock, pero no tiene interfaz: `src/app/`
solo contiene los handlers del mock y no existe una página. RF-06 a RF-09 no
están materializados y `docs/TESTING.md` declara un nivel de cliente que hoy no
tiene casos. El backend real avanza en paralelo, así que la interfaz debe
construirse contra el mock y cambiar de origen sin editar código.

## What Changes

- Añadir la lectura del dashboard: tabla de actividades con los cinco datos
  capturados y los ocho indicadores, consolidado del proyecto con avance y
  conteo de actividades con EV positivo y AC cero, estado visual de CPI y SPI,
  y gráfica de PV, EV y AC por actividad.
- Añadir el selector de proyecto alimentado por la colección y el
  comportamiento del proyecto sin actividades.
- Presentar los índices con `display` tal cual, marcadores incluidos, y
  formatear los montos y el avance en el cliente.
- Añadir el shell del App Router —`layout.tsx`, `page.tsx` y la hoja global— y
  el cliente HTTP de lectura sobre `NEXT_PUBLIC_EVM_API_BASE_URL`.
- Añadir pruebas de cliente contra una API simulada que sirve el fixture y una
  revisión estructural que respalda ADR-001 y ADR-007 sobre el cliente.
- Añadir `recharts` como dependencia de producción para RF-09.

## Capabilities

### New Capabilities

- `evm-dashboard-client`: lectura del proyecto seleccionado, presentación de
  indicadores y estado visual en la interfaz.

### Modified Capabilities

Ninguna.

## Impact

El cambio afecta `src/ui/`, `src/app/` fuera de `mock-api`, `tests/client/`,
`package.json`, `tsconfig.json`, `README.md` y artefactos OpenSpec. No modifica
`docs/PRD.md`, los ADR, el fixture, el OpenAPI, `src/shared/`, `src/domain/`,
`src/application/`, `src/infrastructure/` ni el mock. No implementa mutaciones,
que pertenecen a la rebanada siguiente contra el backend real.
