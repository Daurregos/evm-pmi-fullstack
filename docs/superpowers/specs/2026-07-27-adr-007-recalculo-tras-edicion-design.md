# Diseño de ADR-007 — Estrategia de recálculo tras una edición

## Objetivo

Definir cuándo se recalculan los indicadores EVM y cómo obtiene el dashboard una
foto coherente después de crear, modificar o eliminar una actividad, sin invadir
las decisiones de persistencia, ubicación del cálculo ni contrato REST.

## Fuentes y límites

- `docs/PRD.md`: RF-02–RF-09, en especial RF-03 y el supuesto de recálculo del
  §8.
- ADR-001: el backend contiene la única lógica EVM autoritativa.
- ADR-002: los resultados derivados no se persisten.
- ADR-006a: `GET /projects/{projectId}` entrega proyecto, actividades y
  consolidado en una foto.
- ADR-006b: define la forma y los tipos de esa respuesta.

El ADR no redefine fórmulas, precisión, no evaluabilidad, recursos ni forma del
payload. “Edición” comprende crear, modificar y eliminar actividades porque las
tres operaciones pueden cambiar la foto analítica.

## Decisión diseñada

No se calcula durante la digitación. Una mutación confirmada valida y persiste
sincrónicamente los datos fuente. Después de una respuesta exitosa, el cliente
solicita `GET /projects/{projectId}`; esa lectura recalcula en el backend los
indicadores por actividad y el consolidado y devuelve la foto completa.

La escritura y el refresco son operaciones separadas. Una escritura fallida no
dispara la lectura. Si la escritura tiene éxito y falla el refresco, el cambio
permanece guardado; la interfaz informa que la vista no se pudo actualizar y
permite reintentar solo la lectura.

## Alternativas

1. Hacer que cada mutación devuelva la foto agregada recalculada: ahorra una
   petición, pero acopla las respuestas de escritura al dashboard y debilita el
   límite de recursos de ADR-006a.
2. Recalcular y fusionar el cambio en el frontend: ofrece respuesta optimista,
   pero duplica reglas y contradice la autoridad única de ADR-001.

## Consecuencias

El dashboard reemplaza conjuntamente tabla, resumen y datos de la gráfica desde
una única lectura. El costo asumido es una segunda petición, el recálculo
completo de decenas de actividades y una posible vista temporalmente
desactualizada si falla el refresco. Un aumento significativo de volumen,
concurrencia o sensibilidad a latencia justificaría revisar la decisión,
probablemente para devolver la foto desde la mutación.

## Verificación

Pruebas de integración crean, modifican y eliminan actividades y validan la
lectura posterior contra `evm-fixture.json`. Pruebas del cliente comprueban que
no hay cálculo ni petición durante la digitación, que una mutación exitosa
dispara la lectura agregada, que una rechazada no la dispara y que un refresco
fallido puede reintentarse sin repetir la escritura. La revisión de dependencias
confirma que el cliente no contiene fórmulas EVM ni indicadores autoritativos.
