# Slice B2 — Flujo de edición del dashboard

**Fecha:** 2026-07-29 · **Rama:** `feat/slice-b2-dashboard-editing`

## Contexto

`develop` integra A1 (aplicación y persistencia), A2 (las ocho operaciones HTTP
reales) y B1 (dashboard de solo lectura). El cliente sabe leer la colección y la
foto analítica, pero no sabe escribir: no hay formularios ni mutaciones.

Esta rebanada cierra la funcionalidad. Territorio: `src/ui/`, `src/app/` y las
pruebas de cliente. No toca `domain/`, `application/`, `infrastructure/`,
`shared/`, las rutas del API ni el mock. Fuentes cerradas: `docs/PRD.md`,
`docs/adr/`, `contracts/evm/openapi.yaml` y `contracts/evm/evm-fixture.json`.

`src/shared/contract.ts` ya declara `ProjectWrite`, `ActivityWrite`,
`ContractViolation` y `ErrorEnvelope`: no falta ningún tipo.

## Objetivos y no-objetivos

**Objetivos.** RF-01 y RF-02 sobre las ocho operaciones de A2: crear, editar y
eliminar proyectos y actividades; captura de los cinco datos y solo esos;
recálculo al confirmar (RF-03); reemplazo conjunto de tabla, resumen y gráfica
desde una única lectura posterior (ADR-007); infracciones de `422` junto a su
campo (ADR-009, RF-02); criterio de RF-01 al eliminar el proyecto seleccionado.

**No-objetivos.** Backend, contratos, validación de negocio en el cliente,
cálculo de indicadores, historial, deshacer y confirmaciones de borrado con
diálogo de segundo nivel más allá de una confirmación simple.

## Decisiones

### El cliente serializa; no valida ni redondea

El formulario guarda **cadenas crudas**, tal como se digitaron, y las convierte
a `ActivityWrite` o `ProjectWrite` solo al confirmar. La conversión es
serialización, no validación:

- una cadena vacía viaja como `null`, que ADR-009 trata como ausencia de valor y
  responde `422` con `rule: "required"`;
- un texto numérico no finito también viaja como `null`, porque no existe una
  representación JSON del número que la persona intentó escribir;
- nada se recorta ni se normaliza: ADR-009 asigna al backend el recorte de
  espacios laterales de `name`.

Los porcentajes capturados llegan al formulario con `String(value)`, que
conserva la representación más corta que reproduce el número: `49.5` sigue
siendo `49.5` y no gana ni pierde decimales. Coherente con RF-03 y ADR-003, el
redondeo pertenece a la presentación y el formulario no presenta: captura.

`PUT` reemplaza todos los campos editables (ADR-006a), así que el formulario
envía siempre las cinco claves de la actividad o las dos del proyecto, no solo
las modificadas. La consecuencia práctica es que el formulario de edición se
precarga con la representación actual.

### Los controles numéricos son `type="number"` con `step="any"`

El valor viaja tal cual, sin redondear, y el navegador resuelve el separador
decimal según su locale. La alternativa —texto con coma— obligaría al cliente a
interpretar `49,5`, es decir a parsear entrada del dominio, y a decidir qué
hacer con lo ambiguo. Se prefiere que el cliente no interprete.

Los ocho indicadores no tienen control de captura en ninguna parte del
formulario. Enviarlos produciría `422` con `rule: "read_only"`, que es
exactamente lo que el fixture prueba en V8; el formulario ni siquiera los
conoce.

### El recálculo ocurre al confirmar, nunca al digitar

La digitación solo cambia estado local: los módulos de estado del formulario
—`activity-form-state.ts` y `project-form-state.ts`— son funciones puras sin
acceso a la red y no importan el cliente HTTP. La petición nace en el envío.

### Escritura y refresco son dos operaciones, y el refresco se reintenta solo

`mutation-flow.ts` materializa la mitad de cliente de ADR-007 con un plan de
dos partes:

```ts
interface MutationPlan {
  write: () => Promise<void>;
  refresh: () => Promise<DashboardPatch>;
}
```

`applyMutation` ejecuta la escritura y, **solo si tuvo éxito**, el refresco:

| Resultado | Cuándo | Consecuencia en la vista |
|---|---|---|
| `rejected` | la escritura falló | no se pide ninguna lectura; el formulario muestra las infracciones |
| `applied` | escritura y refresco correctos | se reemplazan tabla, resumen y gráfica juntos |
| `stale` | la escritura tuvo éxito y falló la lectura | el cambio permanece guardado; la vista se declara desactualizada |

El resultado `stale` **conserva el `refresh` del plan y descarta el `write`**, de
modo que `retryRefresh` solo puede releer. Reintentar la escritura duplicaría la
actividad; con esta forma el error no es representable, no solo indeseable.

`DashboardPatch` es un reemplazo parcial y coherente de la vista
—`projects`, `selectedProjectId`, `analysis`— y cada operación declara qué
lecturas lo componen:

| Operación | Lecturas del refresco | Fundamento |
|---|---|---|
| crear, editar o eliminar actividad | `GET /projects/{projectId}` | ADR-007 |
| crear proyecto | `GET /projects` y la foto del proyecto creado | RF-01 |
| editar proyecto | `GET /projects` y la foto del proyecto editado | RF-01, ADR-005 |
| eliminar el proyecto seleccionado | `GET /projects` | RF-01: queda sin selección |
| eliminar otro proyecto | `GET /projects` y la foto del seleccionado | RF-01 |

