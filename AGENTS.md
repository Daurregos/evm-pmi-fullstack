# Repository Agent Guidelines

## Scope and source of truth

Estas instrucciones aplican a todo el repositorio.

Antes de cambiar el producto, identifica las fuentes aplicables y respeta la
autoridad de cada una sobre el asunto en disputa:

| Fuente | Autoridad sobre |
|---|---|
| `docs/PRD.md` | Qué se construye, reglas de negocio y criterios de aceptación |
| `docs/ASSUMPTIONS.md` | Supuestos adoptados y su trazabilidad, subordinados al PRD |
| `docs/adr/` | Decisiones arquitectónicas y técnicas |
| OpenSpec del cambio activo | Propuesta, especificaciones, SDD y tareas del cambio |
| `contracts/evm/evm-fixture.json` | Oráculo de los valores numéricos y de la forma de los ejemplos contractuales |
| `contracts/evm/FIXTURE.md` | Guía de lectura del fixture |
| `contracts/evm/openapi.yaml` | Contrato HTTP publicado |
| `docs/TESTING.md` | Qué se prueba, en qué nivel y contra qué |
| Código, pruebas y evidencia | Materialización y verificación del comportamiento aprobado |

La precedencia es temática, no una jerarquía lineal absoluta. Ante un conflicto,
gana la fuente con autoridad sobre el asunto en disputa. Si dos fuentes se
contradicen sobre el mismo asunto, detente y repórtalo en lugar de elegir una.

No resuelvas silenciosamente contradicciones en el código. Corrige o escala primero el artefacto responsable. Evita copiar contenido entre niveles; enlaza la fuente canónica. Si el trabajo sobre un ADR revela una ambigüedad de producto o cambia un comportamiento visible, actualiza primero `docs/PRD.md`; después alinea el ADR y sus artefactos dependientes. Tras modificar una fuente autoritativa sobre el asunto, audita explícitamente sus dependientes, incluido este `AGENTS.md` y OpenSpec cuando exista un cambio activo.

## Closed artifacts during implementation

En una tarea de implementación, trata el PRD, los ADR, el fixture y el OpenAPI
como decisiones cerradas. No los modifiques para reconciliar el código ni para
hacer pasar una prueba. Si alguno parece incorrecto, detén la implementación y
repórtalo; su corrección exige el flujo documental o contractual dedicado y la
auditoría posterior de sus dependientes.

## Oracle rules

Estas reglas no dependen de haber leído `docs/TESTING.md`:

1. Toda prueba cuyo comportamiento esperado esté representado en
   `contracts/evm/evm-fixture.json` lo carga directamente; nunca recalcula los
   valores esperados con la misma lógica que está probando.
2. El fixture no se modifica para hacer pasar una prueba dentro de un ciclo
   rojo-verde. Ante una discrepancia, el defecto está en el código cuando el
   fixture sigue siendo coherente con el PRD, los ADR y el OpenAPI aplicables;
   si esas fuentes discrepan, detente y reporta el conflicto.

## Required change workflow

Usa OpenSpec para administrar el alcance y el SDD de cambios de producto o implementación. Usa Superpowers para analizar y ejecutar el trabajo con disciplina.

Un cambio dedicado exclusivamente a crear o actualizar ADR no crea, actualiza, aplica ni archiva artefactos OpenSpec. Usa `superpowers:brainstorming`, revisión documental y `superpowers:verification-before-completion`; usa `superpowers:writing-plans` solo cuando la ejecución tenga varios pasos. `superpowers:test-driven-development` se reserva para código y correcciones de comportamiento.

Si un ADR surge dentro de un cambio OpenSpec activo, el ADR registra la decisión y los artefactos de diseño, specs o tareas del cambio lo referencian.

Para cambios gestionados con OpenSpec, sigue este flujo:

1. Inspecciona el estado de Git, el PRD, los ADR aplicables y los cambios OpenSpec activos.
2. Antes de trabajo creativo o cambios de comportamiento, usa `superpowers:brainstorming`.
3. Crea o actualiza el cambio con OpenSpec. Su propuesta, specs, diseño y tareas son la definición canónica del cambio.
4. Si una decisión tiene impacto arquitectónico relevante, regístrala en un ADR y haz que OpenSpec la referencie.
5. Convierte las tareas aprobadas en un plan ejecutable con `superpowers:writing-plans` cuando el trabajo tenga varios pasos.
6. Aplica el cambio OpenSpec usando las skills de implementación pertinentes. Para código o correcciones, usa `superpowers:test-driven-development` antes de escribir la implementación.
7. Ejecuta `superpowers:verification-before-completion` antes de afirmar que el trabajo está terminado, hacer el commit final o crear el PR.
8. Cuando el cambio esté completo y verificado, archívalo con OpenSpec. La actualización del archivo histórico sigue el mismo flujo de revisión.

