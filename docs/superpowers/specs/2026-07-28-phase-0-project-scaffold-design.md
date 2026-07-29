# Diseño del andamiaje del proyecto — fase 0

**Fecha:** 2026-07-28

**Estado:** aprobado para convertir en cambio OpenSpec

**Alcance:** infraestructura y fronteras estructurales, sin lógica EVM en `src/`

## Propósito

Crear un punto de partida ejecutable para la aplicación Next.js con PostgreSQL,
Drizzle ORM, pruebas por nivel y CI. La fase demuestra que las fronteras
arquitectónicas, la persistencia decimal, el mock contractual y los guiones de
operación funcionan antes de implementar comportamiento de producto.

Las decisiones de producto y contrato permanecen cerradas en
`docs/PRD.md`, `docs/ASSUMPTIONS.md`, `docs/adr/`, `docs/TESTING.md`,
`contracts/evm/openapi.yaml` y `contracts/evm/evm-fixture.json`. Este cambio no
edita ninguna de esas fuentes.

## Enfoques considerados

### Mock contractual en route handlers de Next — elegido

Next sirve únicamente las rutas mock de lectura. Los handlers delegan la carga,
limpieza y selección de escenarios a infraestructura simulada. No se crean
páginas, componentes ni rutas reales del backend. Esto permite levantar un solo
proceso de aplicación y evita otra dependencia.

### Servidor Node separado

Mantendría el mock fuera de `app/`, pero obligaría a coordinar dos procesos,
puertos y ciclos de vida para una fase que no necesita esa separación física.

### Herramienta externa de mocking

Prism o MSW aportarían capacidades útiles más adelante, pero añaden una
dependencia que los requisitos actuales no necesitan. También introducirían
otra configuración para transformar el fixture.

## Estructura y dirección de dependencias

`src/domain/` contiene el constructor `Decimal` configurado, el único redondeo
de presentación permitido y las firmas documentadas del futuro cálculo. Las
firmas expresan tres responsabilidades:

1. una primitiva recibe BAC, PV, EV y AC y producirá los ocho indicadores y el
   estado;
2. el cálculo de actividad producirá PV y EV desde los datos capturados y
   delegará en esa primitiva;
3. la consolidación sumará magnitudes y delegará en la misma primitiva.

La fase 0 no da cuerpo a esas operaciones ni incluye expresiones de cálculo.
`domain/` no conoce Next, HTTP, Drizzle, PostgreSQL ni el sistema de archivos.
`decimal.js` es su única dependencia técnica.

`src/application/` contiene una sola interfaz de repositorio para proyectos y
actividades. Los casos de uso futuros dependerán de ella y del dominio, nunca de
Drizzle. No se crean puertos adicionales, DTOs por capa ni contenedor de
inyección.

`src/infrastructure/` contiene el esquema Drizzle, la conexión PostgreSQL, la
implementación del repositorio, el mapeador de filas y el lector del fixture
para mock y semilla. El mapeador convierte explícitamente las cadenas `numeric`
devueltas por PostgreSQL en el constructor `Decimal` configurado en `domain/`.

`src/app/` contiene solo los route handlers mock. Son delgados y no ejecutan
validación, persistencia ni cálculo EVM. `src/ui/` queda preparado sin
componentes. `src/shared/` conserva los tipos del contrato y los códigos de
error que deben compartir servidor y cliente.

Las pruebas se separan en `tests/domain/`, `tests/integration/`,
`tests/contract/` y `tests/client/`. La revisión estructural se automatiza con
ESLint y comprobaciones del SQL, no con un quinto árbol de pruebas.

## Precisión decimal

`src/domain/decimal.ts` contiene la única llamada a:

```ts
Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });
```

El mismo archivo exporta la única función de redondeo de presentación. Dentro
de ella, el modo se pasa explícitamente a
`toDecimalPlaces(2, Decimal.ROUND_HALF_UP)`.

ESLint restringe en todo `src/` las llamadas a `Decimal.set`,
`toDecimalPlaces`, `toFixed` y métodos equivalentes de cuantización o
presentación. Solo `src/domain/decimal.ts` tiene las excepciones exactas que
necesita. `scripts/` y `contracts/` quedan fuera de estas reglas.

## Persistencia

Drizzle modela exactamente dos tablas:

- `projects`: `id` entero generado, `name` obligatorio y `cutoff_date` de tipo
  `date`;
- `activities`: `id` entero generado, `project_id` obligatorio, `name`
  obligatorio y los cuatro valores numéricos capturados: `bac`,
  `planned_progress`, `actual_progress` y `ac`.

