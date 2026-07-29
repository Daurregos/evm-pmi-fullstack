## ADDED Requirements

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

## MODIFIED Requirements

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
