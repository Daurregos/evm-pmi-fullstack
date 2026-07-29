# evm-pmi-fullstack

## Elecciones tecnológicas

| Elección | Motivo |
|---|---|
| Next.js App Router | Mantiene frontend y backend en un repositorio y un proceso. |
| PostgreSQL en Docker | Prueba tipos decimales y transacciones reales. |
| Drizzle ORM | `numeric` llega como cadena y se convierte explícitamente al `Decimal` configurado por el dominio; sus migraciones SQL permiten revisar `ON DELETE CASCADE`. |
| decimal.js | Proporciona aritmética decimal base diez según ADR-003. |
| Recharts | Grafica PV, EV y AC por actividad sin construir un SVG a mano. |

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

## Dashboard

`npm run dev` levanta el dashboard en `/`. Sin configuración lee el mock, así
que muestra el proyecto de referencia del fixture con sus ocho actividades, los
cuatro estados visuales y un consolidado desfavorable. El selector cambia al
proyecto sin actividades.

Reparto de responsabilidades en la presentación:

- Los índices se muestran con `cpi.display` y `spi.display` tal cual. Los
  marcadores `<0,99` y `>1,01` son lógica de negocio que resuelve el backend
  (ADR-004); el cliente no los deriva. `value` solo alimenta la gráfica.
- Los montos y los porcentajes cruzan sin redondear y el cliente los presenta:
  montos con dos decimales, coma decimal, punto de millar y `−` para el
  negativo; el avance del proyecto como porcentaje entero y los porcentajes
  capturados con los decimales registrados, según el PRD §7.4.
- La gráfica y la primera columna de la tabla identifican cada actividad por su
  nombre. En la gráfica se recorta cuando es largo; la tabla lo muestra
  completo.
- El estado visual proviene de `status`. `neutral` y `not_evaluable` comparten
  apariencia, como pide RF-08, y siguen siendo estados distintos en el código y
  en el marcado.

El cliente no calcula indicadores. `tests/client/client-boundaries.test.ts`
comprueba que ningún módulo de `src/ui/` importa capas de servidor y que ningún
módulo del cliente mezcla vocabulario EVM con aritmética.

## Contrato compartido durante el trabajo paralelo

`src/shared/contract.ts` contiene el contrato HTTP completo que consumen
backend y frontend y queda cerrado durante esta fase. Si una vía necesita otro
tipo, debe detenerse y reportar la divergencia; no debe ampliar `src/shared/`
de manera unilateral.

## Seguimiento técnico

Deuda no bloqueante posterior al andamiaje:

- Recharts está fijado en `2.15.4`, rama que su autor marca como no activa.
  Recharts 3 traslada el trazado a efectos y en `renderToStaticMarkup` produce
  un contenedor vacío, con lo que RF-09 quedaría sin prueba en el nivel de
  cliente. Actualizar exige antes un nivel de prueba con DOM.
- Las pruebas de cliente renderizan con `react-dom/server`, así que no ejercitan
  efectos ni el `change` del selector. `src/ui/dashboard-view.tsx` se mantiene
  sin lógica propia por esa razón.
- Con `PV = 0` y `SV` positivo, RF-08 permite mostrar «avance anticipado». No se
  implementa: el contrato no lleva campo para esa nota y derivarla en el cliente
  sería interpretación, contra ADR-001. Requiere decidir un campo del contrato.
- ADR-003 conserva la frase indiferenciada «redondea montos e índices a dos
  decimales y el avance a porcentaje entero». Bajo el glosario del PRD §3 ese
  «avance» es el del proyecto, pero el texto no lo dice, así que es el único
  artefacto autoritativo que quedó sin desambiguar después de aclarar el PRD
  §7.4, la spec del dashboard y `docs/ASSUMPTIONS.md`. Corregirlo exige el flujo
  de ADR.

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
