# project-scaffold Specification

## Purpose

Definir la base reproducible de fase 0, sus fronteras estructurales,
persistencia PostgreSQL, mock contractual, semilla y verificaciones, sin
introducir lógica EVM ejecutable.
## Requirements
### Requirement: Fronteras estructurales del código
El repositorio MUST separar `domain`, `application`, `infrastructure`, `app`,
`ui` y `shared` bajo `src/`, y MUST automatizar la dirección permitida de sus
imports. Las firmas de dominio MUST reflejar una primitiva de magnitudes
reutilizada conceptualmente por actividad y proyecto, sin cuerpo de cálculo en
fase 0.

#### Scenario: Import prohibido desde dominio
- **WHEN** un archivo de `src/domain/` importa Next, Drizzle, PostgreSQL,
  `app/`, `ui/` o `infrastructure/`
- **THEN** el paso de lint de fronteras falla

#### Scenario: Import prohibido desde UI o aplicación
- **WHEN** `src/ui/` importa dominio, aplicación o infraestructura, o
  `src/application/` importa app, UI o la implementación de infraestructura
- **THEN** el paso de lint de fronteras falla

#### Scenario: Fase sin lógica EVM
- **WHEN** se revisa el contenido de `src/`
- **THEN** existen firmas y comentarios de factoring, pero ninguna fórmula,
  clasificación ni consolidación EVM ejecutable

### Requirement: Política decimal única en src
El sistema MUST configurar `decimal.js` exactamente una vez dentro de
`src/domain/decimal.ts` con precisión 40. La única función de presentación MUST
invocar explícitamente `toDecimalPlaces(2, Decimal.ROUND_HALF_UP)`. El resto de
`src/` MUST tener prohibidas la configuración, cuantización y presentación
decimal directa.

#### Scenario: Configuración o redondeo disperso
- **WHEN** otro archivo de `src/` llama `Decimal.set`, `toDecimalPlaces`,
  `toFixed` o un equivalente restringido
- **THEN** ESLint falla

#### Scenario: Mapeo de numeric
- **WHEN** infraestructura recibe un `numeric` de PostgreSQL como cadena
- **THEN** lo convierte mediante el constructor `Decimal` exportado por dominio
  sin redondearlo

### Requirement: Esquema PostgreSQL mínimo
La migración inicial MUST crear exactamente las tablas de proyectos y
actividades. Los montos y porcentajes capturados MUST usar
`numeric(38,18)`. La referencia de actividad MUST declarar
`ON DELETE CASCADE` en PostgreSQL y ninguna tabla MUST persistir datos
derivados.

#### Scenario: Inspección de la migración
- **WHEN** la comprobación estructural lee el SQL generado
- **THEN** encuentra dos tablas, cuatro columnas `numeric(38,18)` en actividad
  y la cláusula `ON DELETE CASCADE`
- **THEN** no encuentra columnas para indicadores, interpretaciones,
  consolidados, estado derivado, historial ni fecha de corte por actividad

#### Scenario: Cascada garantizada por la base
- **WHEN** PostgreSQL elimina un proyecto que tiene actividades
- **THEN** la clave foránea elimina sus actividades sin coordinación manual de
  la aplicación

### Requirement: Repositorio y frontera de persistencia
Application MUST declarar una sola interfaz de repositorio y infrastructure
MUST proporcionar su implementación Drizzle. El mapeador MUST reconstruir los
valores `numeric` con el `Decimal` configurado por dominio.

#### Scenario: Ida y vuelta decimal real
- **WHEN** una prueba de integración escribe en PostgreSQL un monto con
  decimales y lo relee mediante el repositorio
- **THEN** el `Decimal` reconstruido es igual al valor original sin
  cuantización

### Requirement: Mock derivado del fixture

El servidor mock MUST obtener todos sus cuerpos de
`contracts/evm/evm-fixture.json`. MUST servir bajo el prefijo `/mock-api` la
colección, la lectura individual sin claves con prefijo `$`, el proyecto vacío
y las tres envolventes de error sin inventar datos. Ningún archivo del mock
MUST ocupar las rutas reales `/projects` o `/projects/{projectId}`.

