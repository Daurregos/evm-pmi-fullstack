# Slice B1 — Dashboard de solo lectura

**Fecha:** 2026-07-29 · **Rama:** `feat/slice-b1-readonly-dashboard`

## Contexto

`develop` tiene el andamiaje, el dominio, el mock bajo `/mock-api` y
`src/shared/contract.ts` congelado. No existe interfaz: `src/app/` solo contiene
los handlers del mock y no hay `layout.tsx` ni `page.tsx`.

Esta rebanada construye la lectura del dashboard en paralelo con el backend.
Consume el mock a través de `NEXT_PUBLIC_EVM_API_BASE_URL` y no toca
`domain/`, `application/`, `infrastructure/`, `shared/`, el mock ni las rutas
del contrato real.

Fuentes cerradas: `docs/PRD.md`, `docs/adr/`, `contracts/evm/openapi.yaml` y
`contracts/evm/evm-fixture.json`. `src/shared/contract.ts` cubre todo lo que la
interfaz necesita; no falta ningún tipo.

## Objetivos y no-objetivos

**Objetivos.** RF-06 tabla de actividades, RF-07 consolidado, RF-08 estado
visual de CPI y SPI, RF-09 gráfica de PV, EV y AC por actividad, selector de
proyecto desde la colección y el caso de proyecto vacío. Que quien mire
entienda de un vistazo si el proyecto va bien o mal.

**No-objetivos.** Edición y mutaciones (B2, contra el backend real), backend,
rutas reales, persistencia, validación y cambios a las fuentes cerradas.

## Decisiones

### El cliente no calcula: transporta y formatea

Los índices se muestran con `cpi.display` y `spi.display` tal cual, marcadores
`<0,99` y `>1,01` incluidos, porque ADR-004 encarga esa resolución al backend.
`value` queda para la gráfica y el ordenamiento.

Los montos cruzan sin redondear (`$wirePrecision`) y el frontend los presenta
con dos decimales, coma decimal y punto de millar, según el criterio literal de
RF-03: `1.250,00`, `−250,00`. El signo negativo usa `−` (U+2212) como en el
PRD. El avance se presenta como porcentaje entero: `33 %`.

`Number.prototype.toFixed` opera sobre el valor absoluto y redondea los empates
alejándose de cero, que es la convención del PRD §7.4. El agrupamiento y la
coma se aplican sobre la cadena resultante, sin `Intl`, para que la salida no
dependa de los datos de locale del entorno.

### Invariante estructural: aritmética y vocabulario EVM no coexisten

Una revisión estructural recorre el AST de `src/ui/**` y `src/app/**`, excluido
`src/app/mock-api/**`, y exige que **ningún módulo que mencione vocabulario EVM
contenga una expresión aritmética**. Una fórmula EVM necesita operar sobre ese
vocabulario, así que la separación es comprobable en lugar de declarativa.
Se acompaña de dos comprobaciones más: `src/ui/**` no importa `domain/`,
`application/` ni `infrastructure/`, y una prueba de comportamiento con carga
centinela demuestra que los indicadores mostrados son los que devolvió el API.

### «Avance anticipado» se omite

RF-08 lo permite sin exigirlo y el fixture es explícito: «El contrato no lleva
campo propio para ella». Derivarlo de `sv > 0` sería interpretación en el
cliente y debilitaría ADR-001. Queda como candidato a campo del contrato.

### Recharts 2.15.4 por renderizado en servidor

RF-09 se prueba al nivel de cliente contra una API simulada, sin navegador.
Recharts 3 traslada el trazado a efectos y en `renderToStaticMarkup` produce
un contenedor vacío: la gráfica sería inverificable en este nivel. La rama 2.x
renderiza el SVG completo —ejes, leyenda y un rectángulo por serie y
actividad—, a cambio de estar marcada como no activa por su autor. Se prefiere
la versión verificable y se registra como deuda técnica.

La gráfica recibe `activities` sin adaptador y rotula el eje con `activity.id`,
que la tabla repite en su primera columna. Los nombres completos no caben en un
eje y derivar `A1…A8` exigiría aritmética sobre un índice.

### Componentes presentacionales y un contenedor delgado

