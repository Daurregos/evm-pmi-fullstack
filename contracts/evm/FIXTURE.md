# Fixture canónico EVM

Caso de referencia calculado a mano. Es la **fuente de verdad numérica y de forma** del proyecto: cualquier discrepancia entre el código y este documento es un defecto del código, no del fixture.

Datos en `evm-fixture.json` (v4.0.0). Todos los valores fueron verificados con aritmética decimal exacta.

## Convención de metadatos

Toda clave con prefijo `$` es metadato del fixture, no parte del contrato. Eliminando recursivamente las claves con `$` de `readResponse` se obtiene el **payload literal** de `GET /projects/{projectId}` según ADR-006b.

`neutralBandChecks`, `validationChecks` y `errorEnvelopes` no son ejemplos del payload de éxito: son aserciones focalizadas. Dentro de ellas, las claves con `$` siguen siendo metadato y las demás describen la petición y la respuesta esperadas.

## Diseño

Ocho actividades. Cubren los cinco casos de la taxonomía del PRD §7.3, las cuatro combinaciones posibles de evaluabilidad de CPI y SPI, y los cuatro valores de `status`.

| Combinación de evaluabilidad | Actividades |
|---|---|
| CPI y SPI evaluables | a1, a2, a3, a8 |
| Ninguno evaluable | a5 |
| Solo SPI evaluable | a4, a6 |
| Solo CPI evaluable | a7 |

En a3 ambos índices son evaluables y valen **cero definido**, que no es lo mismo que no evaluable.

### Entradas

| ID | Caso del PRD §7.3 | BAC | Plan % | Real % | AC |
|---|---|---:|---:|---:|---:|
| a1 | Avance con costo, favorable | 10.000,00 | 40 | 50 | 4.000,00 |
| a2 | Avance con costo, desfavorable | 20.000,00 | 60 | 40 | 10.500,00 |
| a3 | Costo sin avance | 5.000,00 | 20 | 0 | 1.500,00 |
| a4 | Avance con AC cero | 8.000,00 | 25 | 30 | 0,00 |
| a5 | Sin iniciar | 3.000,00 | 0 | 0 | 0,00 |
| a6 | Sin avance con plan vigente | 6.000,00 | 50 | 0 | 0,00 |
| a7 | Avance con costo, sin plan a la fecha | 4.000,00 | 0 | 25 | 1.600,00 |
| a8 | Avance con costo, conforme al plan | 12.000,00 | 50 | 50 | 6.030,00 |

### Resultados esperados por actividad

| ID | PV | EV | CV | SV | CPI | SPI | EAC | VAC |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| a1 | 4.000,00 | 5.000,00 | 1.000,00 | 1.000,00 | 1,25 | 1,25 | 8.000,00 | 2.000,00 |
| a2 | 12.000,00 | 8.000,00 | −2.500,00 | −4.000,00 | 0,76 | 0,67 | 26.250,00 | −6.250,00 |
| a3 | 1.000,00 | 0,00 | −1.500,00 | −1.000,00 | **0,00** | 0,00 | n/e | n/e |
| a4 | 2.000,00 | 2.400,00 | **2.400,00** | 400,00 | **n/e** | 1,20 | n/e | n/e |
| a5 | 0,00 | 0,00 | 0,00 | 0,00 | n/e | n/e | n/e | n/e |
| a6 | 3.000,00 | 0,00 | 0,00 | −3.000,00 | n/e | 0,00 | n/e | n/e |
| a7 | 0,00 | 1.000,00 | −600,00 | **1.000,00** | **0,63** | **n/e** | 6.400,00 | −2.400,00 |
| a8 | 6.000,00 | 6.000,00 | **−30,00** | 0,00 | **1,00** | **1,00** | 12.060,00 | −60,00 |

`n/e` = no evaluable. En CPI y SPI eso significa `value` y `display` en `null` con `status: "not_evaluable"`; EAC y VAC son escalares y su forma no evaluable es simplemente `null`. Nunca `0`, `Infinity` ni `NaN`.

### Resultado consolidado

