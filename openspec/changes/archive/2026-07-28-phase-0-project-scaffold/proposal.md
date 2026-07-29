## Why

El repositorio tiene decisiones de producto, arquitectura, contrato y pruebas,
pero todavía no cuenta con una base ejecutable que haga cumplir esas decisiones.
La fase 0 debe establecer las fronteras y la infraestructura antes de introducir
cualquier lógica EVM.

## What Changes

- Crear el esqueleto Next.js y las carpetas de dominio, aplicación,
  infraestructura, App Router, UI y tipos compartidos.
- Automatizar con ESLint la dirección permitida de imports y el único punto de
  configuración y redondeo decimal dentro de `src/`.
- Incorporar PostgreSQL en Docker, Drizzle ORM y una migración de dos tablas con
  columnas `numeric` explícitas y borrado en cascada garantizado por la base.
- Añadir un repositorio único, el mapeo explícito de `numeric` a `Decimal` y una
  prueba de integración de ida y vuelta contra PostgreSQL real.
- Servir un mock HTTP de lectura y errores exclusivamente desde
  `contracts/evm/evm-fixture.json`.
- Sembrar los dos proyectos y las ocho actividades del fixture sin persistir
  indicadores derivados.
- Proveer guiones evidentes para levantar, sembrar y probar, además de CI con
  PostgreSQL.
- Mover la sonda decimal independiente a `scripts/`, fuera de suite y CI, y
  registrar su retiro futuro como deuda conocida.

## Capabilities

### New Capabilities

- `project-scaffold`: Define el entorno ejecutable de fase 0, sus fronteras de
  dependencia, persistencia mínima, mock contractual, semilla, pruebas
  infraestructurales y automatización.

### Modified Capabilities

Ninguna. El contrato EVM publicado no cambia; el mock solo materializa ejemplos
ya aprobados.

## Impact

El cambio añade configuración de Node.js, Next.js, TypeScript, ESLint, Drizzle,
PostgreSQL, Docker Compose y GitHub Actions. Crea código de infraestructura y
firmas de dominio sin fórmulas EVM, modifica el README y reorganiza la sonda
decimal existente. No modifica el PRD, supuestos, ADR, estrategia de pruebas,
OpenAPI ni fixture.
