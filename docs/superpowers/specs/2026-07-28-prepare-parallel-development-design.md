# Preparación para desarrollo paralelo — Diseño

**Fecha:** 2026-07-28
**Estado:** aprobado por el usuario
**Base:** `origin/develop` en `fda63e2`

## Objetivo

Eliminar las tres superficies de colisión previas al trabajo simultáneo de
backend y frontend sin implementar persistencia, casos de uso, validación,
rutas HTTP reales ni componentes de interfaz:

1. cerrar la cuarta estrategia negativa de consolidación ya publicada por el
   fixture;
2. retirar el mock de las rutas reservadas al contrato real y darle un prefijo
   estable;
3. completar y congelar los DTO del contrato en `src/shared/`.

El PRD, los ADR, `contracts/evm/evm-fixture.json` y
`contracts/evm/openapi.yaml` permanecen cerrados.

## Alternativas consideradas

### Un cambio coordinado con tres commits lógicos

Un único cambio OpenSpec registra la preparación transversal y conserva tres
commits revisables: dominio/documentación del oráculo, aislamiento del mock y
tipos compartidos. Es la opción elegida porque deja una sola base que ambos
equipos pueden incorporar sin mezclar las implementaciones posteriores.

### Tres cambios OpenSpec independientes

Maximizaría el aislamiento formal, pero obligaría a ordenar tres integraciones
antes de iniciar el trabajo paralelo. Los tres resultados forman una única
precondición operativa y no aportan valor parcial duradero.

### Generar tipos desde OpenAPI

Reduciría escritura manual, pero introduciría una dependencia, un generador y
una política de regeneración para un contrato pequeño y cerrado. En esta fase
los tipos se expresan directamente y una prueba de tipos contra el fixture
detecta la deriva relevante.

## Diseño

### Dominio y oráculo

`tests/domain/evm.test.ts` ampliará la forma local de `negativeChecks` y
comparará el CPI consolidado con
`negativeChecks.cpiExcludingZeroAcActivity`. La aserción reutiliza el mismo
resultado calculado con todas las actividades; no filtra `a4` ni declara
`0.85` en el test.

La auditoría de literales conserva únicamente casos que no están representados
por el fixture. El caso decimal `0.625 → 0.63`, que sí está en `a7.cpi`, leerá
entrada y presentación desde el JSON. Los conteos literales redundantes de
actividades y casos de banda se retirarán: recorrer los arreglos del fixture ya
garantiza que todos sus elementos participan. Las expectativas de taxonomía
que provienen del PRD, y no de un valor publicado por el fixture, se mantienen.

`docs/TESTING.md` y `contracts/evm/FIXTURE.md` se alinearán con las cuatro
comprobaciones negativas. Esto corrige dependientes descriptivos; no cambia
ninguna decisión cerrada ni reescribe artefactos OpenSpec históricos.

### Mock y selección de base

Los handlers se moverán de:

- `src/app/projects/route.ts`;
- `src/app/projects/[projectId]/route.ts`;

a:

- `src/app/mock-api/projects/route.ts`;
- `src/app/mock-api/projects/[projectId]/route.ts`.

El prefijo HTTP será `/mock-api`. Los selectores y la carga del fixture seguirán
en `src/infrastructure/mock/`, por lo que la colección, las lecturas de los
proyectos `1` y `2`, la limpieza recursiva de claves `$`, el `404` y las tres
envolventes seleccionables por `x-mock-scenario` conservarán su forma.

No quedará archivo del mock bajo `src/app/projects/`; esa ruta queda disponible
para el backend. Las pruebas HTTP y su runner apuntarán al prefijo nuevo sin
crear una expectativa permanente de `404` sobre las rutas reales, porque el
backend debe poder ocuparlas después sin modificar el mock.

`src/ui/api-base-url.ts` será la única resolución de configuración del cliente:

- lee `NEXT_PUBLIC_EVM_API_BASE_URL`;
- acepta una ruta relativa o una URL absoluta;
- usa `/mock-api` cuando la variable falta o está vacía;
- normaliza barras finales para que cambiar entre mock y backend sea solo un
  cambio de variable.

El módulo no hace peticiones ni crea componentes. El README documentará el
prefijo, la variable, ejemplos relativos/absolutos y el valor por defecto.

### Contrato compartido cerrado

`src/shared/contract.ts` exportará los nombres de los esquemas publicados:

- `ErrorCode`;
- `ViolationRule`;
- `ContractViolation`;
- `ErrorEnvelope`;
- `ProjectListItem`;
- `ProjectWrite`;
- `ProjectRead`;
- `ActivityWrite`;
- `IndexStatus`;
- `IndexResult`;
- `ActivityRead`;
- `ProjectSummary`;
- `ProjectAnalysis`.

Los tipos serán `Readonly`. `IndexStatus` contendrá exactamente
`unfavorable`, `neutral`, `favorable` y `not_evaluable`. `IndexResult` siempre
existirá y siempre tendrá `value`, `display`, `status` y `label`; solo
`value` y `display` serán nulables.

`ProjectWrite` y `ActivityWrite` representan el esquema HTTP publicado, no un
comando ya validado. Por eso sus miembros conservan la nulabilidad intencional
de OpenAPI/ADR-009, necesaria para que el backend clasifique `null` como
`required`. Los datos validados de aplicación no se añadirán a `shared/`.

Una prueba incluida en `npm run typecheck` importará el JSON, eliminará por tipo
las claves cuyo nombre empieza por `$` y exigirá que el resultado sea asignable
a `ProjectAnalysis`. La prueba no recalcula indicadores ni copia valores.

El README declarará `src/shared/` cerrado durante la fase paralela. Si backend o
frontend requieren otro DTO, el trabajo se detiene y se reporta la divergencia
en lugar de ampliar esa superficie.

## Pruebas y evidencia

Cada cambio de comportamiento seguirá un ciclo observable:

1. la cuarta aserción se demostrará sensible ejecutándola primero contra una
   entrada temporal que excluye `a4`, obteniendo el fallo contra el valor del
   fixture, y después se restaurará la consolidación completa;
2. las pruebas HTTP se moverán primero al prefijo nuevo y fallarán antes de
   mover los handlers;
3. la prueba de configuración fallará por el módulo ausente antes de crearlo;
4. la prueba de tipos fallará por exportaciones incompletas antes de completar
   `src/shared/contract.ts`.

La verificación final comprende la prueba de dominio aislada, pruebas de
cliente/configuración, typecheck, lint, reglas de imports, integración,
contrato HTTP, suite completa, build y `git diff --check`. También revisará que
`src/app/projects/` no contenga archivos del mock y que el diff no toque las
fuentes cerradas.

## Riesgos y mitigaciones

- **El tipo de escritura parece aceptar datos inválidos.** Es la forma
  deliberadamente permisiva del contrato publicado; negocio valida antes de
  construir comandos internos.
- **Una prueba de ausencia de rutas bloquearía al backend futuro.** Se verifica
  la ubicación de archivos al cerrar este cambio, pero las pruebas permanentes
  solo ejercitan `/mock-api`.
- **El entorno público se captura en build.** El README distinguirá la
  configuración de build/deploy de Next.js; no se añadirá configuración
  paralela.
- **El fixture cambia sin actualizar tipos.** La prueba de tipos hará fallar
  `npm run typecheck`.
