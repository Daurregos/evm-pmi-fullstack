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

## Seguimiento técnico

Deuda no bloqueante posterior al andamiaje:

- Añadir una prueba de integración del borrado en cascada real; hoy se comprueba
  la declaración `ON DELETE CASCADE` de la migración y del catálogo PostgreSQL.
- Automatizar las regresiones de interrupción y servidor obsoleto del runner
  contractual; `SIGINT`, `SIGTERM` y el rechazo de otra instancia se verificaron
  manualmente. Evitar además duplicar en la prueba el algoritmo de limpieza de
  claves `$`.
- Fijar el digest de la imagen PostgreSQL y añadir una comprobación de deriva
  entre el esquema Drizzle y la migración cuando se endurezca CI.
- Evitar ejecuciones concurrentes del test de semilla sobre la misma base, pues
  usa los identificadores canónicos del fixture.
- Ejecutar `npm test` sin otro `next dev` activo en el mismo worktree; Next 16
  protege el directorio con un único bloqueo aunque se usen puertos distintos.
- `scripts/verify-decimal.mjs` es una sonda independiente ya satisfecha. Debe
  archivarse o eliminarse en el primer slice de fase 1, cuando el dominio cubra
  el fixture, los empates y el viaje JSON.
- `npm audit --omit=dev` no reporta vulnerabilidades. Permanecen avisos en
  dependencias transitivas de desarrollo de Drizzle Kit y ESLint cuya
  corrección automática exige cambios incompatibles.