La carga vive en funciones asíncronas puras (`evm-api-client.ts`,
`dashboard-data.ts`) que reciben una implementación de `fetch`; los componentes
reciben datos por props. El único componente con estado es
`dashboard-view.tsx`, que envuelve esas funciones con `useState` y `useEffect`.

Así las pruebas de cliente renderizan con `react-dom/server` sin DOM ni
dependencias nuevas, y la carga se prueba contra una API simulada que sirve el
fixture. El costo es que los efectos y el `change` del selector no se ejercitan
en ejecución; el contenedor queda delgado a propósito.

### Estilos en una hoja global

No hay Tailwind. Todo el CSS vive en `src/app/globals.css` y los componentes
solo llevan `className`. Ningún componente importa CSS, de modo que
`renderToStaticMarkup` los carga sin resolver hojas de estilo.

### Estados visuales sin colapsar

`indexTone` e `indexGlyph` son `switch` exhaustivos con un caso por cada uno de
los cuatro `status`. `neutral` y `not_evaluable` devuelven el mismo tono, como
pide RF-08, pero son ramas distintas y el elemento conserva
`data-status="not_evaluable"`. El texto proviene de `label`, que ya viene
resuelto; el cliente no lo inventa. El tono se acompaña de glifo y texto para
no depender solo del color.

## Arquitectura

```
src/app/layout.tsx          shell y hoja global
src/app/page.tsx            monta el contenedor
src/app/globals.css         todo el CSS

src/ui/api-base-url.ts      (existente) resuelve la base
src/ui/evm-api-client.ts    GET colección y GET análisis
src/ui/dashboard-data.ts    carga inicial y cambio de proyecto
src/ui/format.ts            montos, avance y ausencia
src/ui/index-status.ts      tono y glifo por status
src/ui/index-badge.tsx      display, label y tono
src/ui/project-verdict.tsx  RF-08 a nivel de proyecto
src/ui/project-summary-panel.tsx  RF-07
src/ui/activities-chart.tsx RF-09
src/ui/activities-table.tsx RF-06
src/ui/project-selector.tsx selector desde la colección
src/ui/dashboard.tsx        composición presentacional
src/ui/dashboard-view.tsx   contenedor con estado
```

## Lectura de un vistazo

Sobre la tabla, una banda de veredicto con tres tarjetas grandes: costo (CPI),
cronograma (SPI) y avance. Cada tarjeta lleva tono, glifo, el `display` del
índice y su `label`. Con la semilla del fixture las dos primeras salen en tono
desfavorable, así que el diagnóstico se lee sin recorrer la tabla.

Debajo, el consolidado con los montos y el conteo
`activitiesWithEvAndZeroAc`; después la gráfica; al final la tabla, con un chip
de tono en las celdas de CPI y SPI de cada fila.

## Pruebas

Nivel cliente, contra una API simulada que sirve el fixture.

| Archivo | Verifica |
|---|---|
| `evm-api-client.test.ts` | rutas resueltas sobre la base, cuerpos de colección y análisis, envolvente de error |
| `format.test.ts` | dos decimales, millares, `−` y avance entero, sobre valores del fixture |
| `activities-table.test.tsx` | los cinco datos capturados y los ocho indicadores por fila |
| `index-badge.test.tsx` | los cuatro `status`; marcadores `<0,99` y `>1,01` desde `neutralBandChecks` |
| `project-summary.test.tsx` | consolidado, avance y conteo de EV positivo con AC cero |
| `activities-chart.test.tsx` | tres series identificadas y un rectángulo por serie y actividad |
| `empty-project.test.tsx` | `emptyProject` no rompe la vista |
| `dashboard-data.test.tsx` | carga desde la API simulada y carga centinela renderizada tal cual |
| `client-boundaries.test.ts` | revisión estructural de ADR-001 y ADR-007 |

Los valores esperados se leen del fixture. Las cadenas de presentación de
montos son la única expectativa autorizada en este nivel, porque el contrato no
las transporta y `docs/TESTING.md` asigna su verificación aquí.

## Supuestos

- `activity.id` es rótulo aceptable del eje de la gráfica y de la primera
  columna de la tabla, aunque el PRD no pida mostrar identificadores.
- El signo negativo se presenta con `−` (U+2212), como en el texto del PRD.
- Tema claro con una variante `prefers-color-scheme: dark` mínima.
- La deuda de Recharts 2.x se registra en `README.md`.
