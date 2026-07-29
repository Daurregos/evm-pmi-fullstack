## 1. Auditoría contractual

- [x] 1.1 Materializar en una prueba estructural la matriz de ocho operaciones, cuerpos, éxitos y errores aplicables
- [x] 1.2 Verificar OpenAPI 3.1, `info.version`, ausencia de `x-decisions-missing` y alcanzabilidad de todos los esquemas
- [x] 1.3 Contrastar los hallazgos con ADR-004, ADR-006a, ADR-006b, ADR-007, ADR-008 y ADR-009, corrigiendo solo defectos atribuibles al YAML

## 2. Validación OpenAPI de respuestas reales

- [x] 2.1 Añadir primero una prueba roja que cargue el fixture y exija un validador OpenAPI 3.1 sobre respuestas HTTP reales
- [x] 2.2 Fijar la dependencia de validación e integrar el nuevo archivo en el runner contractual secuencial
- [x] 2.3 Validar un éxito de cada una de las ocho operaciones por `operationId` y estado, incluidos ambos 204 con cuerpo crudo vacío
- [x] 2.4 Validar respuestas reales 400, 404 y 422 contra las tres envolventes de error del fixture

## 3. Publicación de Swagger UI

- [x] 3.1 Añadir primero pruebas rojas para `/api-docs`, el YAML canónico, los recursos autoalojados y el 404 de recurso desconocido
- [x] 3.2 Fijar `swagger-ui-dist` e implementar los Route Handlers Node.js para HTML, contrato y lista cerrada de recursos
- [x] 3.3 Demostrar que el YAML servido coincide byte a byte con `contracts/evm/openapi.yaml` y que la configuración usa el mismo origen

## 4. Verificación y cierre

- [x] 4.1 Ejecutar prueba verde contractual, typecheck, lint, build y suite completa contra PostgreSQL aislado
- [x] 4.2 Levantar el entorno y comprobar `/api-docs`, YAML, JavaScript, CSS y al menos una operación real desde la configuración publicada
- [x] 4.3 Contrastar el diff con las specs, `docs/TESTING.md` y las verificaciones de los ADR aplicables, preservando todo territorio excluido
- [x] 4.4 Registrar discrepancias y su origen, cobertura exacta y la línea de handoff `Swagger UI: /api-docs`
