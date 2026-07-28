# Estrategia de pruebas

Este documento define **qué se prueba, en qué nivel y contra qué oráculo**. Se escribió antes de la implementación porque gobierna el ciclo TDD: cada requisito entra por el nivel que le corresponde, y un comportamiento solo se repite cuando otro nivel aporta evidencia distinta sobre su propia frontera.

Las secciones `Verificación` de los ADR aceptados son la base. Este documento las organiza y define la estrategia de pruebas sin introducir decisiones de producto ni arquitectura.

## Principio rector

**`contracts/evm/evm-fixture.json` es el oráculo del proyecto.** Contiene los valores esperados de las ocho actividades, del consolidado, de los casos de banda, de los trece casos de validación y de las tres envolventes de error, todos calculados con aritmética decimal exacta y verificados de forma independiente.

De ahí salen dos reglas que no se negocian dentro de un ciclo rojo-verde:

**1. La prueba carga el fixture; nunca lo recalcula.** Si un test computa los valores esperados con la misma lógica que está probando, el oráculo desaparece y la prueba solo verifica que el código coincide consigo mismo. Los valores se leen del JSON y se comparan.

**2. El fixture no se modifica para que un test pase.** Ante una discrepancia, el defecto está en el código salvo que la fuente superior aplicable apruebe un cambio. Modificar el fixture exige un cambio contractual dedicado y la auditoría de sus dependientes; nunca es una corrección dentro de un ciclo rojo-verde.

## Los cinco niveles

| Nivel | Qué verifica | Dependencias | Oráculo |
|---|---|---|---|
| Dominio | Fórmulas EVM, estados, consolidación, interpretación, redondeo | Ninguna | Fixture |
| Integración | Persistencia, casos de uso, transaccionalidad | Base de datos | Fixture |
| Contrato | Superficie HTTP: rutas, esquemas, códigos, errores | Aplicación completa | Fixture + `contracts/evm/openapi.yaml` |
| Cliente | Comportamiento del dashboard | API simulada | Fixture |
| Revisión estructural | Afirmaciones que ninguna prueba de ejecución puede demostrar | Código fuente | Los ADR |

### Dominio

Es el nivel de mayor densidad y el primero que se escribe. **Corre sin base de datos, sin framework y sin HTTP**: si necesita levantar algo, la lógica no quedó aislada y eso ya es un hallazgo sobre ADR-001, no un problema de configuración de la prueba.

Cubre:

- Los ocho indicadores de cada una de las ocho actividades del fixture y del consolidado.
- La regla de consolidación de RF-04: sumar magnitudes antes de calcular ratios. Se verifica con **aserciones negativas** contra `negativeChecks`: el CPI consolidado **no** es 0,73 —el promedio de índices—, el EAC **no** es 52.710,00 —la suma de EAC—, y no se obtiene 71.578,95 al calcular desde el valor ya redondeado.
- Los cinco casos de la taxonomía del PRD §7.3 y las cuatro combinaciones de evaluabilidad de CPI y SPI.
- La distinción entre cero definido y no evaluable: `cpi.value = 0` con `status: "unfavorable"` frente a `value: null` con `status: "not_evaluable"`.
- El proyecto vacío.
- Redondeo y clasificación (ADR-003): cocientes no terminantes sin cuantización intermedia, empates resueltos alejándose de cero, y los siete casos de banda, incluidos los pares de contraste donde el marcador es lo único que distingue dos valores que redondean igual.

Es el único nivel donde la cobertura debe ser exhaustiva.

### Integración

Verifica lo que el dominio no puede: que los datos sobrevivan al almacenamiento y que las operaciones sean atómicas.

- **ADR-002:** modificar BAC, avance planificado, avance real o AC produce los cambios derivados correspondientes; editar el nombre conserva los indicadores; ninguna operación escribe resultados calculados.
- **ADR-005:** cada proyecto expone una sola fecha de corte vigente; editar reemplaza el estado anterior; no existe operación para consultar versiones históricas.
- **ADR-008:** eliminar un proyecto retira sus actividades sin dejar huérfanos; **una falla provocada a mitad del borrado revierte la operación completa**; eliminar una actividad conserva a sus hermanas.
- **ADR-007:** tras crear, editar o eliminar una actividad, la lectura posterior coincide con el resultado esperado del caso correspondiente del fixture; cambiar `cutoffDate` no altera ningún indicador.

La prueba de reversión ante falla parcial es la que más suele omitirse y la que más señal da.