Los cuatro valores numéricos usan `numeric(38,18)`. La elección conserva veinte
dígitos enteros y dieciocho decimales sin introducir punto flotante.

La clave foránea `activities.project_id` referencia `projects.id` con
`onDelete: "cascade"`. La migración se genera con Drizzle Kit y debe contener
literalmente `ON DELETE CASCADE`. No hay columnas para indicadores,
interpretaciones, consolidaciones, estados derivados, historial ni fecha de
corte por actividad.

Drizzle se registra en la tabla de elecciones tecnológicas del README como una
herramienta reversible de bajo riesgo. El motivo es que PostgreSQL `numeric`
llega como cadena, lo que hace explícita la conversión al `Decimal` configurado
por el proyecto, y que las migraciones SQL permiten revisar la cascada.

## Mock contractual

Next expone únicamente:

- `GET /projects`, con `collectionResponse.expectedBody`;
- `GET /projects/1`, con `readResponse` después de retirar recursivamente todas
  las claves cuyo nombre empiece por `$`;
- `GET /projects/2`, con `emptyProject` sometido a la misma limpieza.

Un identificador inexistente devuelve la envolvente `notFound`. Para probar el
manejador del cliente sin inventar rutas contractuales, un encabezado exclusivo
del mock selecciona `malformedRequest`, `notFound` o `validationFailed`. Estado
y cuerpo siempre proceden de `errorEnvelopes`; el encabezado no forma parte del
OpenAPI ni de la API futura.

## Semilla

La semilla lee el fixture y escribe:

- el proyecto de `readResponse.project`;
- sus ocho actividades, conservando solamente `id`, `name`, `bac`,
  `plannedProgress`, `actualProgress` y `ac`;
- el proyecto de `emptyProject.project`, sin actividades.

La ejecución es idempotente mediante conflictos por identificador. No lee ni
persiste ningún indicador derivado. Al terminar, las secuencias quedan
adelantadas respecto de los identificadores sembrados.

## Pruebas

La fase 0 contiene solamente evidencia de sus propias fronteras:

- una prueba de integración escribe un monto decimal en PostgreSQL mediante el
  repositorio, lo relee como cadena, lo reconstruye en el mapeador y comprueba
  igualdad con el `Decimal` original;
- pruebas de contrato llaman el servidor HTTP mock y comparan sus respuestas
  con el fixture, incluida la eliminación recursiva de metadatos y las tres
  envolventes;
- una comprobación estructural lee la migración generada y confirma tipos
  `numeric(38,18)`, `ON DELETE CASCADE`, dos tablas y ausencia de columnas
  derivadas;
- ESLint verifica las fronteras de imports y el único punto de configuración y
  redondeo decimal.

No hay pruebas de fórmulas, estados, consolidación, casos de uso, interfaz ni
API real porque esas implementaciones quedan fuera de la fase.

## Guiones y entorno local

`package.json` ofrece como mínimo:

- `npm run env:up`: instala dependencias reproducibles, levanta PostgreSQL,
  aplica migraciones, siembra y arranca Next con el mock;
- `npm run env:down`: detiene el entorno Docker;
- `npm run db:migrate`: aplica migraciones;
- `npm run db:seed`: carga los datos del fixture;
- `npm test`: prepara PostgreSQL y ejecuta la suite completa;
- `npm run lint`, `npm run lint:imports` y `npm run typecheck`.

El comando `env:up` es el camino de clonación a entorno operativo y no exige
consultar documentación adicional.

## Integración continua

GitHub Actions provisiona PostgreSQL real y ejecuta, en pasos separados,
instalación reproducible, migraciones, lint general, reglas de imports,
comprobación de tipos y suite completa. No usa SQLite.

## Sonda decimal y deuda conocida

La sonda existente se mueve sin refactorizar a
`scripts/verify-decimal.mjs`. Su cabecera declara que fue una comprobación de
viabilidad de una sola ejecución, ya satisfecha, y que su implementación es
deliberadamente independiente de `src/`.

No forma parte de la suite ni de CI y queda excluida del lint estructural. Su
ciclo de vida termina en el primer slice de fase 1: cuando las pruebas del
dominio cubran el fixture, los empates y la ida y vuelta JSON, la sonda se
archivará o eliminará mediante ese cambio futuro.

## Fuera de alcance

Esta fase no implementa fórmulas EVM, clasificaciones, validaciones de negocio,
casos de uso, rutas reales del API, páginas ni componentes. Tampoco persiste
valores derivados, introduce historial, añade autenticación ni crea
abstracciones adicionales a la única interfaz de repositorio.