| BAC | PV | EV | AC | CV | SV | CPI | SPI | EAC | VAC | Avance |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 68.000,00 | 28.000,00 | 22.400,00 | 23.630,00 | −1.230,00 | −5.600,00 | 0,95 | 0,80 | 71.733,93 | −3.733,93 | 33 % |

Interpretación: **sobre presupuesto** y **atrasado**. `activitiesWithEvAndZeroAc`: **1**.

## Forma de CPI y SPI

Por ADR-006b, `cpi` y `spi` son objetos con cuatro campos, idénticos en actividad y consolidado:

| Campo | Contenido |
|---|---|
| `value` | El número sin redondear, o `null` si no es evaluable. |
| `display` | La representación resuelta por el backend, con marcador si aplica, o `null`. |
| `status` | `favorable`, `neutral`, `unfavorable` o `not_evaluable`. |
| `label` | La interpretación del PRD, en español. |

**Los objetos nunca son `null` ellos mismos**: siempre están presentes. Lo que puede ser `null` es `value` y `display`.

El marcador (`<0,99` o `>1,01`) aparece solo cuando el redondeo a dos decimales proyecta el valor sobre un límite de la banda ocultando que está fuera. Ninguna actividad de este fixture ni el consolidado caen en esa ventana; los casos con marcador viven en `neutralBandChecks`. Los montos nunca llevan marcador.

## Precisión en el cable

Los montos, `progress`, `cpi.value` y `spi.value` cruzan el API **sin redondear**; el frontend les aplica el redondeo de presentación de ADR-003 al mostrarlos.

Lo único ya presentado que cruza son `cpi.display` y `spi.display`. La asimetría es deliberada: la regla del marcador es lógica de negocio y la resuelve el backend; redondear a dos decimales es formato, y ahí el frontend basta.

**Ocho valores de `readResponse`** llevan más de dos decimales:

| Ruta | En el cable | Mostrado |
|---|---:|---:|
| `a2.cpi.value` | 0.7619047619047619 | `0,76` en `display` |
| `a2.spi.value` | 0.6666666666666666 | `0,67` en `display` |
| `a7.cpi.value` | 0.625 | `0,63` en `display` |
| `a8.cpi.value` | 0.9950248756218906 | `1,00` en `display` |
| `summary.cpi.value` | 0.9479475243334744 | `0,95` en `display` |
| `summary.eac` | 71733.92857142857 | 71.733,93 |
| `summary.vac` | −3733.9285714285716 | −3.733,93 |
| `summary.progress` | 32.94117647058823 | 33 |

Fuera del payload hay cuatro más, en los casos de banda B1, B5, B6 y B7 (0,989 y 1,011).

El resto de los valores cae exacto en dos decimales, pero eso es una propiedad de estos datos concretos, no una regla del contrato: ADR-006b transporta todos los valores cuantitativos sin redondear, así que otros datos de entrada pueden producir más decimales en cualquier campo.

## Las siete trampas

Cada una corresponde a un error real y frecuente. Las tres primeras tienen su valor incorrecto en `negativeChecks`, para poder afirmar explícitamente que **no** se produce; las cuatro últimas se comprueban directamente sobre el valor esperado de la actividad implicada.

**1. Promediar índices.** El promedio de los cinco CPI definidos es **0,73**, frente al **0,95** correcto. Verifica RF-04.

**2. Sumar los EAC de las actividades.** La suma de los EAC definidos es **52.710,00**, frente al **71.733,93** correcto. El EAC consolidado es `bac_total / cpi_total`, no una suma. Además, sumar excluye en silencio las actividades cuyo EAC no es evaluable, y con ellas su presupuesto entero.

**3. Redondear valores intermedios.** El `cpi.value` de a2 es 0,761904…; su EAC correcto es 26.250,00. Calcularlo desde `cpi.display` (0,76) da 26.315,79. En el consolidado, el mismo error da 71.578,95 en lugar de 71.733,93. **El redondeo pertenece exclusivamente a la presentación** (§7.4).

**4. Confundir CV con estado de costo.** Dos actividades lo prueban desde lados opuestos: a4 tiene `cv = +2.400`, que parece excelente, pero su CPI no es evaluable; a8 tiene `cv = −30`, que parece malo, y su CPI es `neutral`. La interpretación se deriva de CPI y SPI; CV y SV son montos informativos (§7.2).