Al crear un proyecto, el cuerpo del `201` se usa **solo** para saber qué
proyecto leer después. Tabla, resumen y gráfica provienen exclusivamente de la
lectura posterior, como exige ADR-007 cuando dice que el dashboard no consume la
representación de escritura para refrescar.

Eliminar el proyecto seleccionado no pide su foto inexistente, cumpliendo a la
vez ADR-007 y el criterio de RF-01: el dashboard queda sin selección aunque
existan otros proyectos.

### Las infracciones se ubican por `field` y se deciden por `code` y `rule`

`form-feedback.ts` traduce un fallo del API en retroalimentación de formulario y
decide únicamente sobre los enumerados:

- `code: "validation_failed"` reparte `violations` por `field`. Las que
  corresponden a un campo del formulario se muestran junto a él; las demás
  —`cpi` con `read_only`, `owner` con `unknown`, o una `rule` futura
  desconocida— se muestran en una lista general que conserva `field` y su
  `message`, sin fallar, como ordena ADR-009.
- `code: "malformed_request"` y `code: "not_found"` traen `violations` vacío y
  comparten un tratamiento genérico, igual que un fallo de red o una respuesta
  sin envolvente.

Un mismo campo puede acumular varias infracciones y todas se muestran. El texto
de `message` se **muestra** pero nunca se inspecciona para decidir: ADR-009 lo
declara no automatizable.

### Diálogos nativos, estado en un solo componente

Los formularios viven en `<dialog>` nativo. `modal.tsx` monta el elemento solo
cuando hay algo que editar y llama `showModal()` y `close()` en un efecto, de
modo que el navegador aporta capa superior, retención del foco y `Esc`. El
efecto no se ejercita al nivel de cliente, que renderiza con `react-dom/server`;
por eso `modal.tsx` no contiene más lógica que abrir y cerrar, y todo el
comportamiento verificable vive en los módulos sin React.

`dashboard-view.tsx` sigue siendo el único componente con estado. Gana el estado
del editor y el aviso de vista desactualizada, y sigue sin lógica propia: cada
transición delega en un módulo probado.

### La tabla deja de ser de solo lectura

RF-02 exige editar y eliminar actividades y la tabla es donde están. Gana una
columna de acciones con «Editar» y «Eliminar» por fila, presente solo cuando el
consumidor entrega los manejadores. La captura sigue fuera de la tabla: dentro
no hay ningún control de entrada. Esto modifica el requisito de B1 «la tabla no
ofrece edición en esta rebanada», y el cambio se registra en la spec de
`evm-dashboard-client`.

## Arquitectura

```
src/ui/activity-form-state.ts   estado puro de los cinco datos capturados
src/ui/project-form-state.ts    estado puro de nombre y fecha de corte
src/ui/form-feedback.ts         envolvente de error → infracciones por campo
src/ui/mutation-flow.ts         ADR-007: escritura, refresco y reintento
src/ui/dashboard-mutations.ts   un plan por operación, sobre el cliente HTTP
src/ui/evm-api-client.ts        (+) las seis escrituras y `violations`
src/ui/modal.tsx                <dialog> nativo
src/ui/form-field.tsx           control, etiqueta y mensajes del campo
src/ui/activity-form.tsx        los cinco datos y nada más
src/ui/project-form.tsx         nombre y fecha de corte
src/ui/activities-table.tsx     (+) columna de acciones opcional
src/ui/dashboard.tsx            (+) acciones de proyecto y nueva actividad
src/ui/dashboard-view.tsx       (+) estado del editor y aviso de desactualización
```

## Pruebas

Nivel cliente, contra la API simulada que sirve el fixture. `simulated-api.ts`
aprende a responder escrituras: estados y cuerpos de `successResponses`, `204`
sin cuerpo, envolventes de `validationChecks` y fallos de lectura programables.

| Archivo | Verifica |
|---|---|
| `mutation-flow.test.tsx` | las tres comprobaciones de ADR-007 y el criterio de RF-01 al eliminar el proyecto seleccionado |
| `activity-form.test.tsx` | el envío contiene solo los cinco datos; los porcentajes llegan sin redondear; ningún indicador es editable |
| `project-form.test.tsx` | nombre y fecha de corte; `PUT` envía ambos campos |
| `form-feedback.test.tsx` | V9 muestra sus siete infracciones junto a su campo; `400` y `404` reciben tratamiento genérico |
| `evm-api-client.test.ts` | (+) verbos, rutas, cuerpos y `violations` de las seis escrituras |
| `activities-table.test.tsx` | (~) sin manejadores no hay acciones; con manejadores hay dos por fila y ningún control de entrada |

Los valores esperados se leen del fixture. Las tres comprobaciones de ADR-007 se
aseveran sobre la **secuencia exacta de peticiones** que registra la API
simulada, que es la única forma de demostrar que la escritura no se repite.

## Supuestos

- Eliminar pide una confirmación simple del navegador (`confirm`), no un
  segundo diálogo del producto. El PRD no especifica confirmación.
- Al crear un proyecto, el dashboard selecciona el proyecto creado. RF-01 dice
  que crear «lo actualiza» sin fijar la selección; se elige lo que hace visible
  el efecto de la operación.
- Al eliminar un proyecto que no es el seleccionado, la selección se conserva.
- Un texto numérico no representable viaja como `null` y el backend responde
  `required`. Con `type="number"` el navegador ya entrega vacío en ese caso.
- El aviso de vista desactualizada persiste hasta que un refresco tenga éxito o
  el usuario cambie de proyecto.
