## 1. Validar las entradas canónicas

- [x] 1.1 Comprobar estructuralmente el fixture v5.0.0, su guía y la
  autoconsistencia de los bloques nuevos sin ampliar `validationChecks`.
- [x] 1.2 Contrastar todas las operaciones, esquemas y estados solicitados con
  PRD, ADR-006a, ADR-006b, ADR-007 y ADR-009, y confirmar que no queda una
  pregunta sin decisión.

## 2. Regenerar el contrato

- [x] 2.1 Actualizar la información contractual a SemVer `1.0.0`, añadir
  `GET /projects` con sus dos ejemplos y retirar el marcador provisional de
  decisiones faltantes.
- [x] 2.2 Añadir ambos reemplazos completos `PUT` con representación de lectura
  `200` y errores `400`, `404` y `422`, documentando la derivación de no
  creación para recursos inexistentes.
- [x] 2.3 Alinear `ProjectWrite`, `ActivityWrite`, `cutoffDate`, nulabilidad,
  propiedades adicionales, normalización de nombres y el enumerado `rule` con
  ADR-006b y ADR-009.
- [x] 2.4 Incorporar literalmente los ejemplos v5.0.0 de `readResponse`,
  `collectionResponse`, `errorEnvelopes` y `validationChecks`, incluido V9.

## 3. Verificar y cerrar

- [x] 3.1 Validar OpenAPI 3.1 y referencias con el comando real del proyecto.
- [x] 3.2 Ejecutar un verificador estructural que compare todos los ejemplos con
  el fixture y pruebe paramétricamente ausencia y `null` para cada campo de
  `writeSchemas`.
- [x] 3.3 Ejecutar literalmente `git diff --check`, validar OpenSpec en modo
  estricto y auditar que ningún ADR fue modificado.
- [x] 3.4 Revisar el diff, confirmar que solo contiene archivos del cambio y
  archivar el cambio OpenSpec una vez completado y verificado.
