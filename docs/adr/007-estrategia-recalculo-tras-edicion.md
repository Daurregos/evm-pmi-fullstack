# ADR-007 — Estrategia de recálculo tras una edición

**Estado:** Aceptada · **Fecha:** 2026-07-27

**Relacionada con:** RF-01–RF-04, RF-06, RF-07, RF-09; supuesto de recálculo del PRD §8

**Depende de:** ADR-001, ADR-002, ADR-006a y ADR-006b

## Contexto

RF-03 y el supuesto del PRD §8 exigen recalcular al confirmar una edición, no
durante la digitación; RF-06, RF-07 y RF-09 requieren actualizar tabla, resumen
y gráfica sin recargar la página. ADR-001 hace autoritativo el cálculo del
backend, ADR-002 excluye persistir sus resultados y ADR-006a/006b fija una
lectura con la foto completa. Para un usuario concurrente y decenas de
actividades, debe privilegiarse un flujo coherente y simple sobre ahorrar una
lectura.

## Decisión

Tras una mutación exitosa de actividad, el cliente solicita
`GET /projects/{projectId}` y el backend recalcula sincrónicamente desde los
datos fuente.

Crear y editar devuelven la representación de lectura de ADR-006b, que el
dashboard no consume para refrescar.

Eliminar no devuelve cuerpo.

Las mutaciones de proyecto no recalculan, porque sus campos no intervienen en
EVM y `cutoffDate` solo reetiqueta la foto según ADR-005.

Eliminar el proyecto seleccionado no solicita la foto inexistente y se rige por
RF-01.

No se calcula durante la digitación, conforme a RF-03.

## Alternativas consideradas

- **Devolver la foto completa desde cada mutación:** ahorraría una petición y
  sería razonable si la latencia dominara, pero acoplaría las respuestas de
  escritura al dashboard.
- **Recalcular y fusionar en el frontend:** daría respuesta optimista, pero
  duplicaría reglas y contradiría ADR-001.

## Consecuencias

- Tabla, resumen y gráfica se reemplazan desde una lectura
  coherente.
- La escritura y el refresco son operaciones separadas: se asumen una segunda
  petición y el recálculo completo del proyecto.
- Crear y editar conservan una representación útil para otros
  consumidores; eliminar evita representar un recurso inexistente.
- Si la escritura falla, no se refresca. Si la escritura tiene éxito pero falla
  la lectura, el cambio permanece guardado y la interfaz debe informar que la
  vista está desactualizada y permitir reintentar solo la lectura.
- Un aumento significativo de volumen, concurrencia o sensibilidad a latencia
  obligaría a reconsiderar que la mutación devolviera la foto completa.

## Verificación

Pruebas de integración comparan con `contracts/evm/evm-fixture.json` la lectura posterior a
crear, editar y eliminar actividades. Pruebas del cliente comprueban que ni la
digitación ni una mutación rechazada solicitan la foto, que una exitosa sí y que
un refresco fallido se reintenta sin repetir la escritura. Pruebas de contrato
verifican la representación al crear o editar, la ausencia de cuerpo al eliminar
y que las mutaciones de proyecto no recalculan; cambiar `cutoffDate` conserva
los indicadores y eliminar el seleccionado cumple RF-01. La revisión confirma
que el cliente no contiene fórmulas EVM ni indicadores autoritativos.
