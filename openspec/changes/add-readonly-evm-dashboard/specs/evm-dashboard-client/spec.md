## ADDED Requirements

### Requirement: Una sola lectura abastece el dashboard

El dashboard MUST obtener el proyecto seleccionado con un único
`GET /projects/{projectId}` resuelto sobre la base de
`NEXT_PUBLIC_EVM_API_BASE_URL`, y MUST alimentar tabla, consolidado, estado
visual y gráfica con esa respuesta. El selector MUST alimentarse de
`GET /projects`.

#### Scenario: Lectura del proyecto de referencia

- **WHEN** la API simulada sirve `readResponse`
- **THEN** el cliente pide `/mock-api/projects/1` con la base predeterminada
- **AND** obtiene proyecto, actividades y consolidado de esa única respuesta

#### Scenario: Colección para el selector

- **WHEN** la API simulada sirve `collectionResponse`
- **THEN** el selector ofrece un elemento por proyecto con su `id` y su `name`

#### Scenario: Respuesta de error

- **WHEN** la API responde con una envolvente de error de `errorEnvelopes`
- **THEN** el cliente informa el fallo sin mostrar datos parciales

### Requirement: Tabla de actividades con datos capturados e indicadores

Cada fila MUST mostrar los cinco datos capturados —nombre, BAC, avance
planificado, avance real y AC— y los ocho indicadores derivados —PV, EV, CV, SV,
CPI, SPI, EAC y VAC—. La tabla MUST NOT ofrecer edición en esta rebanada.

#### Scenario: Las ocho actividades de referencia

- **WHEN** se renderiza la tabla con `readResponse.activities`
- **THEN** cada fila muestra sus cinco datos capturados y sus ocho indicadores
- **AND** un indicador con valor `null` se muestra como ausente, no como cero

### Requirement: Consolidado del proyecto

El consolidado MUST mostrar BAC, PV, EV, AC, CV, SV, CPI, SPI, EAC, VAC, el
avance del proyecto y el conteo de actividades con EV positivo y AC cero.

#### Scenario: Consolidado de referencia

- **WHEN** se renderiza el consolidado con `readResponse.summary`
- **THEN** muestra los diez montos e índices, el avance y
  `activitiesWithEvAndZeroAc`

### Requirement: Estado visual de CPI y SPI

El estado visual MUST derivarse de `status` y MUST distinguir `unfavorable`,
`favorable` y el par `neutral` y `not_evaluable`. `neutral` y `not_evaluable`
MUST compartir apariencia y MUST conservarse como estados distintos en el
código y en el marcado. El estado MUST NOT depender solo del color: MUST
acompañarse de glifo y del `label` recibido.

#### Scenario: Los cuatro estados

- **WHEN** se renderizan índices con cada uno de los cuatro `status`
- **THEN** cada uno recibe un tratamiento visual y expone su `status` en el
  marcado
- **AND** `neutral` y `not_evaluable` comparten tono sin colapsarse en un mismo
  valor

#### Scenario: El estado no se deriva de CV ni de SV

- **WHEN** una actividad tiene `cv` positivo y `cpi.status` `not_evaluable`
- **THEN** el estado de costo mostrado no es favorable

### Requirement: Los índices se presentan con su campo display

El cliente MUST mostrar `cpi.display` y `spi.display` sin reformatearlos,
incluidos los marcadores `<0,99` y `>1,01`. MUST usar `value` solo para
graficar y ordenar. Un índice no evaluable MUST mostrarse como ausente.

#### Scenario: Marcadores de banda

- **WHEN** un índice llega con `display` `<0,99` o `>1,01`
- **THEN** la vista muestra esa cadena literal

#### Scenario: Índice no evaluable

- **WHEN** `value` y `display` son `null` y `status` es `not_evaluable`
- **THEN** la vista muestra la ausencia del valor y el `label` recibido

### Requirement: El cliente formatea montos y avance

Los montos MUST presentarse con dos decimales, coma decimal, punto de millar y
`−` para el negativo. El avance MUST presentarse como porcentaje entero. Los
empates exactos MUST resolverse alejándose de cero. El cliente MUST NOT
redondear los valores que envía ni derivar indicadores.

#### Scenario: Montos del consolidado

- **WHEN** un monto llega sin redondear
- **THEN** se presenta con dos decimales y separadores en español

#### Scenario: Avance del proyecto

- **WHEN** `progress` llega sin redondear
- **THEN** se presenta como porcentaje entero

### Requirement: Gráfica de PV, EV y AC por actividad

La gráfica MUST presentar tres valores por actividad e MUST identificar las
series PV, EV y AC.

#### Scenario: Gráfica del proyecto de referencia

- **WHEN** se renderiza la gráfica con `readResponse.activities`
- **THEN** identifica las tres series
- **AND** presenta un valor por serie y por actividad

### Requirement: Proyecto sin actividades

La vista MUST tolerar un proyecto sin actividades: MUST informar la ausencia,
MUST mostrar el consolidado en ceros con sus indicadores no evaluables y MUST
NOT fallar.

#### Scenario: Proyecto vacío del fixture

- **WHEN** se renderiza `emptyProject`
- **THEN** la vista informa que no hay actividades
- **AND** muestra magnitudes en cero, índices no evaluables y avance ausente

### Requirement: El cliente no calcula ni conserva indicadores autoritativos

Ningún módulo de `src/ui/**` MUST importar `src/domain/**`,
`src/application/**` ni `src/infrastructure/**`. Ningún módulo de `src/ui/**` ni
de `src/app/**`, excluido `src/app/mock-api/**`, que mencione vocabulario EVM
MUST contener una expresión aritmética. Los indicadores mostrados MUST provenir
de la última respuesta del backend.

#### Scenario: Revisión estructural

- **WHEN** se inspecciona el árbol de fuentes del cliente
- **THEN** no hay importaciones a las capas de servidor
- **AND** ningún módulo con vocabulario EVM contiene aritmética

#### Scenario: Carga centinela

- **WHEN** la API simulada sirve indicadores alterados para los mismos datos
  capturados
- **THEN** la vista muestra los indicadores servidos y no otros
