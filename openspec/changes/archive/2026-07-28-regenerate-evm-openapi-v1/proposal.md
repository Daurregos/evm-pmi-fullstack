## Why

Los ADR vigentes ya cerraron todas las decisiones que el primer contrato
OpenAPI dejó pendientes. El contrato debe regenerarse como versión 1.0.0 y
alinearse literalmente con el fixture canónico v5.0.0 sin convertir OpenAPI ni
el fixture en fuentes de decisiones.

## What Changes

- Añadir `GET /projects` y los reemplazos completos de proyecto y actividad con
  `PUT`.
- Completar los esquemas de escritura obligatorios, `cutoffDate` y la
  permisividad estructural exigida por ADR-009.
- Incorporar `unknown`, la normalización de nombres y el reparto `400`/`422`.
- Sustituir la versión provisional por `1.0.0` con SemVer del contrato.
- Usar exclusivamente ejemplos literales del fixture v5.0.0 y retirar
  `x-decisions-missing` si la auditoría no descubre otro hueco.
- **BREAKING**: ampliar el conjunto cerrado de `rule` con `unknown`.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `evm-api-contract`: completa operaciones, esquemas, validación, ejemplos y
  versionado que antes estaban bloqueados por decisiones ausentes.

## Impact

Se modifica `contracts/evm/openapi.yaml` y se alinean los requisitos OpenSpec.
`contracts/evm/evm-fixture.json` v5.0.0 y `contracts/evm/FIXTURE.md` son cambios
locales de entrada que deben validarse y preservarse. No se modifica ningún ADR
ni el PRD. Generadores de clientes y validadores automáticos deben respetar la
advertencia de ADR-009 sobre nulabilidad, propiedades adicionales y códigos de
error.