**5. Tratar `cpi.value = 0` como no evaluable.** a3 consumió 1.500 sin producir nada. Su CPI es **cero definido**, con `status: "unfavorable"`. Si se clasifica como `not_evaluable`, la actividad más enferma del proyecto se presenta con la apariencia neutral que RF-08 reserva a lo no evaluable y pasa desapercibida.

**6. Redondear mal los empates.** El `cpi.value` de a7 es exactamente 0,625 y se presenta como **0,63**, no 0,62: los empates se resuelven alejándose de cero (§7.4). Es el único empate exacto del fixture, y muchas implementaciones redondean por defecto al par más cercano.

**7. Aplicar la banda solo al valor unitario.** El `cpi.value` de a8 es 0,995024…, que no es 1 pero sí está dentro de la banda inclusiva. Si la clasificación exige la igualdad exacta en lugar del rango, a8 pasa a `unfavorable` y el estado `neutral` desaparece del proyecto.

## Tres propiedades que conviene entender

**La no propagación.** a4, a5 y a6 tienen CPI no evaluable, pero el proyecto tiene CPI = 0,95. Es correcto: la consolidación suma magnitudes antes de dividir, y el AC de las demás rescata el denominador. Una fila puede decir «n/e» mientras el resumen muestra un número; sin esta explicación parece un defecto.

**CPI y SPI son evaluables de forma independiente.** a4 tiene SPI evaluable y CPI no; a7 tiene la combinación inversa, porque `PV = 0`. Ninguna condición implica la otra, y a7 existe para impedir que una implementación las trate como un solo interruptor.

En a7, además, `SV = +1.000` con `PV = 0` es el caso del que **puede** derivarse «avance anticipado» (§7.3 y RF-08). Es información opcional, se basa en SV positivo y **no** se expresa clasificando SPI como favorable: `spi.status` permanece `not_evaluable`. El contrato no lleva campo propio para ella.

**El sesgo optimista.** a4 aporta 2.400 al numerador del CPI consolidado y 0 al denominador. Sin ella, el CPI del proyecto sería **0,85** en lugar de **0,95**. El tratamiento EVM es el correcto, pero significa que mientras la imputación contable va rezagada el proyecto se ve mejor de lo que está. Por eso el consolidado publica `activitiesWithEvAndZeroAc` (§7.3).

## Bloques adicionales

- **`emptyProject`** — proyecto sin actividades: magnitudes en cero, índices en `not_evaluable`, `progress` en `null`.
- **`neutralBandChecks`** — siete casos en **pares de contraste**: B1 y B2 redondean ambos a 0,99 y tienen `status` opuesto; B4 y B5 hacen lo mismo en 1,01. Dentro de cada par, lo único que los distingue en `display` es el marcador —`<0,99` frente a `0,99`, `1,01` frente a `>1,01`—; B6 y B7 repiten el ejercicio sobre `spi`, con etiquetas de cronograma. Si una implementación clasifica sobre el valor redondeado, cada par colapsa en un solo estado y fallan los cuatro casos a la vez.
- **`writeSchema`** — los cinco campos admitidos en una escritura de actividad.
- **`validationChecks`** — nueve casos alineados con ADR-009. Cada uno lleva la petición completa, el estado esperado (`422`) y el cuerpo de error con su `rule` enumerada. V1 a V8 aíslan una regla cada uno; **V9 es el caso compuesto**: infringe las cinco reglas en una sola petición y verifica que la validación **acumula** en lugar de detenerse en la primera. Los cuerpos esperados están completos, con el `message` que ADR-009 declara obligatorio. Las pruebas aseveran `code`, `field`, `rule` y la **presencia** de `message`, nunca su redacción exacta. El orden de `violations` tampoco se asevera.
- **`errorEnvelopes`** — las tres formas de error de ADR-009: `400 malformed_request`, `404 not_found` y `422 validation_failed`. Comparten envolvente, así que el consumidor necesita un único manejador. El `400` cubre dos casos que ADR-009 agrupa deliberadamente: JSON malformado y JSON bien formado con un tipo incompatible, como `bac: "diez"`. Ambos fallan al interpretar el esquema de entrada, antes de que corran las reglas de negocio, y por eso ninguno genera infracciones por campo.