### Contrato

Verifica la superficie HTTP contra `contracts/evm/openapi.yaml` y el fixture.

- **Payload de lectura:** eliminar recursivamente las claves con prefijo `$` de `readResponse` produce el cuerpo exacto de `GET /projects/{projectId}`.
- **Rutas y verbos:** rutas anidadas, los dos `PUT` de reemplazo, el arreglo desnudo `{id, name}` de `GET /projects` incluido el caso vacío, ausencia de rutas planas y de rutas propias para indicadores, `404` al eliminar o reemplazar un recurso inexistente.
- **Códigos y cuerpos de éxito** según `successResponses`.
- **Errores (ADR-009):** los trece casos de `validationChecks` devuelven `422` con `code`, `field` y `rule`; el caso compuesto V9 acumula siete infracciones sobre seis reglas y demuestra que la validación no se detiene en la primera; `{"bac": "diez"}` devuelve `400` con `violations` vacío; ningún cuerpo incluye trazas ni detalles del framework.
- **Estado intacto:** se siembra `readResponse`, se envía una petición rechazada, se relee y se confirma que la respuesta sigue siendo idéntica.

**Sobre el alcance de `validationChecks`:** el bloque captura comportamientos distintos, no la combinatoria completa. La ausencia y el `null` de cada campo obligatorio se cubren con una **prueba parametrizada que recorre `writeSchemas`**, no enumerando catorce casos en el fixture. Su `$scopeNote` lo documenta.

### Cliente

Verifica el comportamiento del dashboard contra una API simulada que devuelve el fixture.

- La digitación no envía mutaciones; una mutación rechazada no dispara el `GET /projects/{projectId}` de refresco y una exitosa sí lo dispara (ADR-007, RF-03).
- Un refresco fallido se reintenta **sin repetir la escritura**.
- La tabla muestra los cinco datos capturados y los ocho indicadores; el resumen muestra el consolidado; la gráfica presenta PV, EV y AC por actividad.
- Los cuatro valores de `status` se representan visualmente, con `neutral` y `not_evaluable` en la misma apariencia (RF-08). La semilla del fixture contiene los cuatro.

### Revisión estructural

Varias afirmaciones de los ADR no son observables en ejecución y aun así son verificables. Se automatizan donde se pueda —inspección de dependencias, del esquema de la base de datos, del árbol de imports— y en su defecto entran como paso de revisión antes de fusionar.

- **ADR-001:** controladores, persistencia e interfaz no contienen fórmulas ni clasificación EVM duplicadas.
- **ADR-002:** el modelo de persistencia no contiene PV, EV, CV, SV, CPI, SPI, EAC, VAC, interpretaciones, consolidados ni el estado derivado del §7.3.
- **ADR-005:** las actividades no tienen fecha de corte propia ni estructuras de historial.
- **ADR-007:** el cliente no contiene fórmulas EVM ni conserva indicadores como estado autoritativo.
- **ADR-008:** la integridad referencial no depende de llamadas manuales del consumidor.

## Qué no se asevera

Fijar estas cosas produce pruebas frágiles que se rompen al reescribir una frase:

- **El texto de `message`.** Se asevera su presencia —ADR-009 lo declara obligatorio— y nunca su redacción. Los consumidores automatizan sobre `code` y `rule`.
- **El orden de `violations`.**
- **Los colores concretos** del estado visual. Se asevera la correspondencia entre `status` y tratamiento visual, no el valor hexadecimal.
- **La representación de los montos.** El contrato los transporta sin redondear; el redondeo es del frontend y se prueba en el nivel de cliente.

## Orden de construcción

Sigue las dependencias, no las capas:

1. **Dominio.** El fixture es su oráculo completo desde el primer commit. Fija los números antes de que exista infraestructura donde esconderlos.
2. **Contrato de errores y validación.** Es transversal y condiciona el diseño de los casos de uso.
3. **Persistencia y casos de uso.**
4. **Superficie HTTP.**
5. **Cliente**, con el fixture como semilla.

## Cobertura

La cobertura de línea es un indicador, no un objetivo. El criterio real es **que cada afirmación de las secciones `Verificación` de los ADR aplicables tenga una prueba que la respalde**, y esa correspondencia se revisa antes de dar por terminado cada nivel.

En el módulo de dominio la cobertura debe ser efectivamente total, porque el fixture ya enumera sus casos. Fuera de él, perseguir un porcentaje produce pruebas que ejercitan código sin verificar comportamiento.