Los planes de Superpowers detallan la ejecución; no reemplazan las specs ni las tareas canónicas de OpenSpec. Si divergen, actualiza OpenSpec antes de continuar.

Los planes referencian las rutas canónicas de PRD y ADR, describen cambios concretos y definen criterios verificables; no reproducen el texto completo de esos artefactos.

## GitFlow and worktrees

- Nunca hagas commits directamente en `main` ni en `develop`.
- Parte de la versión actual de `origin/develop`.
- Usa una rama nueva para cada cambio y un worktree aislado bajo `.worktrees/`.
- Verifica que `.worktrees/` esté ignorado antes de crear el worktree.
- Dirige cada pull request de integración a `develop`.
- Mantén commits pequeños y lógicos. Conserva en commits separados versiones aprobadas cuya comparación aporte trazabilidad.
- Mientras la rama no se haya publicado, consolida correcciones menores de revisión en el commit lógico correspondiente; no crees un commit por cada microajuste.
- Crear un PR no autoriza fusionarlo. Fusiónalo solo cuando el usuario lo solicite o exista autorización explícita.
- No elimines una rama ni un worktree antes de confirmar la integración y comprobar que no tiene cambios pendientes.
- Después de integrar, retira el worktree limpio y poda su metadata. Conserva las ramas salvo que se solicite eliminarlas.

## EVM domain invariants

`docs/PRD.md` es la fuente canónica de fórmulas, casos límite, banda de tolerancia y lenguaje del dominio.

- Los cinco únicos datos capturados por actividad son: nombre, BAC, avance planificado a la fecha de corte, avance real y AC.
- PV, EV, CV, SV, CPI, SPI, EAC y VAC son indicadores derivados. Nunca se
  capturan, editan, persisten ni aceptan en escritura. Tampoco se calculan en
  el cliente.
- Consolida sumando BAC, PV, EV y AC por actividad; calcula variaciones, ratios
  y proyecciones después. Nunca promedies CPI ni SPI.
- El avance del proyecto es `EV_total / BAC_total`.
- Las divisiones por cero producen estados de negocio legítimos definidos o no evaluables según el PRD; no son errores técnicos.
- `cpi.value = 0` es un valor definido y desfavorable, distinto de un indicador
  no evaluable.
- El redondeo pertenece exclusivamente a la presentación. Los cálculos, la
  clasificación y la interpretación usan valores sin redondear; aplica la banda
  neutral al índice sin redondear según el PRD.
- En requisitos de producto, conserva la trazabilidad: `[E]` explícito, `[D]` derivado necesariamente del dominio y `[S]` supuesto adoptado.

No dupliques aquí las fórmulas ni la matriz completa de estados. Si cambia una regla EVM, actualiza primero el PRD y después sus artefactos dependientes.

## Contract conventions

- Los campos y `operationId` usan inglés `lowerCamelCase`.
- Los valores enumerados usan inglés y conservan exactamente la forma definida
  por los ADR y `contracts/evm/openapi.yaml`.
- Los textos contractuales dirigidos a personas —como `label`, `message`,
  resúmenes y descripciones— usan español.

## Safety and ownership

- Trata los cambios existentes y los archivos no rastreados como trabajo del usuario.
- No reviertas, sobrescribas, muevas ni incluyas cambios ajenos en un commit.
- Evita operaciones forzadas o destructivas. Solicita autorización cuando el alcance o la recuperación no sean claros.
- Lee las instrucciones completas de cualquier skill aplicable antes de actuar.
- No inventes decisiones faltantes con impacto en producto o arquitectura; registra el supuesto o solicita dirección.

## Verification and handoff

Usa los comandos reales del proyecto para pruebas, lint y build. Para cambios documentales, como mínimo:

```bash
git diff --check
```

`git diff --check` no inspecciona archivos nuevos aún no rastreados. Antes de verificar uno, usa `git add -N -- 'ruta/real-del-archivo.md'`, sustituyendo el ejemplo por la ruta exacta, o una alternativa que lo incluya efectivamente sin incorporar contenido ajeno. Los planes escriben la ruta concreta en todo comando prescrito para ejecución literal.

Antes del cierre:

1. Contrasta el resultado con `docs/TESTING.md` y con la sección `Verificación`
   de cada ADR aplicable.
2. Comprueba cada requisito o tarea contra el diff resultante.
3. Ejecuta verificaciones frescas y lee su salida completa.
4. Revisa que el commit contenga solo archivos del cambio.
5. Confirma el estado del PR y su destino `develop`.
6. Informa evidencia, limitaciones y cambios locales preservados.
7. Ejecuta literalmente los comandos prescritos y confirma que validan el artefacto objetivo.

No declares que algo funciona, está integrado o está limpio basándote solo en una edición, una ejecución anterior o el reporte de otro agente.
