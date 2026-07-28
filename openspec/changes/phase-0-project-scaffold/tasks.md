## 1. Base reproducible y sonda

- [x] 1.1 Crear `package.json`, `package-lock.json`, `tsconfig.json`,
  `next.config.ts`, `.env.example` y la estructura `src/` y `tests/` aprobada,
  sin páginas, componentes ni lógica EVM.
- [x] 1.2 Mover la sonda a `scripts/verify-decimal.mjs`, añadir únicamente la
  nota de ciclo de vida acordada y confirmar que no aparece en scripts de test o
  CI.
- [x] 1.3 Añadir a `README.md` la tabla de elecciones tecnológicas, la razón de
  Drizzle y la deuda de retiro de la sonda en fase 1.

## 2. Fronteras y módulo decimal

- [ ] 2.1 Escribir pruebas estructurales o fixtures de lint que fallen para cada
  dirección de import prohibida y para llamadas decimales fuera del módulo
  autorizado.
- [ ] 2.2 Configurar `eslint.config.mjs` con `no-restricted-imports` y
  `no-restricted-syntax` limitados a `src/`, y exponer `npm run lint` y
  `npm run lint:imports`.
- [ ] 2.3 Crear `src/domain/decimal.ts` con la única configuración y función de
  presentación, y crear las firmas comentadas de magnitudes, actividad y
  proyecto sin cuerpos de cálculo.
- [ ] 2.4 Crear una sola interfaz de repositorio en `src/application/` y los
  tipos contractuales/códigos de error mínimos en `src/shared/`, sin DTOs
  duplicados ni puertos adicionales.
- [ ] 2.5 Ejecutar literalmente `npm run lint`, `npm run lint:imports` y
  `npm run typecheck` y confirmar que inspeccionan `src/`.

## 3. PostgreSQL, Drizzle y migración

- [x] 3.1 Crear `docker-compose.yml`, `drizzle.config.ts` y la configuración de
  conexión PostgreSQL con variables documentadas en `.env.example`.
- [x] 3.2 Escribir primero la prueba estructural que leerá
  `drizzle/0000_phase_0.sql` y exigirá dos tablas, cuatro
  `numeric(38,18)`, `ON DELETE CASCADE` y ausencia de columnas derivadas.
- [x] 3.3 Declarar el esquema de dos tablas en
  `src/infrastructure/database/schema.ts`, generar
  `drizzle/0000_phase_0.sql` con Drizzle Kit y revisar el SQL completo.
- [x] 3.4 Ejecutar literalmente `docker compose up -d --wait`,
  `npm run db:migrate` y la prueba estructural de
  `drizzle/0000_phase_0.sql`.

## 4. Repositorio y frontera decimal

- [x] 4.1 Escribir primero en `tests/integration/` la prueba de ida y vuelta que
  inserta un monto decimal, lo relee desde PostgreSQL y exige igualdad del
  `Decimal` reconstruido.
- [x] 4.2 Implementar el mapeador explícito de cadenas `numeric` al constructor
  configurado en dominio y la implementación Drizzle de la única interfaz de
  repositorio.
- [x] 4.3 Ejecutar la prueba de integración contra PostgreSQL real y comprobar
  que la fila de base conserva la cadena decimal esperada.

## 5. Mock contractual

- [ ] 5.1 Escribir primero en `tests/contract/` las pruebas HTTP para colección,
  proyecto de referencia, proyecto vacío, limpieza recursiva de `$` y las tres
  envolventes de error.
- [ ] 5.2 Implementar el lector/limpiador del fixture en infraestructura y los
  route handlers mock delgados en `src/app/projects/`, sin rutas de escritura ni
  API real.
- [ ] 5.3 Ejecutar las pruebas de contrato contra Next en un puerto de prueba y
  comprobar que todos los cuerpos proceden del fixture.

## 6. Semilla

- [ ] 6.1 Escribir primero una prueba de integración de la semilla que exija dos
  proyectos, ocho actividades, solo datos capturados e idempotencia.
- [ ] 6.2 Implementar `scripts/seed.ts` proyectando únicamente los campos
  aprobados, con upsert y ajuste de secuencias.
- [ ] 6.3 Ejecutar literalmente `npm run db:seed` dos veces y confirmar mediante
  la prueba que no se duplican filas.

## 7. Operación y CI

- [ ] 7.1 Crear los guiones ejecutables y scripts de `package.json` para
  `env:up`, `env:down`, migración, semilla, desarrollo, lint, imports, tipos y
  pruebas.
- [ ] 7.2 Crear `.github/workflows/ci.yml` con PostgreSQL, instalación
  reproducible, migración, lint, imports, tipos y suite completa; excluir
  explícitamente la sonda.
- [ ] 7.3 Probar literalmente `npm run env:down` seguido de `npm run env:up` y
  confirmar colección, lectura individual y datos sembrados sin consultar
  instrucciones externas.

## 8. Verificación y cierre

- [ ] 8.1 Ejecutar verificaciones frescas: `npm run lint`,
  `npm run lint:imports`, `npm run typecheck`, `npm test` y
  `git diff --check`.
- [ ] 8.2 Contrastar el diff con cada requisito de
  `openspec/changes/phase-0-project-scaffold/specs/project-scaffold/spec.md`,
  `docs/TESTING.md` y las secciones `Verificación` de ADR-001, ADR-002,
  ADR-003, ADR-005, ADR-006a, ADR-006b y ADR-008.
- [ ] 8.3 Confirmar que el commit contiene solo archivos de fase 0, que no
  modifica fuentes cerradas y que `src/` no contiene fórmulas EVM, rutas reales
  ni componentes.
- [ ] 8.4 Solicitar revisión de código, resolver hallazgos con evidencia y
  validar nuevamente antes de archivar el cambio OpenSpec.