#### Scenario: Colección de proyectos

- **WHEN** el cliente solicita `GET /mock-api/projects`
- **THEN** recibe el estado y cuerpo de `collectionResponse`

#### Scenario: Lectura del proyecto de referencia

- **WHEN** el cliente solicita `GET /mock-api/projects/1`
- **THEN** recibe `readResponse` después de eliminar recursivamente toda clave
  cuyo nombre empiece por `$`

#### Scenario: Lectura del proyecto vacío

- **WHEN** el cliente solicita `GET /mock-api/projects/2`
- **THEN** recibe `emptyProject` después de la misma limpieza recursiva

#### Scenario: Envolventes de error

- **WHEN** el cliente selecciona cualquiera de los tres escenarios de error
  mediante el control exclusivo del mock
- **THEN** recibe exactamente `expectedStatus` y `expectedBody` del escenario
  correspondiente en `errorEnvelopes`

#### Scenario: Rutas contractuales disponibles

- **WHEN** se inspecciona el árbol de handlers al terminar la preparación
- **THEN** ningún archivo de mock vive bajo `src/app/projects/`

### Requirement: Semilla fiel e idempotente
La semilla MUST cargar los dos proyectos y las ocho actividades del fixture.
Cada actividad MUST persistir únicamente sus cinco datos capturados y su
identidad/relación, y ejecuciones repetidas MUST conservar el mismo conjunto
sembrado.

#### Scenario: Base vacía
- **WHEN** se ejecuta la semilla después de aplicar la migración
- **THEN** PostgreSQL contiene `readResponse.project`, sus ocho actividades y
  `emptyProject.project`
- **THEN** ninguna columna o escritura contiene indicadores derivados

#### Scenario: Segunda ejecución
- **WHEN** la semilla se ejecuta de nuevo
- **THEN** no duplica proyectos ni actividades

### Requirement: Guiones autoexplicativos
`package.json` MUST ofrecer comandos evidentes para levantar el entorno,
detenerlo, migrar, sembrar, verificar tipos, aplicar lint y ejecutar pruebas. Un
único comando de entorno MUST instalar dependencias reproducibles, preparar
PostgreSQL, sembrar y arrancar Next con el mock.

#### Scenario: Clonación a entorno operativo
- **WHEN** una persona con Node.js, npm y Docker clona el repositorio y ejecuta
  `npm run env:up`
- **THEN** PostgreSQL queda disponible y migrado, el fixture queda sembrado y
  el mock HTTP queda accesible sin leer instrucciones adicionales

#### Scenario: Suite local
- **WHEN** se ejecuta `npm test`
- **THEN** PostgreSQL real está disponible y corren todas las pruebas de fase 0
  sin usar SQLite

### Requirement: Integración continua con PostgreSQL

CI MUST ejecutar instalación reproducible, lint, reglas de imports,
comprobación de tipos y el comando único de cobertura con un servicio
PostgreSQL. El comando de cobertura MUST aplicar migraciones, ejecutar la suite
completa ejercitable, generar sus informes y hacer fallar el workflow si
cualquier métrica queda por debajo de 95% en `src/domain/`, 90% en
`src/application/` o 80% global.

#### Scenario: Violación estructural, prueba o cobertura insuficiente

- **WHEN** una frontera de import, regla decimal, tipo, migración o prueba deja
  de cumplir, o cualquier métrica queda bajo su umbral aplicable
- **THEN** el workflow de CI falla antes de integrar

#### Scenario: Mismo comando local y en CI

- **WHEN** CI recolecta y valida la cobertura
- **THEN** invoca el mismo comando npm publicado para inspección local y no una
  política paralela

