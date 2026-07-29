## ADDED Requirements

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
`contracts/evm/evm-fixture.json`. MUST servir la colección, la lectura
individual sin claves con prefijo `$`, el proyecto vacío y las tres envolventes
de error sin inventar datos.

#### Scenario: Colección de proyectos
- **WHEN** el cliente solicita `GET /projects`
- **THEN** recibe el estado y cuerpo de `collectionResponse`

#### Scenario: Lectura del proyecto de referencia
- **WHEN** el cliente solicita `GET /projects/1`
- **THEN** recibe `readResponse` después de eliminar recursivamente toda clave
  cuyo nombre empiece por `$`

#### Scenario: Lectura del proyecto vacío
- **WHEN** el cliente solicita `GET /projects/2`
- **THEN** recibe `emptyProject` después de la misma limpieza recursiva

#### Scenario: Envolventes de error
- **WHEN** el cliente selecciona cualquiera de los tres escenarios de error
  mediante el control exclusivo del mock
- **THEN** recibe exactamente `expectedStatus` y `expectedBody` del escenario
  correspondiente en `errorEnvelopes`

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
comprobación de tipos, migraciones y suite completa con un servicio PostgreSQL.

#### Scenario: Violación estructural o prueba fallida
- **WHEN** una frontera de import, regla decimal, migración, tipo o prueba deja
  de cumplir
- **THEN** el workflow de CI falla antes de integrar

### Requirement: Ciclo de vida de la sonda decimal
La sonda de viabilidad MUST residir en `scripts/verify-decimal.mjs`, permanecer
independiente de `src/` y quedar fuera de lint, suite y CI. Su cabecera y README
MUST registrar que ya fue satisfecha y que debe archivarse o eliminarse en el
primer slice de fase 1.

#### Scenario: Ejecución de la suite
- **WHEN** se ejecutan pruebas locales o CI
- **THEN** la sonda no forma parte de los comandos ejecutados

#### Scenario: Inspección de la sonda
- **WHEN** se lee su cabecera
- **THEN** se identifica como comprobación independiente de una sola ejecución
  con retiro pendiente en fase 1
