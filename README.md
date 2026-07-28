# evm-pmi-fullstack

## Elecciones tecnológicas

| Elección | Motivo |
|---|---|
| Next.js App Router | Mantiene frontend y backend en un repositorio y un proceso. |
| PostgreSQL en Docker | Prueba tipos decimales y transacciones reales. |
| Drizzle ORM | `numeric` llega como cadena y se convierte explícitamente al `Decimal` configurado por el dominio; sus migraciones SQL permiten revisar `ON DELETE CASCADE`. |
| decimal.js | Proporciona aritmética decimal base diez según ADR-003. |

Los overrides transitivos de PostCSS y Sharp remedian avisos vigentes de Next.js
y deben retirarse cuando Next.js fije versiones corregidas.

## Comandos

- `npm run env:up`: instala, levanta PostgreSQL, migra, siembra y arranca el mock.
- `npm run env:down`: detiene PostgreSQL.
- `npm run db:seed`: carga el fixture.
- `npm test`: ejecuta la suite completa contra PostgreSQL.

## Deuda conocida

`scripts/verify-decimal.mjs` es una sonda de viabilidad independiente, ya
satisfecha y excluida de pruebas y CI. Se archivará o eliminará en el primer
slice de fase 1, cuando el dominio cubra el fixture, los empates y el viaje JSON.
