# Rationale de la frontera EVM en arquitectura

**Fecha:** 2026-07-29 · **Estado:** aprobado por el usuario

## Objetivo

Hacer explícito en `docs/ARCHITECTURE.md` por qué los indicadores EVM se
resuelven exclusivamente en `src/domain`, qué costo de interacción introduce
esa decisión y cómo se impide estructuralmente duplicar las reglas en
`src/ui`.

## Encaje

La frase sobre el reparto de presentación se añade como último punto de
`Límites`, junto a las responsabilidades de cada capa. La nueva sección
`Por qué la frontera está aquí` se ubica inmediatamente después de las reglas
de `phase0/source-boundaries` y antes de `Lectura y cálculo`: primero declara
la frontera, después explica su motivación y finalmente muestra el recorrido
ejecutable.

El texto proporcionado por el usuario se conserva sin reinterpretar decisiones
de producto o arquitectura. No se modifican PRD, ADR, OpenAPI, fixture,
OpenSpec ni código.

## Verificación

- `git diff --check`;
- revisión de que el bloque aparece una sola vez y en el orden acordado;
- confirmación de que el diff documental solo contiene el diseño, el plan y
  `docs/ARCHITECTURE.md`.
