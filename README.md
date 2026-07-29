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

## Mock y base HTTP del cliente

El mock derivado de `contracts/evm/evm-fixture.json` vive bajo
`/mock-api`; por ejemplo, la colección está en
`GET /mock-api/projects`.

El cliente lee `NEXT_PUBLIC_EVM_API_BASE_URL`. Sin configuración usa
`/mock-api`. Puede recibir una ruta relativa, una URL absoluta o `/` para el
backend real en el mismo origen:

```bash
NEXT_PUBLIC_EVM_API_BASE_URL=/mock-api
NEXT_PUBLIC_EVM_API_BASE_URL=https://api.example.test
NEXT_PUBLIC_EVM_API_BASE_URL=/
```

Cambiar de mock a backend no requiere cambios de código. Como es una variable
`NEXT_PUBLIC_`, Next.js incorpora su valor al build del cliente.

## Contrato compartido durante el trabajo paralelo

`src/shared/contract.ts` contiene el contrato HTTP completo que consumen
backend y frontend y queda cerrado durante esta fase. Si una vía necesita otro
tipo, debe detenerse y reportar la divergencia; no debe ampliar `src/shared/`
de manera unilateral.

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
- `npm audit --omit=dev` no reporta vulnerabilidades. Permanecen avisos en
  dependencias transitivas de desarrollo de Drizzle Kit y ESLint cuya
  corrección automática exige cambios incompatibles.
