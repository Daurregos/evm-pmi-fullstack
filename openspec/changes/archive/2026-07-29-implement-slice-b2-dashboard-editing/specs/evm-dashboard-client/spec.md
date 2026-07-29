## ADDED Requirements

### Requirement: Captura de los cinco datos de la actividad

El formulario de actividad MUST capturar exactamente los cinco datos capturados
—nombre, BAC, avance planificado, avance real y AC— y MUST NOT ofrecer control
para ninguno de los ocho indicadores derivados. Una escritura MUST contener
exactamente esas cinco propiedades. Ambos `PUT` MUST enviar todos los campos
editables, no solo los modificados.

Los porcentajes capturados MUST llegar al formulario sin redondear, con los
decimales que sirvió el backend. El cliente MUST NOT redondear, recortar ni
normalizar un valor capturado antes de enviarlo; un campo vacío MUST viajar como
`null`.

#### Scenario: El formulario envía solo los cinco datos capturados

- **WHEN** se construye una escritura de actividad desde un formulario lleno
- **THEN** sus propiedades son exactamente `name`, `bac`, `plannedProgress`,
  `actualProgress` y `ac`

#### Scenario: La edición precarga los valores servidos sin redondear

- **WHEN** el formulario abre una actividad cuyo porcentaje capturado tiene
  decimales
- **THEN** el control muestra esos decimales sin redondeo ni relleno

#### Scenario: Ningún indicador es editable

- **WHEN** se renderiza el formulario de actividad
- **THEN** no expone control para PV, EV, CV, SV, CPI, SPI, EAC ni VAC

#### Scenario: Un campo vacío viaja como ausente

- **WHEN** un campo obligatorio queda vacío y el formulario se confirma
- **THEN** la propiedad correspondiente es `null` en el cuerpo de la petición

### Requirement: El recálculo ocurre al confirmar, nunca al digitar

La digitación MUST NOT emitir ninguna petición HTTP. El cliente MUST enviar la
escritura solo cuando la edición se confirma, y MUST NOT derivar indicadores
mientras el formulario cambia.

#### Scenario: La digitación no emite peticiones

- **WHEN** cada campo del formulario recibe valores sucesivos
- **THEN** la API simulada no registra ninguna petición

#### Scenario: La confirmación emite la escritura

- **WHEN** el formulario se confirma
- **THEN** el cliente emite exactamente una escritura a la operación publicada

### Requirement: Una mutación exitosa refresca desde una sola lectura

Tras una mutación de actividad exitosa el cliente MUST leer
`GET /projects/{projectId}` una vez y MUST reemplazar tabla, consolidado y
gráfica juntos desde esa única respuesta. MUST NOT construir la vista refrescada
con el cuerpo de la respuesta de escritura. Una mutación rechazada MUST NOT
disparar ninguna lectura.

Tras una mutación de proyecto el cliente MUST releer la colección de proyectos, y
MUST leer la foto del proyecto que quede seleccionado.

#### Scenario: Mutación de actividad exitosa

- **WHEN** una creación, un reemplazo o un borrado de actividad tiene éxito
- **THEN** el cliente emite la escritura seguida de exactamente un
  `GET /projects/{projectId}`
- **AND** tabla, consolidado y gráfica provienen de esa respuesta

#### Scenario: Mutación rechazada

- **WHEN** una mutación se rechaza con `422`
- **THEN** el cliente no emite ninguna lectura y la vista mostrada no cambia

### Requirement: Un refresco fallido se reintenta sin repetir la escritura

Cuando la escritura tiene éxito y la lectura posterior falla, el cliente MUST
conservar el cambio como guardado, MUST informar que la vista está desactualizada
y MUST ofrecer un reintento que emita solo la lectura. El reintento MUST NOT
repetir la escritura.

#### Scenario: Refresco fallido y reintento

- **WHEN** la escritura tiene éxito, la primera lectura falla y se invoca el
  reintento
- **THEN** la secuencia de peticiones contiene exactamente una escritura y dos
  lecturas
- **AND** la interfaz informó que la vista estaba desactualizada antes del
  reintento

### Requirement: Las infracciones se ubican por campo y se clasifican por código

Una respuesta `422` MUST mostrar cada infracción junto al campo que nombra
`field`, y MUST mostrar varias infracciones a la vez cuando la respuesta las
acumula. Una infracción cuyo `field` no pertenece al formulario —un campo de solo
lectura, una propiedad desconocida o una `rule` futura— MUST reportarse sin
fallar, conservando `field` y mostrando su `message`.

El cliente MUST decidir solo sobre `code` y `rule`, nunca sobre el texto de
`message`. `400`, `404`, una respuesta sin la envolvente y un fallo de red MUST
compartir un tratamiento genérico.

#### Scenario: Infracciones acumuladas

- **WHEN** la respuesta es el caso compuesto de validación del fixture
- **THEN** cada infracción se muestra junto a su campo, y las ajenas al
  formulario se muestran como infracciones generales

#### Scenario: Fallos genéricos

- **WHEN** la respuesta es `400` o `404` con `violations` vacío
- **THEN** el formulario informa un fallo genérico y no marca ningún campo

### Requirement: Eliminar el proyecto seleccionado deja sin selección

Eliminar el proyecto seleccionado MUST NOT solicitar su foto. El dashboard MUST
quedar sin proyecto seleccionado y sin análisis, aunque existan otros proyectos,
y MUST refrescar la colección.

#### Scenario: Se elimina el proyecto seleccionado

- **WHEN** el proyecto seleccionado se elimina con éxito
- **THEN** el cliente lee solo la colección de proyectos
- **AND** el dashboard no muestra selección ni análisis

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
