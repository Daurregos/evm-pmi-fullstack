## 1. Habilitar el nivel de cliente

- [ ] 1.1 Añadir `recharts@2.15.4` como dependencia exacta de producción y
  comprobar con una prueba desechable que `renderToStaticMarkup` produce el SVG
  completo, ejes y leyenda incluidos.
- [ ] 1.2 Añadir `tests/**/*.tsx` a `include` de `tsconfig.json` y ampliar el
  script `test:client` para que ejecute también los archivos `.test.tsx`;
  comprobar que `npm run test:client` sigue recogiendo
  `tests/client/api-base-url.test.ts`.
- [ ] 1.3 Añadir `tests/client/simulated-api.ts`: una implementación de `fetch`
  que sirve `collectionResponse`, `readResponse` sin claves `$`, `emptyProject`
  y las envolventes de `errorEnvelopes` leídas del fixture.

## 2. Cliente HTTP y presentación numérica

- [ ] 2.1 Escribir primero `tests/client/evm-api-client.test.ts` contra la API
  simulada —colección, análisis, ruta resuelta sobre la base y envolvente de
  error—, observar RED e implementar `src/ui/evm-api-client.ts`.
- [ ] 2.2 Escribir primero `tests/client/format.test.ts` con montos del fixture,
  el criterio literal de RF-03, el empate alejándose de cero y el avance entero;
  observar RED e implementar `src/ui/format.ts`.

## 3. Estado visual e indicadores

- [ ] 3.1 Escribir primero `tests/client/index-badge.test.tsx`: los cuatro
  `status`, `neutral` y `not_evaluable` con el mismo tono y `data-status`
  distinto, `display` literal y los marcadores tomados de
  `neutralBandChecks`; observar RED e implementar `src/ui/index-status.ts` y
  `src/ui/index-badge.tsx`.

## 4. Tabla, consolidado y gráfica

- [ ] 4.1 Escribir primero `tests/client/activities-table.test.tsx` sobre las
  ocho actividades del fixture —cinco datos capturados, ocho indicadores y
  ausencia de `eac` y `vac` nulos—, observar RED e implementar
  `src/ui/activities-table.tsx`.
- [ ] 4.2 Escribir primero `tests/client/project-summary.test.tsx` sobre
  `readResponse.summary` —diez montos e índices, avance y
  `activitiesWithEvAndZeroAc`—, observar RED e implementar
  `src/ui/project-verdict.tsx` y `src/ui/project-summary-panel.tsx`.
- [ ] 4.3 Escribir primero `tests/client/activities-chart.test.tsx` —tres series
  identificadas y un rectángulo por serie y actividad—, observar RED e
  implementar `src/ui/activities-chart.tsx`.

## 5. Composición, selector y proyecto vacío

- [ ] 5.1 Escribir primero `tests/client/empty-project.test.tsx` sobre
  `emptyProject`, observar RED e implementar `src/ui/dashboard.tsx`,
  `src/ui/project-selector.tsx` y el aviso de proyecto sin actividades.
- [ ] 5.2 Escribir primero `tests/client/dashboard-data.test.tsx` —carga inicial
  contra la API simulada y carga centinela renderizada tal cual—, observar RED e
  implementar `src/ui/dashboard-data.ts`.
- [ ] 5.3 Implementar `src/ui/dashboard-view.tsx`, `src/app/layout.tsx`,
  `src/app/page.tsx` y `src/app/globals.css` con la banda de veredicto,
  y comprobar que el dashboard se levanta contra el mock.

## 6. Revisión estructural de ADR-001 y ADR-007

- [ ] 6.1 Escribir primero `tests/client/client-boundaries.test.ts`: ningún
  módulo de `src/ui/**` importa capas de servidor y ningún módulo de `src/ui/**`
  ni de `src/app/**` fuera de `mock-api` mezcla vocabulario EVM con aritmética;
  demostrar RED con una sonda que viola cada regla.

## 7. Verificar y cerrar

- [ ] 7.1 Documentar en `README.md` la deuda de Recharts 2.x, la omisión de
  «avance anticipado» y cómo levantar el dashboard contra el mock.
- [ ] 7.2 Ejecutar de forma fresca `npm run lint`, `npm run lint:imports`,
  `npm run typecheck`, `npm run test:client`, `npm run test:structure`,
  `npm run build` y `git diff --check`, leyendo sus salidas completas.
- [ ] 7.3 Contrastar el diff con `docs/TESTING.md` y con la sección
  `Verificación` de ADR-001, ADR-003, ADR-004 y ADR-007.
