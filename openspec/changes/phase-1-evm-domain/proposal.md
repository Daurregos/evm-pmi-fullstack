## Why

El scaffold declara las firmas y fronteras del dominio, pero todavía no
materializa el cálculo EVM ni puede demostrar los resultados exhaustivos del
fixture sin infraestructura. Este primer slice de fase 1 convierte esas
decisiones cerradas en un módulo puro y termina las reglas de lint que impiden
que sus responsabilidades se dispersen.

## What Changes

- Implementar una única primitiva de magnitudes para fórmulas, taxonomía,
  evaluabilidad, interpretación y presentación de índices EVM.
- Derivar actividades desde sus porcentajes normalizados y consolidar proyectos
  sumando magnitudes antes de reutilizar la misma primitiva.
- Cubrir exhaustivamente actividades, resumen, proyecto vacío, estados,
  evaluabilidad, banda neutral, marcadores, precisión y aserciones negativas
  mediante pruebas que cargan directamente el fixture.
- Integrar el WIP de reglas de lint, completar la configuración ESLint y
  ejecutar lint e imports en CI.
- Sustituir la sonda decimal temporal por pruebas de dominio equivalentes antes
  de retirarla.

## Capabilities

### New Capabilities

- `evm-domain-calculation`: cálculo puro por actividad y proyecto, forma de
  índices, taxonomía, precisión, presentación y consolidación EVM verificables
  contra el fixture contractual.

### Modified Capabilities

Ninguna. Las reglas del scaffold se completan sin cambiar sus requisitos y el
contrato HTTP publicado permanece intacto.

## Impact

El cambio afecta `src/domain/`, `tests/domain/`, la configuración ESLint, los
scripts de prueba, CI y los artefactos OpenSpec aplicables. Integra
`chore/phase-0-lint-rules-wip` preservando su historia. No añade dependencias de
base de datos, Next, HTTP u ORM al dominio y no modifica PRD, ADR, estrategia de
pruebas, OpenAPI ni fixture.
