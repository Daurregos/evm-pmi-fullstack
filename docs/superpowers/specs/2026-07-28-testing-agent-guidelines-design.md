# Diseño de integración de la estrategia de pruebas en AGENTS.md

**Estado:** Aprobado
**Fecha:** 2026-07-28

## Objetivo

Integrar `docs/TESTING.md` en las reglas operativas del repositorio sin
contradecir ni reemplazar las instrucciones vigentes de `AGENTS.md`, y corregir
en `docs/TESTING.md` únicamente las ambigüedades detectadas durante su
validación documental.

El resultado debe conservar una sola formulación por regla, mantener las
fuentes canónicas en su ámbito de autoridad y hacer explícito cómo deben usar
los agentes el fixture y la estrategia de pruebas.

## Contexto validado

La revisión contrastó `docs/TESTING.md` con:

- `docs/PRD.md`;
- `docs/ASSUMPTIONS.md`;
- los ADR aceptados de `docs/adr/`;
- `contracts/evm/evm-fixture.json` y `contracts/evm/FIXTURE.md`;
- `contracts/evm/openapi.yaml`;
- la especificación OpenSpec histórica del contrato HTTP; y
- el `AGENTS.md` vigente.

`docs/TESTING.md` coincide con el producto y las decisiones arquitectónicas.
También coincide con el fixture v5.0.0: ocho actividades, siete casos de banda,
trece casos de validación, tres envolventes de error, cuatro combinaciones de
evaluabilidad, cuatro estados y siete infracciones sobre las seis reglas del
caso V9.

La validación detectó ocho ajustes necesarios:

1. El contrato HTTP canónico está en `contracts/evm/openapi.yaml`, no en
   `openapi.yaml`.
2. Los valores enumerados están en inglés, pero no todos usan
   `lowerCamelCase`; algunos tienen formas contractuales como
   `not_evaluable`, `read_only` y `range_0_100`.
3. `docs/TESTING.md` sí define decisiones propias de estrategia de pruebas,
   aunque su introducción afirma que no añade obligaciones.
4. Fijar el número actual de ADR en una regla operativa volvería obsoleta la
   documentación cuando se acepte otro ADR.
5. Presentar un cambio del fixture como «del mismo rango que un ADR» difumina
   la autoridad: exige un cambio contractual dedicado autorizado por la fuente
   superior aplicable y la auditoría de sus dependientes.
6. Una mutación rechazada sí envía su solicitud de escritura, pero no debe
   disparar el `GET` de refresco posterior.
7. Afirmar que ningún nivel repite lo que otro cubre es absoluto: un
   comportamiento puede repetirse cuando otra frontera aporta evidencia
   distinta.
8. La formulación de ADR-007 en integración debe limitar crear, editar y
   eliminar a mutaciones de actividades y comparar con el resultado esperado
   del caso correspondiente del fixture.

## Alcance

### Incluido

- Actualizar `AGENTS.md` mediante una integración quirúrgica de las nuevas
  reglas.
- Incorporar `docs/TESTING.md` al cambio y aplicar los ajustes de precisión
  aprobados.
- Mantener los artefactos de diseño y plan exigidos por Superpowers para la
  trazabilidad de la ejecución.

### Excluido

- Cambiar requisitos o criterios de aceptación de `docs/PRD.md`.
- Modificar supuestos, ADR, fixture, guía del fixture, OpenAPI u OpenSpec.
- Crear o cambiar código de producto o pruebas ejecutables.
- Crear o fusionar un pull request sin una solicitud posterior.

Este es un cambio Git documental y de gobernanza. No requiere un cambio
OpenSpec porque no altera comportamiento de producto ni implementación.

## Modelo de autoridad documental

`AGENTS.md` conservará el principio vigente de consultar primero las fuentes
superiores, pero expresará la autoridad por tema:

| Fuente | Autoridad |
|---|---|
| `docs/PRD.md` | Producto, reglas de negocio y criterios de aceptación |
| `docs/ASSUMPTIONS.md` | Supuestos adoptados y su trazabilidad, subordinados al PRD |
| `docs/adr/` | Decisiones arquitectónicas y técnicas |
| OpenSpec activo | Alcance, especificaciones, diseño y tareas del cambio |
| `contracts/evm/evm-fixture.json` | Oráculo numérico y forma de los ejemplos contractuales |
| `contracts/evm/FIXTURE.md` | Guía de interpretación del fixture |
| `contracts/evm/openapi.yaml` | Contrato HTTP publicado |
| `docs/TESTING.md` | Estrategia, niveles y oráculos de prueba |
| Código, pruebas y evidencia | Materialización y verificación del comportamiento aprobado |

La precedencia es temática, no una jerarquía lineal absoluta. Si dos
artefactos reclaman autoridad sobre el mismo asunto y se contradicen, el agente
se detiene y reporta el conflicto. `AGENTS.md` enlaza las fuentes canónicas y no
reproduce fórmulas, matrices de estados ni esquemas completos.

## Diseño de `AGENTS.md`

### Fuentes y dependencias

La sección inicial incorporará la tabla anterior sin eliminar OpenSpec ni
código, pruebas y evidencia del modelo vigente. Se conservará la regla de
actualizar primero una fuente superior y auditar después sus dependientes.

### Artefactos cerrados durante implementación

Una tarea de implementación tratará PRD, ADR, fixture y OpenAPI como decisiones
cerradas. Si uno parece incorrecto, se detendrá la implementación y se
propondrá el cambio documental o contractual correspondiente. Esta regla no
impide actualizar esos artefactos mediante su flujo dedicado.

