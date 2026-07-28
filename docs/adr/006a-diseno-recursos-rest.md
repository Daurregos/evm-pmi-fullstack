# ADR-006a — Diseño de recursos REST

**Estado:** Aceptada · **Fecha:** 2026-07-27

**Relacionada con:** RF-01, RF-02, RF-06, RF-07, RF-09; alcance del PRD §2, modelo del §5 y supuesto de selección del §8

**Depende de:** ADR-005 y ADR-008

## Contexto

El PRD §§2, 5 y 8 establece varios proyectos, uno analizado a la vez y actividades sin existencia fuera de su proyecto. RF-06, RF-07 y RF-09 exigen tabla, consolidado y gráfica. ADR-005 limita cada proyecto a una foto vigente. ADR-008 fija la composición y el borrado en cascada. La API debe reflejar estos límites sin coordinación innecesaria para decenas de actividades.

## Decisión

Proyecto es raíz en `/projects` y `/projects/{projectId}`. Actividad se anida en `/projects/{projectId}/activities` y `/projects/{projectId}/activities/{activityId}`. RF-01 y RF-02 operan sobre esas colecciones y miembros.

Las ediciones usan `PUT /projects/{projectId}` y `PUT /projects/{projectId}/activities/{activityId}`. Cada `PUT` reemplaza todos los campos editables, no la representación de lectura. Un campo editable ausente no conserva el valor anterior ni toma un valor predeterminado: incumple `required` y produce `422` según ADR-009. Un campo de solo lectura presente conserva `422 read_only`.

Los indicadores integran las representaciones calculadas de proyecto y actividad. No tienen recursos ni rutas propias.

`GET /projects/{projectId}` entrega foto, actividades y consolidado. Esa respuesta abastece tabla, consolidado y gráfica.

El cliente selecciona mediante `projectId` en la ruta. La selección no se persiste. `GET /projects` abastece exclusivamente el selector y devuelve un arreglo JSON desnudo cuyos elementos contienen `id` y `name`.

Eliminar un proyecto o actividad inexistente devuelve `404 Not Found`.

Por delegación explícita, ADR-006b define nombres de campo, agrupación interna, tipos y formatos.

## Alternativas consideradas

- **Actividades planas con referencia al proyecto:** facilitarían consultas entre proyectos, pero debilitarían la composición de ADR-008 y ampliarían el alcance hacia el análisis de portafolio.
- **Lecturas separadas para actividades, consolidado y gráfica:** permitirían evolucionar cada respuesta por separado, pero exigirían varias llamadas y coordinación para una sola foto.
- **Recurso específico de dashboard:** entregaría la pantalla en una llamada, pero duplicaría la representación del proyecto y acoplaría el contrato a una interfaz.
- **Éxito idempotente sin contenido si ya no existe:** simplificaría el borrado repetido, pero ocultaría referencias obsoletas del cliente que `404` revela.
- **`PATCH` parcial:** reduciría el cuerpo de una edición, pero exigiría decidir un formato de parche y semántica por campo para un formulario que ya conoce el estado editable completo.

## Consecuencias

- La propiedad de cada actividad queda explícita en su URI.
- Una lectura produce una foto coherente sin coordinar respuestas parciales.
- El dashboard necesita una llamada después de conocer el proyecto seleccionado.
- La representación mezcla datos capturados y resultados calculados, aunque ADR-002 impide persistir estos últimos.
- Cada lectura transfiere todas las actividades y limita la evolución independiente de los bloques. Un volumen mayor o consumidores parciales exigirían revisar la lectura agregada.
- Un consumidor debe tratar `404` como referencia inexistente también después de un borrado repetido.
- Una edición pequeña reenvía todos los campos editables; evita ambigüedad sobre ausencias a costa de un cuerpo mayor.
- El arreglo del selector es mínimo, pero añadir metadatos de paginación exigiría cambiar su forma.

## Verificación

Pruebas de contrato verifican por sí mismas las rutas anidadas, los dos `PUT` de reemplazo, `422 required` ante cualquier ausencia, ausencia de rutas planas o de indicadores, selección por ruta, el arreglo `{id, name}` y una lectura para tabla, consolidado y gráfica.

`contracts/evm/evm-fixture.json` verifica exclusivamente los valores del payload agregado. Pruebas de integración eliminan recursos existentes e inexistentes y comprueban la cascada de ADR-008 y `404 Not Found`, respectivamente.
