## Why

El contrato OpenAPI se redactó antes que las rutas reales y hoy solo existe una
revisión manual entre ambos. El proyecto necesita demostrar que las respuestas
HTTP implementadas siguen el contrato OpenAPI 3.1 y publicar ese mismo contrato
como documentación interactiva sin crear una segunda copia.

## What Changes

- Auditar las ocho operaciones reales contra `contracts/evm/openapi.yaml`,
  incluidos cuerpos de escritura y lectura, códigos de éxito y errores 400,
  404 y 422.
- Automatizar la higiene del contrato: versión OpenAPI y SemVer fijas,
  ausencia de decisiones pendientes, superficie exacta y ausencia de esquemas
  sin uso.
- Validar respuestas HTTP reales de cada operación y las tres envolventes de
  error con un validador compatible con OpenAPI 3.1 y datos tomados
  directamente del fixture.
- Publicar Swagger UI autoalojada en `/api-docs`, alimentada por el archivo
  canónico servido en `/api-docs/openapi.yaml`.
- Añadir pruebas ejecutables de la interfaz, el contrato servido y sus recursos
  sin modificar páginas ni la interfaz de producto.

## Capabilities

### New Capabilities

- `evm-api-documentation`: publicación autoalojada de Swagger UI y del archivo
  OpenAPI canónico desde rutas de la aplicación.

### Modified Capabilities

- `evm-http-surface`: ampliar la verificación contractual para validar contra
  OpenAPI 3.1 una respuesta real de éxito de cada operación, los dos 204 sin
  cuerpo y las tres envolventes de error.

## Impact

El cambio afecta pruebas de contrato, su runner, Route Handlers dedicados a
`/api-docs`, `package.json` y su lockfile. Introduce dependencias fijadas para
validación OpenAPI 3.1 y recursos de Swagger UI. El YAML solo cambiará si la
auditoría demuestra una discrepancia atribuible al contrato; no se modifican
`src/ui/`, páginas, `src/domain/`, `src/application/`, `README.md`, PRD, ADR ni
fixture.
