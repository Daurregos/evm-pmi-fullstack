## Context

La fase 0 dejó `src/domain/decimal.ts` y las firmas declarativas de
`src/domain/evm.ts`, pero no contiene lógica EVM. El diseño aprobado se
encuentra en
`docs/superpowers/specs/2026-07-28-phase-1-evm-domain-design.md`; las reglas de
producto y los valores esperados permanecen cerrados en sus fuentes
autoritativas.

La rama WIP de lint parte de una revisión anterior al scaffold integrado. Su
merge aportará pruebas y configuración útiles, pero sus firmas paralelas deben
reconciliarse con la estructura vigente sin duplicar el modelo de dominio.

## Goals / Non-Goals

**Goals:**

- Implementar el cálculo EVM completo en un módulo puro y aislado.
- Reutilizar una única primitiva para actividad y consolidado.
- Hacer que el fixture sea el oráculo directo y exhaustivo de las pruebas.
- Completar lint, su demostración negativa y la ejecución de lint/imports en CI.
- Retirar la sonda decimal solo después de trasladar todas sus garantías.

**Non-Goals:**

- Persistencia, casos de uso, rutas HTTP, validación de escritura o interfaz.
- Envolventes de error, serialización JSON o adaptación del rango externo de
  porcentajes.
- Modificaciones al PRD, ADR, estrategia de pruebas, OpenAPI o fixture.

## Decisions

### Conservar una única primitiva de magnitudes

`deriveFromMagnitudes` recibe BAC, PV, EV y AC como `Decimal` y produce
variaciones, índices, proyecciones, estado e interpretación. `deriveActivity`
solo obtiene PV y EV desde fracciones normalizadas; `consolidateProject` solo
suma las cuatro magnitudes y añade avance y conteo. Ambas delegan a la misma
primitiva.

Se descartan funciones paralelas por actividad y proyecto porque permitirían
que fórmulas, divisiones por cero o clasificación evolucionaran por separado.

### Mantener tipos y responsabilidades enfocados

`src/domain/evm.ts` conserva la API pública y los tipos del resultado.
`src/domain/decimal.ts` conserva el constructor configurado y todas las
operaciones de presentación. Si el archivo EVM deja de ser comprensible en una
sola unidad, se separarán tipos y presentación en archivos del mismo directorio
sin crear otra ruta de cálculo.

`ActivityState` usa valores internos en inglés y no forma parte del contrato
HTTP. CPI y SPI sí conservan la forma estable `value`, `display`, `status`,
`label`.

### Comparar Decimal contra valores cargados

Los tests importan el JSON con sus tipos auxiliares y convierten cada número
esperado a `Decimal` únicamente para comparar igualdad. No derivan expectativas
ni redondean el fixture. Las anotaciones `$state` de las actividades y
`$input`/`$expected` de los casos focalizados seleccionan casos, pero no se
filtran hacia resultados contractuales.

### Clasificar antes de presentar

La primitiva evalúa CPI y SPI completos y después llama al único helper de
presentación decimal. El helper produce dos decimales con coma y recibe el
estado de banda necesario para decidir si corresponde un marcador. No se
cuantiza ninguna magnitud o cociente intermedio.

### Integrar lint con semántica actual

Se realiza un merge explícito de `chore/phase-0-lint-rules-wip`. Se conservan
sus pruebas AST y su regla tipada de operaciones Decimal, pero se resuelven las
firmas de dominio a favor de `src/domain/evm.ts` y se ajustan las fronteras al
alcance aprobado: dominio, UI y aplicación según la tarea; `scripts/` y
`contracts/` excluidos.

La prueba automatizada demuestra los patrones admitidos y rechazados. Una
demostración adicional modifica temporalmente un archivo real de dominio,
observa el fallo de `npm run lint` y restaura el archivo.

## Risks / Trade-offs

- [El merge WIP reintroduce tipos obsoletos] → resolver conflictos contra el
  scaffold actual y revisar que exista una sola API de dominio.
- [Los números JSON pierden dígitos al cargarse] → comparar contra el valor
  observable publicado por el fixture y añadir la ida y vuelta explícita que
  exige la sonda.
- [Una prueba parametrizada oculta un caso no ejecutado] → registrar los IDs
  recorridos y aseverar el conteo exacto de actividades y casos de banda.
- [La regla Decimal confunde métodos homónimos de otros tipos] → conservar
  análisis de tipos y pruebas positivas que demuestren operaciones no Decimal
  permitidas.
- [El resumen parece correcto pese a usar otra fórmula] → mantener las tres
  aserciones negativas explícitas además de la igualdad positiva.

## Migration Plan

1. Integrar y resolver el WIP de lint; verificar las fronteras antes de añadir
   lógica.
2. Implementar el dominio por ciclos TDD contra el fixture.
3. Trasladar las garantías de la sonda y retirarla.
4. Añadir lint/imports a CI y ejecutar la demostración negativa.
5. Verificar las tareas, archivar los cambios OpenSpec completos y abrir un PR
   dirigido a `develop`.

La reversión consiste en revertir los commits lógicos del slice. No existe
estado persistido ni migración de datos.

## Open Questions

Ninguna. Las decisiones necesarias están cerradas por las fuentes aplicables y
por el diseño aprobado.
