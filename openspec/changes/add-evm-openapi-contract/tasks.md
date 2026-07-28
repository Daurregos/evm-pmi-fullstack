## 1. Contrato OpenAPI

- [ ] 1.1 Crear `contracts/evm/openapi.yaml` con metadatos OpenAPI 3.1.0,
  las cuatro rutas de ADR-006a y solo las operaciones no bloqueadas.
- [ ] 1.2 Definir parámetros y esquemas separados de escritura, lectura,
  consolidado, índice, infracción y error con sus restricciones y nulabilidad.
- [ ] 1.3 Incorporar respuestas y ejemplos literales de `readResponse`,
  `errorEnvelopes` y V9 sin añadir números ni nombres.
- [ ] 1.4 Añadir al final `x-decisions-missing` con cada pregunta, impacto, ADR
  responsable e insinuación no normativa disponible.

## 2. Verificación

- [ ] 2.1 Validar el documento contra OpenAPI 3.1 y resolver todas las
  referencias.
- [ ] 2.2 Comparar programáticamente los ejemplos de lectura y error con
  `contracts/evm/evm-fixture.json`.
- [ ] 2.3 Auditar rutas, operaciones, esquemas, enumerados, restricciones,
  nulabilidad, idioma y ausencia de elementos prohibidos.
- [ ] 2.4 Ejecutar `git diff --check`, revisar el diff y confirmar que el cambio
  preserva los archivos locales ajenos.