**Cómo se verifica el «estado intacto».** El PRD §7.5 y ADR-009 exigen que una petición rechazada no altere nada. Se comprueba sembrando `readResponse`, enviando la petición del caso, releyendo y confirmando que la respuesta sigue siendo idéntica a `readResponse`. El fixture aporta el estado antes y después; la comparación la hace la prueba.

## Cómo usarlo

**Antes de escribir código.** Recalcula dos o tres filas a mano hasta que las fórmulas te resulten obvias. Un oráculo que no comprendes solo te dice que algo falló, no qué.

**Como test de aceptación del dominio.** Un test parametrizado que recorre las ocho actividades y compara los ocho indicadores. Es el test que ADR-001 declara en su sección de Verificación. Debe correr sin base de datos ni framework: si necesita levantar algo, la lógica no quedó aislada, y eso ya es un hallazgo.

**Como test de consolidación.** Un segundo test sobre `summary` y, crucialmente, aserciones negativas contra `negativeChecks`. Afirmar que el CPI **no** es 0,73 documenta la trampa dentro del código.

**Como test de contrato.** Elimina las claves con `$` de `readResponse` y compara con la respuesta real del API. Es la comprobación que ADR-006a y ADR-006b declaran.

**Como test del contrato de errores.** Envía la `request` de cada caso de `validationChecks` y compara estado y cuerpo. V8 es el que más falla en la práctica: muchos frameworks ignoran en silencio los campos no reconocidos, y ADR-009 exige rechazarlos.

**Como semilla de la aplicación.** Cárgalo como datos iniciales. La primera pantalla muestra los cinco casos de §7.3, **los cuatro valores de `status`** y un consolidado desfavorable sin que nadie digite nada. Es la evidencia visual de RF-08.

**Como ejemplo del contrato de API.** Los mismos valores en los ejemplos de OpenAPI. Un consumidor ve al instante que `value` puede ser `null` y que `0` significa algo distinto.

**Como validación cruzada.** Carga las entradas en una hoja de cálculo con las fórmulas escritas de forma independiente y compara. Si dos implementaciones separadas coinciden, la probabilidad de un error de signo o de fórmula cae drásticamente.

## Usos futuros

**Prueba de no regresión ante refactor.** Cuando la lógica se mueva de capa o se revise ADR-002, el fixture es lo que garantiza que el comportamiento no cambió. Es el activo que hace barato refactorizar.

**Base de las pruebas de contrato del API.** Un cambio en la forma del payload rompe un test en lugar de romper el dashboard.

**Punto de partida de la curva S.** Cuando se habilite el historial por periodo, este fixture es el corte *t₁*. Añadir *t₀* y *t₂* con los mismos BAC produce una serie temporal completa sin recalcular ningún caso. El modelo sí habría que ampliarlo: ADR-005 documenta lo que exige introducir reportes por periodo.

**Banco de pruebas del diseño visual.** Cualquier propuesta de dashboard se evalúa cargando este caso: si al mirarlo no distingues en segundos que el proyecto va mal, el diseño falló el criterio explícito del enunciado. Localizar en qué actividades está el problema es una prueba adicional, útil aunque el enunciado no la exija.

**Material de la demo y del README.** Los números ya cuentan una historia completa: una actividad sana, una que se desangra, una con costo sin producto, una con avance y sin costo imputado todavía, una ejecutada antes de su plan y una que va exactamente según lo previsto.

**Pruebas de propiedades, si sobra tiempo.** El fixture cubre casos concretos; complementarlo con invariantes generadas al azar cubre el espacio que ocho actividades no alcanzan. Por ejemplo: `EV ≤ BAC`, `CV = EV − AC`, y `CPI > 1 ⟺ CV > 0` **siempre que CPI sea evaluable** — sin esa precondición la propiedad es falsa, y a4 es el contraejemplo del propio fixture.
