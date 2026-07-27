# Diseño del flujo ADR-only en AGENTS.md

**Fecha:** 2026-07-26

**Estado:** Aprobado para planificación

## Objetivo

Actualizar `AGENTS.md` para que los cambios dedicados exclusivamente a crear o modificar ADR no usen OpenSpec, sin romper la trazabilidad cuando una decisión arquitectónica forme parte de un cambio OpenSpec activo. Incorporar además guardrails documentales demostrados por la redacción y revisión de ADR-003 y ADR-005.

## Enrutamiento de cambios

- Un cambio ADR-only no crea, actualiza, aplica ni archiva artefactos OpenSpec.
- Si un ADR surge dentro de un cambio OpenSpec activo, el ADR registra la decisión y el diseño, las specs o las tareas del cambio lo referencian.
- Un cambio ADR-only usa `superpowers:brainstorming`, revisión documental y `superpowers:verification-before-completion`; usa `superpowers:writing-plans` solo cuando la ejecución tenga varios pasos.
- `superpowers:test-driven-development` se reserva para código y correcciones de comportamiento, no para documentación ADR-only.

## Jerarquía y consistencia documental

- Si el trabajo sobre un ADR revela una ambigüedad o cambia comportamiento visible, se actualiza primero `docs/PRD.md`; después se alinean el ADR y los artefactos dependientes.
- Tras cambiar una fuente superior, se auditan explícitamente sus dependientes, incluido `AGENTS.md` y OpenSpec cuando exista un cambio activo.
- Los planes no reproducen el texto completo de PRD o ADR. Referencian la ruta canónica, describen cambios concretos y definen criterios de aceptación verificables.

## Verificación y disciplina de Git

- `git diff --check` no se considera suficiente para un archivo nuevo todavía no rastreado. Antes de comprobarlo se usa `git add -N <ruta-exacta>` o una alternativa que incluya efectivamente el archivo.
- Los comandos prescritos por un plan se ejecutan literalmente antes del cierre; el reporte de otro agente no sustituye evidencia propia.
- Las correcciones menores realizadas durante la revisión de una rama aún no publicada se consolidan en commits lógicos. Solo se conservan versiones separadas cuando su comparación aporta trazabilidad.
- La verificación final confirma requisitos contra el diff, alcance de cada commit, estado del PR y cambios locales preservados.

## Ubicación en AGENTS.md

La excepción ADR-only y el tratamiento de ADR dentro de OpenSpec se incorporarán en `Required change workflow`. Los guardrails de jerarquía se reforzarán en `Scope and source of truth`; la verificación de archivos nuevos y la disciplina de commits se ubicarán en `Verification and handoff` y `GitFlow and worktrees`, evitando duplicar reglas existentes.

## No objetivos

- No cambiar el PRD, los ADR existentes ni OpenSpec.
- No introducir un flujo distinto para cada tipo de documento.
- No eliminar OpenSpec del desarrollo de producto.
- No definir herramientas, formatos o límites propios de un ADR concreto.

## Verificación

La revisión comprobará que la excepción no pueda interpretarse como una prohibición global de OpenSpec para ADR vinculados a cambios activos; que no existan instrucciones contradictorias en `AGENTS.md`; que las nuevas reglas estén en una única ubicación canónica; y que `git diff --check` pase sobre todos los archivos del cambio.
