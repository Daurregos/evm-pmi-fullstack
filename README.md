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

Las reglas de fronteras de imports y de uso decimal quedaron aisladas en
`chore/phase-0-lint-rules-wip` (`ed0107f`). Por prioridad de tiempo no forman
parte todavía de `npm test` ni de CI; deben retomarse antes de cerrar la fase 0.

El workflow actual cubre instalación reproducible, migración, tipos y las
pruebas estructurales, de integración y de contrato con PostgreSQL. El paso de
lint se añadirá al recuperar la rama anterior.

`npm audit` de producción no reporta vulnerabilidades. Permanecen avisos en
herramientas de desarrollo transitivas de Drizzle Kit y ESLint cuyo arreglo
automático exige cambios incompatibles.
