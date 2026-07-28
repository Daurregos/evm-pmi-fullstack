## Why

El API EVM ya tiene decisiones distribuidas entre el PRD, seis ADR y el
fixture canónico, pero carece de un contrato OpenAPI validable que las reúna
sin agregar decisiones implícitas. El entregable permite implementar y probar
consumidores contra una interfaz explícita, a la vez que hace visibles los
huecos que todavía deben cerrar los ADR responsables.

## What Changes

- Crear `contracts/evm/openapi.yaml` como documento único OpenAPI 3.1.0.
- Declarar únicamente las rutas, operaciones, respuestas y esquemas decididos
  o necesariamente derivados de `docs/PRD.md`, ADR-003, ADR-004, ADR-006a,
  ADR-006b, ADR-007 y ADR-009.
- Separar esquemas de escritura y lectura, incluido el tratamiento estable de
  índices no evaluables y el esquema común de errores.
- Incorporar ejemplos literales de `contracts/evm/evm-fixture.json`, incluido
  el caso compuesto V9.
- Registrar dentro del mismo YAML las decisiones faltantes y omitir las
  operaciones que no pueden contratarse sin resolverlas.
- Añadir verificaciones reproducibles de validez OpenAPI, referencias,
  ejemplos, superficie y restricciones.

## Capabilities

### New Capabilities

- `evm-api-contract`: Contrato OpenAPI validable y trazable del API de
  proyectos, actividades, resultados EVM y errores.

### Modified Capabilities

Ninguna.

## Impact

El cambio añade un contrato compartido bajo `contracts/evm/` y artefactos
documentales de diseño y verificación. No modifica el PRD, los ADR, el fixture,
la implementación del backend o frontend, ni introduce dependencias de
ejecución. Los huecos detectados quedan asignados al ADR que debe resolverlos,
sin alterar silenciosamente la superficie del API.
