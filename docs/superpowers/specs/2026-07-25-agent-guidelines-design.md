# Diseño de las instrucciones para agentes

## Propósito

Definir en `AGENTS.md` un contrato operativo breve para que futuros agentes mantengan el flujo documental, el dominio EVM y el proceso de integración del repositorio. El archivo orientará el trabajo sin duplicar el PRD, los ADR, los artefactos OpenSpec ni las skills de Superpowers.

## Fuentes y jerarquía

El flujo de definición será:

1. `docs/PRD.md`: qué necesita el producto y por qué.
2. `docs/adr/`: decisiones arquitectónicas relevantes y sus consecuencias.
3. OpenSpec: propuesta, especificaciones, SDD y tareas de cada cambio.
4. Implementación y evidencia de verificación.

Si dos artefactos se contradicen, el agente no ocultará la diferencia en la implementación. Corregirá o escalará primero el artefacto responsable.

## Flujo de trabajo

OpenSpec administrará el cambio y su SDD. Superpowers se usará para explorar requisitos, crear planes, aplicar TDD cuando corresponda, ejecutar el trabajo y verificar el resultado. El agente deberá revisar el PRD, los ADR aplicables y los cambios OpenSpec activos antes de implementar.

Cada cambio partirá de `develop`, tendrá una rama propia y un worktree bajo `.worktrees/`, y se integrará mediante un pull request dirigido a `develop`. No se harán commits directos en `main` ni en `develop`. La limpieza ocurrirá únicamente después de comprobar la integración.

## Invariantes del dominio

`AGENTS.md` conservará solo recordatorios que previenen errores:

- distinguir los cinco datos capturados de los ocho indicadores derivados;
- no permitir la edición de indicadores;
- consolidar magnitudes antes de calcular ratios, sin promediar índices;
- tratar las divisiones por cero como estados legítimos no evaluables cuando corresponda;
- preservar las marcas `[E]`, `[D]` y `[S]` en requisitos;
- remitir al PRD para fórmulas, casos límite y lenguaje del dominio.

## Seguridad y verificación

Los agentes preservarán cambios locales ajenos y evitarán operaciones forzadas o destructivas sin autorización. Antes de afirmar que un cambio está terminado, ejecutarán verificaciones pertinentes y reportarán evidencia. Un worktree no se eliminará con cambios pendientes ni antes de que su integración esté confirmada.

## Límites

`AGENTS.md` no incluirá decisiones de stack, comandos extensos, fórmulas EVM ni copias completas de instrucciones mantenidas por OpenSpec o Superpowers. Sus referencias deberán seguir siendo útiles aunque esos detalles evolucionen.

## Validación

La modificación será aceptable si un agente puede determinar sin ambigüedad:

- qué artefacto contiene cada nivel de decisión;
- cuándo usar OpenSpec y cuándo usar Superpowers;
- cómo crear e integrar un cambio;
- qué invariantes EVM no puede romper;
- qué debe verificar antes de cerrar y limpiar.