### Reglas del oráculo

Se añadirán dos reglas independientes de la lectura de `docs/TESTING.md`:

1. Las pruebas cargan el fixture y nunca recalculan con la lógica bajo prueba
   los valores esperados.
2. El fixture nunca se modifica para lograr que una prueba pase durante un
   ciclo rojo-verde.

### Invariantes EVM

Las reglas nuevas se integrarán en la sección existente, sin duplicar las que
ya contiene:

- Los ocho indicadores son derivados: no se persisten, no se admiten en
  escritura y no se calculan en el cliente.
- La consolidación suma BAC, PV, EV y AC antes de calcular variaciones, ratios
  y proyecciones; nunca promedia índices.
- El redondeo pertenece exclusivamente a la presentación.
- `cpi.value = 0` es un valor definido y desfavorable, distinto de un valor no
  evaluable.

Las fórmulas, los casos límite, la banda neutral y el lenguaje del dominio
seguirán enlazando a `docs/PRD.md`.

### Convenciones contractuales

Los campos y `operationId` usan inglés `lowerCamelCase`. Los valores enumerados
usan inglés y conservan exactamente la forma definida por los ADR y
`contracts/evm/openapi.yaml`. Los textos contractuales dirigidos a personas,
como `label`, `message`, resúmenes y descripciones, usan español.

La convención no exige español para toda la documentación interna del
repositorio ni cambia valores enumerados ya publicados.

### Verificación y cierre

Antes de terminar una tarea, el agente contrastará el resultado con
`docs/TESTING.md` y con la sección `Verificación` de cada ADR aplicable. Este
control se añadirá a la lista de cierre vigente y no reemplazará pruebas, lint,
build, revisión del diff ni comprobación del destino del PR.

## Diseño de `docs/TESTING.md`

El contenido técnico se conservará. Solo se harán estos ajustes:

- Declarar que el documento organiza la verificación de los ADR y define la
  estrategia de pruebas sin introducir decisiones de producto ni arquitectura.
- Reemplazar referencias rígidas a «los diez ADR» por «los ADR aceptados» o
  «los ADR aplicables».
- Aclarar que modificar BAC, avance planificado, avance real o AC cambia los
  resultados derivados, mientras editar el nombre los conserva.
- Referenciar explícitamente `contracts/evm/openapi.yaml` como oráculo del nivel
  de contrato.
- Permitir evidencia intencional entre niveles cuando cada frontera aporte una
  prueba distinta, sin duplicación sin propósito.
- Aclarar que el fixture solo cambia mediante un cambio contractual dedicado,
  autorizado por la fuente superior aplicable y con auditoría de dependientes.
- Distinguir la solicitud de escritura rechazada de la ausencia del `GET` de
  refresco posterior.
- Limitar ADR-007 a crear, editar o eliminar actividades y contrastar cada
  lectura posterior con el resultado esperado del caso correspondiente del
  fixture.

Se conservarán los cinco niveles, las reglas del fixture, los casos cubiertos,
el orden de construcción y el criterio de cobertura.

## Flujo del cambio y manejo de conflictos

El cambio se ejecuta en la rama `docs/testing-agent-guidelines`, creada desde la
versión actual de `origin/develop`, dentro del worktree
`.worktrees/testing-agent-guidelines`.

El `docs/TESTING.md` no rastreado del directorio original se considera trabajo
del usuario. Su contenido se llevará al worktree porque el usuario lo incluyó
explícitamente en el alcance. Los demás archivos no rastreados permanecen
intactos y fuera de los commits.

Si durante la implementación aparece una contradicción nueva con PRD, ADR,
fixture u OpenAPI, el trabajo se detiene y se reporta. No se resolverá
modificando silenciosamente el artefacto superior.

## Verificación

La implementación se considera conforme cuando:

1. `AGENTS.md` conserva los flujos vigentes de OpenSpec, Superpowers, GitFlow,
   worktrees, seguridad y entrega.
2. Las fuentes nuevas aparecen con su ruta y autoridad correctas, incluido
   `contracts/evm/openapi.yaml`.
3. No se impone `lowerCamelCase` a valores enumerados incompatibles con el
   contrato publicado.
4. `docs/TESTING.md` ya no niega su autoridad propia ni fija el número de ADR.
5. Las dos reglas del oráculo son explícitas y no dependen de que el agente
   haya leído `docs/TESTING.md`.
6. Las invariantes nuevas aparecen una sola vez y no reproducen fórmulas o
   matrices completas.
7. Las búsquedas sobre `AGENTS.md` y `docs/TESTING.md` no encuentran la ruta
   obsoleta `openapi.yaml`, la frase «los diez ADR» ni una convención
   incorrecta para enumerados.
8. `git diff --check` no informa errores, incluida la incorporación efectiva de
   los archivos nuevos.
9. El diff y los commits contienen solo los artefactos de esta sesión; los
   demás cambios locales del usuario permanecen preservados.
10. `docs/TESTING.md` no equipara la autoridad del fixture con la de un ADR y
    exige un cambio contractual dedicado autorizado por la fuente superior
    aplicable para modificarlo.
11. `docs/TESTING.md` distingue una solicitud de escritura rechazada de la
    ausencia del `GET /projects/{projectId}` de refresco posterior.
12. `docs/TESTING.md` permite evidencia intencional entre niveles cuando otra
    frontera aporta evidencia distinta, sin duplicación sin propósito.
13. La regla ADR-007 de `docs/TESTING.md` limita crear, editar y eliminar a
    actividades y compara contra el resultado esperado del caso correspondiente
    del fixture.
