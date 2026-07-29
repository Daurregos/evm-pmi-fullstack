## 1. Cerrar el oráculo de dominio

- [x] 1.1 Ampliar el tipo local de `negativeChecks`, demostrar RED excluyendo
  temporalmente `a4` y añadir la cuarta aserción contra el valor leído del
  fixture usando todas las actividades.
- [x] 1.2 Auditar expectativas de dominio codificadas a mano, hacer que el caso
  decimal representado por `a7.cpi` lea entrada y salida del fixture y retirar
  conteos redundantes que copian la longitud de sus arreglos.
- [x] 1.3 Alinear `docs/TESTING.md` y `contracts/evm/FIXTURE.md` con las cuatro
  comprobaciones negativas y verificar la prueba de dominio aislada.

## 2. Aislar el mock y configurar la base

- [x] 2.1 Cambiar primero las pruebas HTTP y el runner a
  `/mock-api/projects`, ejecutar el contrato y observar el RED esperado.
- [x] 2.2 Mover los handlers a `src/app/mock-api/projects/`, eliminar los
  handlers mock de `src/app/projects/` y comprobar en GREEN colección, dos
  lecturas y tres envolventes de error.
- [x] 2.3 Añadir primero pruebas de resolución predeterminada, relativa y
  absoluta de la base, observar RED por el módulo ausente e implementar
  `src/ui/api-base-url.ts` con `NEXT_PUBLIC_EVM_API_BASE_URL`.
- [x] 2.4 Documentar en `README.md` el prefijo, la variable, el valor
  predeterminado y el cierre de `src/shared/`.

## 3. Congelar el contrato compartido

- [x] 3.1 Añadir primero la prueba de tipos que elimina claves `$` del tipo de
  `readResponse`, exige asignabilidad a `ProjectAnalysis` y observar RED por
  exportaciones incompletas.
- [x] 3.2 Completar `src/shared/contract.ts` con DTO de lectura, escritura,
  colección, índice y error derivados de OpenAPI y del fixture hasta obtener
  GREEN en typecheck.
- [x] 3.3 Auditar nombres, campos, nulabilidad y uniones literales contra
  ADR-006b, ADR-009 y `contracts/evm/openapi.yaml`.

## 4. Verificar y cerrar

- [x] 4.1 Ejecutar de forma fresca dominio, cliente, typecheck, lint, imports,
  integración, contrato HTTP, suite completa, build y `git diff --check`,
  leyendo sus salidas completas.
- [x] 4.2 Contrastar cada requisito y tarea con el diff, confirmar que las rutas
  reales están libres y que PRD, ADR, fixture y OpenAPI permanecen intactos.
- [x] 4.3 Revisar los commits contra `origin/develop`, preservar cambios ajenos,
  resolver hallazgos y repetir las verificaciones afectadas.
- [ ] 4.4 Archivar `prepare-parallel-development`, verificar el diff histórico
  y abrir un PR dirigido a `develop` sin fusionarlo.
