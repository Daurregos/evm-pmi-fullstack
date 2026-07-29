## MODIFIED Requirements

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
