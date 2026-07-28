# Diseño de correcciones del contrato de ADR-006b

**Fecha:** 2026-07-27

**Estado:** Aprobado para redacción

**Alcance:** ADR-006b — Forma de la respuesta y contrato de datos

## Objetivo

Alinear el nombre del contador consolidado con el lenguaje objetivo del PRD y
completar el tipo de los identificadores que ADR-006a usa en rutas y ADR-006b
expone en las lecturas, sin introducir otras decisiones de producto o
arquitectura.

## Problemas verificados

RF-07 y el PRD §7.3 definen el contador por la condición objetiva `EV > 0` y
`AC = 0`; solo consideran posible un rezago de costos y no afirman que falte
imputar un dato. El nombre contractual `activitiesWithUnimputedCost` adelanta
esa causa y debe sustituirse por `activitiesWithEvAndZeroAc`.

ADR-006a usa `projectId` y `activityId` en las rutas y delega nombres, tipos y
formatos a ADR-006b. ADR-006b incluye `id` en las lecturas, pero ninguno de los
nueve ADR define el tipo de los identificadores.

## Decisión diseñada

ADR-006b reemplazará `activitiesWithUnimputedCost` por
`activitiesWithEvAndZeroAc` en la forma de `summary`.

ADR-006b establecerá que los identificadores de proyecto y actividad son
enteros. La definición cubrirá tanto los campos `id` de las lecturas como
`projectId` y `activityId` en las rutas de ADR-006a. No fijará tamaño, signo,
formato como `int32` o `int64`, ni mecanismo de generación adicional.

## Consecuencia diseñada

ADR-006b registrará que estos identificadores son secuenciales y, por tanto,
adivinables y enumerables. Esa propiedad sería inaceptable para recursos
expuestos públicamente, pero resulta irrelevante dentro del alcance actual:
una herramienta interna sin control de acceso.

## Alternativas descartadas

- Repetir el tipo en ADR-006a duplicaría una decisión que ese ADR delega
  expresamente a ADR-006b.
- Añadir tamaño, signo, formato OpenAPI o detalles de generación introduciría
  decisiones no requeridas.
- Mantener el nombre anterior conservaría una inferencia causal contraria al
  lenguaje vigente del PRD.

## Límites y dependientes

Solo se modificará
`docs/adr/006b-forma-respuesta-contrato-datos.md`. El PRD ya contiene el
comportamiento canónico y no necesita cambios. ADR-006a conserva su
delegación; `docs/ASSUMPTIONS.md` no usa el nombre contractual; `AGENTS.md` no
duplica esta decisión; y no existe un cambio OpenSpec activo que actualizar.
Los fixtures y demás archivos locales del usuario quedan fuera del cambio.

## Verificación

La revisión comprobará que ADR-006b:

- contiene `activitiesWithEvAndZeroAc` y ya no contiene
  `activitiesWithUnimputedCost`;
- define como enteros los identificadores de proyecto y actividad sin agregar
  formato, tamaño ni signo;
- registra la secuencialidad, enumerabilidad y el límite de exposición;
- no altera ninguna otra decisión.

La verificación documental ejecutará `git diff --check` sobre el diff
resultante y confirmará que el commit de implementación solo incluya ADR-006b.

## Entregable

- `docs/adr/006b-forma-respuesta-contrato-datos.md`