### Requirement: Ciclo de vida de la sonda decimal
Las garantías equivalentes a la sonda decimal MUST residir en pruebas
permanentes que verifiquen la configuración decimal, los empates `1.005`,
`-1.005` y `0.625`, y la ida y vuelta JSON observable. El archivo
`scripts/verify-decimal.mjs` MUST dejar de existir y MUST carecer de referencias
ejecutables o ignores activos.

#### Scenario: Garantías trasladadas a la suite permanente
- **WHEN** se ejecuta la suite permanente de dominio
- **THEN** las pruebas verifican la configuración decimal, los tres empates y
  la ida y vuelta JSON que cubría la sonda

#### Scenario: Retiro completo de la sonda
- **WHEN** se inspeccionan los scripts y la configuración ejecutable del
  repositorio
- **THEN** `scripts/verify-decimal.mjs` no existe ni permanece referenciado o
  excluido mediante un ignore activo

### Requirement: Base HTTP configurable del cliente

El cliente MUST resolver una única base HTTP mediante
`NEXT_PUBLIC_EVM_API_BASE_URL`. La base MUST admitir una ruta relativa o una
URL absoluta y MUST usar `/mock-api` cuando la variable no exista o esté vacía.
Cambiar entre mock y backend MUST requerir solo cambiar la variable, sin editar
código consumidor.

#### Scenario: Desarrollo local sin configuración

- **WHEN** `NEXT_PUBLIC_EVM_API_BASE_URL` no está definida
- **THEN** el cliente resuelve `/mock-api` como base HTTP

#### Scenario: Backend configurado

- **WHEN** `NEXT_PUBLIC_EVM_API_BASE_URL` contiene una ruta relativa o URL
  absoluta
- **THEN** el cliente usa esa base normalizada para las mismas rutas de recurso

### Requirement: Contrato compartido completo y cerrado

`src/shared/` MUST exportar los DTO de transporte completos de OpenAPI para la
envolvente analítica, proyecto y actividad de lectura, índice, cuerpos de
escritura, elemento de colección y envolvente de error. `IndexStatus` MUST
contener exactamente los cuatro estados de ADR-006b y `ViolationRule` MUST
contener exactamente las seis reglas de ADR-009. Durante el trabajo paralelo,
`src/shared/` MUST permanecer cerrado a ampliaciones no aprobadas.

#### Scenario: Lectura completa

- **WHEN** se inspecciona `ProjectAnalysis`
- **THEN** contiene `project`, `activities` y `summary` con todos los miembros
  requeridos por OpenAPI

#### Scenario: Índice estable

- **WHEN** se inspecciona `IndexResult`
- **THEN** el objeto requiere `value`, `display`, `status` y `label`
- **THEN** solo `value` y `display` admiten `null`
- **THEN** `status` admite exactamente `unfavorable`, `neutral`, `favorable` y
  `not_evaluable`

#### Scenario: Escrituras y colección

- **WHEN** se inspeccionan `ProjectWrite`, `ActivityWrite` y `ProjectListItem`
- **THEN** contienen los campos publicados por sus esquemas OpenAPI y ningún
  indicador derivado aparece en una escritura

#### Scenario: Error compartido

- **WHEN** se inspeccionan `ErrorEnvelope` y `ContractViolation`
- **THEN** contienen `code`, `message`, `violations`, `field`, `rule` y
  `message` conforme a ADR-009
- **THEN** `rule` admite exactamente `required`, `positive`, `non_negative`,
  `range_0_100`, `read_only` y `unknown`

#### Scenario: Fixture compatible por tipos

- **WHEN** la prueba de tipos elimina recursivamente las claves con prefijo `$`
  de `readResponse` y genera desde ese payload un literal TypeScript
- **THEN** el payload resultante satisface `ProjectAnalysis`
- **THEN** una divergencia de campos, nulabilidad o valores literales hace
  fallar typecheck y build

#### Scenario: Tipo faltante durante la fase paralela

- **WHEN** backend o frontend considera necesario añadir otro tipo a
  `src/shared/`
- **THEN** la vía se detiene y reporta la divergencia en lugar de modificar la
  frontera
