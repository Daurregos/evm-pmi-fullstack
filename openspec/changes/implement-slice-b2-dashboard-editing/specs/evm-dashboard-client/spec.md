## ADDED Requirements

### Requirement: Capture of the five activity data points

The activity form MUST capture exactly the five data points —name, BAC, planned
progress, actual progress and AC— and MUST NOT offer a control for any of the
eight derived indicators. A write MUST contain exactly those five properties.
Both `PUT` operations MUST send every editable field, not only the modified ones.

Captured percentages MUST reach the form unrounded, with the decimals the
backend served. The client MUST NOT round, trim or normalize a captured value
before sending it; an empty box MUST travel as `null`.

#### Scenario: The form sends only the five captured data points

- **WHEN** an activity write is built from a filled form
- **THEN** its properties are exactly `name`, `bac`, `plannedProgress`,
  `actualProgress` and `ac`

#### Scenario: Editing preloads the served values unrounded

- **WHEN** the form opens on an activity whose captured percentage has decimals
- **THEN** the control shows those decimals without rounding or padding

#### Scenario: No indicator is editable

- **WHEN** the activity form is rendered
- **THEN** it exposes no control for PV, EV, CV, SV, CPI, SPI, EAC or VAC

#### Scenario: An empty box travels as absent

- **WHEN** a required box is left empty and the form is submitted
- **THEN** the corresponding property is `null` in the request body

### Requirement: Recalculation happens on confirmation, never while typing

Typing MUST NOT issue any HTTP request. The client MUST send the write only when
the edition is confirmed, and MUST NOT derive indicators while the form changes.

#### Scenario: Typing issues no request

- **WHEN** every field of the form receives successive values
- **THEN** the simulated API records no request

#### Scenario: Confirmation issues the write

- **WHEN** the form is submitted
- **THEN** the client issues exactly one write to the published operation

### Requirement: A successful mutation refreshes from one read

After a successful activity mutation the client MUST read
`GET /projects/{projectId}` once and MUST replace table, summary and chart
together from that single response. It MUST NOT build the refreshed view from
the mutation response body. A rejected mutation MUST NOT trigger any read.

After a project mutation the client MUST re-read the project collection, and MUST
read the aggregate of the project that remains selected.

#### Scenario: Successful activity mutation

- **WHEN** a create, replace or delete activity operation succeeds
- **THEN** the client issues the write followed by exactly one
  `GET /projects/{projectId}`
- **AND** table, summary and chart come from that response

#### Scenario: Rejected mutation

- **WHEN** a mutation is rejected with `422`
- **THEN** the client issues no read and the displayed view is unchanged

### Requirement: A failed refresh is retried without repeating the write

When the write succeeds and the following read fails, the client MUST keep the
change as saved, MUST inform that the view is out of date and MUST offer a retry
that issues only the read. The retry MUST NOT repeat the write.

#### Scenario: Failed refresh and retry

- **WHEN** the write succeeds, the first read fails and the retry is invoked
- **THEN** the request sequence contains exactly one write and two reads
- **AND** the interface reported the view as out of date before the retry

### Requirement: Violations are placed by field and classified by code

A `422` response MUST render each violation next to the field named by `field`,
and MUST render several violations at the same time when the response
accumulates them. A violation whose `field` does not belong to the form —a
read-only field, an unknown property or a future `rule`— MUST be reported
without failing, keeping `field` and showing its `message`.

The client MUST decide only on `code` and `rule`, never on the text of
`message`. `400`, `404`, a response without the envelope and a network failure
MUST share a generic treatment.

#### Scenario: Accumulated violations

- **WHEN** the response is the composite validation case of the fixture
- **THEN** every violation is shown next to its field, and those outside the
  form are shown as general violations

#### Scenario: Generic failures

- **WHEN** the response is `400` or `404` with an empty `violations`
- **THEN** the form reports a generic failure and marks no field

### Requirement: Deleting the selected project leaves no selection

Deleting the selected project MUST NOT request its aggregate. The dashboard MUST
be left with no selected project and no analysis, even when other projects
exist, and MUST refresh the collection.

#### Scenario: The selected project is deleted

- **WHEN** the selected project is deleted successfully
- **THEN** the client reads only the project collection
- **AND** the dashboard shows no selection and no analysis

## MODIFIED Requirements

### Requirement: Tabla de actividades con datos capturados e indicadores

Cada fila MUST mostrar los cinco datos capturados —nombre, BAC, avance
planificado, avance real y AC— y los ocho indicadores derivados —PV, EV, CV, SV,
CPI, SPI, EAC y VAC—. La tabla MUST ofrecer editar y eliminar por fila cuando el
consumidor entrega los manejadores, y MUST NOT contener ningún control de
captura: la captura vive en el formulario.

#### Scenario: Las ocho actividades de referencia

- **WHEN** se renderiza la tabla con `readResponse.activities`
- **THEN** cada fila muestra sus cinco datos capturados y sus ocho indicadores
- **AND** un indicador con valor `null` se muestra como ausente, no como cero

#### Scenario: Acciones por fila

- **WHEN** la tabla recibe los manejadores de edición y borrado
- **THEN** cada fila ofrece editar y eliminar esa actividad
- **AND** la tabla no contiene ningún control de entrada

#### Scenario: Tabla sin manejadores

- **WHEN** la tabla se renderiza sin manejadores
- **THEN** no ofrece ninguna acción
