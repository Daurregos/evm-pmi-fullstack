# Diseño de validación final del fixture EVM 4.0.0

## Objetivo

Revalidar desde cero `evm-fixture.json` 4.0.0 y `FIXTURE.md` contra
`docs/PRD.md` y los diez ADR vigentes, sobrescribir
`FIXTURE-VALIDATION-REPORT.md` con evidencia completa y, únicamente si no
existe ninguna discrepancia, ubicar los dos artefactos canónicos en
`contracts/evm/`.

Esta auditoría no cambia requisitos de producto, decisiones arquitectónicas ni
comportamiento de implementación. Por tanto, no abre un cambio OpenSpec. El
PRD y los ADR siguen siendo las fuentes canónicas; el fixture es un artefacto
de contrato derivado.

## Entradas y aislamiento

La rama `docs/validate-evm-fixture-v4` parte de la versión vigente de
`origin/develop` y se trabaja en un worktree aislado. Las entradas locales
`evm-fixture.json` y `FIXTURE.md` se copian byte a byte al worktree después de
registrar sus hashes. Las originales no se modifican durante la auditoría.

El informe anterior corresponde a 3.3.1 y no se acepta como evidencia para
4.0.0. Puede orientar dónde hubo riesgo histórico, pero cada comprobación se
ejecuta de nuevo sobre el contenido completo.

## Estrategia de validación

La auditoría combina dos fuentes de evidencia:

1. Un comprobador independiente y temporal, fuera del repositorio, analiza el
   JSON y recalcula resultados sin tomar los indicadores esperados como
   entradas. Valida estructura contractual, identificadores, contador,
   validaciones, envolventes, cobertura, taxonomía, aritmética y presentación.
2. Una revisión documental contrasta todas las afirmaciones de `FIXTURE.md` y
   las secciones `Verificación` de los diez ADR con el JSON y las fuentes
   canónicas. La revisión incluye metadatos con prefijo `$`; eliminarlos del
   payload no exime su prosa de ser verdadera.

El comprobador temporal no se versiona. Crear una herramienta permanente sería
una ampliación de alcance distinta de esta validación final.

### Forma contractual

Se elimina recursivamente toda clave cuyo nombre empiece por `$` solo dentro de
`readResponse`. El resultado se compara por bloques, orden lógico, nombres,
presencia, tipos y forma con ADR-006b:

- `project`: `id`, `name`, `cutoffDate`;
- cada actividad: `id`, los cinco datos capturados y los ocho indicadores;
- `summary`: los totales, indicadores, `progress` y
  `activitiesWithEvAndZeroAc`;
- `cpi` y `spi`: exactamente `value`, `display`, `status` y `label`.

También se comprueba que los identificadores sean enteros y que no existan
campos contractuales adicionales o ausentes.

### Reglas, taxonomía y errores

`validationChecks` se contrasta con PRD §7.5 y ADR-009 en ambos sentidos:
cada regla real debe tener cobertura y ningún caso puede inventar una regla.
Los nueve casos deben usar `422`; las infracciones solo pueden usar
`required`, `positive`, `non_negative`, `range_0_100` o `read_only`; V9 debe
acumular en una petición todas las infracciones representadas por las cinco
reglas.

`errorEnvelopes` debe cubrir `400`, `404` y `422` con la envolvente común
`code`, `message`, `violations`. La taxonomía debe representar los cinco casos
de PRD §7.3 y las cuatro combinaciones de evaluabilidad de CPI y SPI.

### Aritmética y presentación

Para cada actividad se recalculan PV, EV, CV, SV, CPI, SPI, EAC y VAC desde
BAC, avance planificado, avance real y AC. Después se suman BAC, PV, EV y AC y
se derivan desde esos totales todos los resultados consolidados. La comparación
usa aritmética racional o decimal suficiente y tolerancias solo para la
aproximación JSON declarada por ADR-006b, nunca valores mostrados redondeados.

La presentación se verifica de forma independiente: dos decimales para montos
e índices, avance entero, empates alejándose de cero, banda inclusiva aplicada
al valor sin redondear y marcadores únicamente cuando el redondeo oculta un
cruce de 0,99 o 1,01. El caso a7 demuestra el empate exacto.

## Informe y decisión condicional

`FIXTURE-VALIDATION-REPORT.md` se regenera para 4.0.0. Contiene una tabla con
las once comprobaciones, resultado explícito —incluido `COINCIDE`— y referencia
exacta. Añade la evidencia aritmética y la matriz de soporte de los diez ADR,
sin atribuir al fixture la ejecución de comportamiento de runtime que solo
pueden demostrar pruebas futuras.

La decisión es binaria:

- Si existe cualquier discrepancia contractual, numérica, de presentación o
  documental, el informe la describe y los dos artefactos permanecen sin
  reubicar ni corregir.
- Si no existe ninguna discrepancia, el informe lo declara sin reservas y las
  copias auditadas se ubican en `contracts/evm/`.

## Ubicación definitiva

La ruta aprobada es:

- `contracts/evm/evm-fixture.json`
- `contracts/evm/FIXTURE.md`

`contracts/evm/` está en la raíz y no pertenece a las pruebas del backend ni
del frontend. El nombre expresa que el JSON es un contrato compartido, no
documentación auxiliar, y mantiene su guía en el mismo directorio. La ruta
también puede ser consumida por ejemplos de OpenAPI sin crear una dependencia
entre lados de la aplicación.

Si el resultado es limpio, todas las menciones aplicables de
`evm-fixture.json` en los diez ADR se actualizan a la ruta canónica. Se auditan
además `docs/PRD.md` y `docs/ASSUMPTIONS.md`; solo se editan si contienen una
referencia que deba cambiar. `FIXTURE-VALIDATION-REPORT.md` permanece en la
raíz porque el encargo solicita sobrescribir ese archivo y no lo incluye entre
los dos artefactos que deben quedar juntos.

## Verificación y entrega

Antes del cierre se ejecutan de nuevo:

- el comprobador temporal completo sobre los archivos ya ubicados, si procede;
- búsquedas de referencias antiguas en PRD, ADR y `ASSUMPTIONS.md`;
- comparación de hashes para demostrar que la reubicación no alteró el JSON ni
  la guía;
- `git diff --check`;
- revisión requisito por requisito de las once comprobaciones contra el diff;
- `git status` y revisión del diff para confirmar que la rama solo contiene
  artefactos de esta auditoría.

No se crea ni fusiona un pull request sin autorización adicional.
