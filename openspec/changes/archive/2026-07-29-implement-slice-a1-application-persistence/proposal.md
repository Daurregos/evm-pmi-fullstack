## Why

El dominio EVM, la migración de PostgreSQL y el contrato compartido ya están
cerrados, pero todavía no existe una capa que convierta los datos persistidos
en operaciones de producto seguras. Se necesita completar esa frontera antes
de implementar HTTP real en A2 para que la API y la interfaz no repliquen
validación, transacciones ni cálculo EVM.

## What Changes

- Ampliar el puerto de persistencia y su implementación Drizzle para crear,
  consultar, reemplazar y eliminar proyectos y actividades mediante PostgreSQL
  real.
- Añadir casos de uso de proyecto y actividad, listado y análisis de proyecto.
  El análisis invoca exclusivamente el módulo de dominio y entrega los DTO
  publicados sin persistir indicadores.
- Añadir validación de negocio acumulativa conforme a ADR-009: normalización de
  nombre, obligatoriedad, límites numéricos, campos de lectura y propiedades
  desconocidas; una entrada rechazada no muta estado.
- Demostrar las garantías de ADR-002, ADR-005 y ADR-008 con integración real,
  incluida la reversión de una falla durante la cascada.
- Crear `docs/ARCHITECTURE.md` como vista breve y factual de capas, recorrido,
  frontera de cálculo y ADRs, dejando explícito que HTTP real corresponde a A2.

## Capabilities

### New Capabilities

- `evm-application-persistence`: casos de uso, validación de negocio y
  persistencia transaccional de la foto EVM vigente.

### Modified Capabilities

Ninguna.

## Impact

Modifica `src/application/`, `src/infrastructure/database/` y pruebas de
integración; añade documentación arquitectónica y artefactos OpenSpec. No
cambia el PRD, ADR, fixture, OpenAPI, `domain/`, `shared/`, `ui/`, páginas ni
mock. No añade dependencias ni rutas HTTP reales.
