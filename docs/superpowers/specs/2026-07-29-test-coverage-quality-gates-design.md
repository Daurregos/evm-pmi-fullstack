# Cobertura de pruebas y aislamiento contractual — Diseño

**Fecha:** 2026-07-29
**Estado:** aprobado anticipadamente por el usuario
**Base:** `origin/develop` en `b336e83`
**Rama:** `chore/test-coverage`

## Objetivo

Publicar una medición reproducible de líneas, ramas, funciones y sentencias
para el código propio ejercitable, aplicar en CI umbrales diferenciados para
dominio, aplicación y resultado global, y conservar como prerrequisito
verificado que la suite contractual restablece su semilla aunque el dashboard
haya mutado la base.

La cobertura complementa, pero no reemplaza, el criterio de
`docs/TESTING.md`: cada afirmación de verificación aplicable debe seguir
respaldada por una prueba significativa. No se añadirán pruebas vacías ni
exclusiones para elevar un porcentaje.

## Fuentes y límites

El cambio se rige por:

- la estrategia y los niveles de prueba de `docs/TESTING.md`;
- las verificaciones de ADR-001 a ADR-009 que correspondan a código
  ejercitable;
- el fixture como oráculo directo cuando representa el comportamiento
  esperado;
- los comandos actuales de `package.json`, `scripts/test.sh` y CI; y
- el código y las pruebas existentes como evidencia de ejecución.

PRD, ADR, fixture y OpenAPI permanecen cerrados. El cambio puede modificar
configuración de pruebas, scripts, pruebas de la política de cobertura,
`docs/TESTING.md`, CI y dependencias de desarrollo. No modifica `README.md`.

## Prerrequisito contractual ya satisfecho

La base `b336e83` ya ejecuta `resetFixture` en `beforeEach` tanto para
`tests/contract/real-http.test.ts` como para
`tests/contract/openapi-runtime.test.ts`. Cada preparación trunca
`projects` con reinicio de secuencias y cascada, y después carga
`readResponse` mediante `seedFixture`.

La investigación reprodujo el escenario pedido:

1. suite contractual sobre la semilla: 67 pruebas aprobadas;
2. eliminación manual de `DELETE /projects/1` contra el backend real: 204;
3. suite contractual sin limpieza externa: 67 pruebas aprobadas.

Por tanto, el cambio no duplica ni altera esa preparación. La línea de README
que recomienda truncar la base queda identificada para el informe de cierre,
pero se preserva literalmente por instrucción del usuario.

## Enfoques considerados

### `c8` sobre el ejecutor Node actual y política agregada — elegido

`c8` recoge cobertura V8 de los procesos Node que ejecutan las suites actuales,
remapea los resultados a TypeScript y genera simultáneamente consola, HTML,
resumen JSON y detalle JSON. Un verificador propio agrega los contadores
publicados por ruta y aplica los umbrales exactos a `src/domain/`,
`src/application/` y al conjunto global.

Este enfoque conserva `node --test`, cubre procesos descendientes como el
servidor contractual y permite informar las cuatro métricas y las ramas de
dominio no ejercitadas sin introducir otro framework de pruebas.

### Cobertura experimental de `node --test`

La cobertura nativa reduciría dependencias, pero no produce por sí sola el
HTML local ni la métrica de sentencias requerida. Añadir conversores para
completar esas salidas recrearía parte de `c8` con evidencia más frágil.

### Migración a Vitest

Vitest integra cobertura, reportes y umbrales, pero exigiría migrar el
ejecutor, los patrones de archivos y parte de la orquestación del servidor y
PostgreSQL. Se descarta porque amplía el cambio sin aportar comportamiento
solicitado.

## Recolección y comando único

`npm run test:coverage` ejecutará un guion versionado que:

1. ubica la raíz del worktree;
2. levanta PostgreSQL solo fuera de CI;
3. aplica las migraciones;
4. limpia cualquier informe anterior;
5. ejecuta bajo `c8` las suites de estructura, cliente, integración y
   contrato;
6. genera `text`, `html`, `json-summary` y `json` bajo `coverage/`; y
7. ejecuta el verificador de política.

El informe HTML abre en `coverage/index.html`. `coverage/` queda ignorado por
Git porque es un artefacto reproducible.

El guion no cubre `typecheck` ni lint: ambos siguen ejecutándose como puertas
separadas, pero no son ejecuciones de comportamiento de JavaScript. CI conserva
esas puertas y sustituye la sucesión de comandos de prueba por el comando único
de cobertura, evitando ejecutar dos veces las mismas suites.

## Universo medido y exclusiones

El universo parte de `src/**/*.{ts,tsx}` con `all: true`, de modo que un archivo
propio ejercitable sin ninguna ejecución aparece con cero en lugar de
desaparecer del informe.

Las exclusiones explícitas son:

| Exclusión | Motivo |
|---|---|
| `src/app/mock-api/**` | Route Handlers del doble que sirve el fixture; no son funcionalidad del producto |
| `src/infrastructure/mock/**` | Implementación del mismo doble `/mock-api` |
| `src/application/evm-repository.ts` | Puerto compuesto exclusivamente por tipos, sin implementación ejecutable |
| `src/shared/contract.ts` | Contrato TypeScript compuesto exclusivamente por tipos |

Configuración, migraciones, scripts, pruebas y documentos quedan fuera por
estar fuera de `src/`; no se excluyen archivos ejercitables dentro de `src`
salvo el doble de prueba expresamente solicitado. Los recursos generados
permanecen fuera del universo cuando no son fuente ejecutable propia.

Antes del cierre se revisa la lista de archivos del informe para demostrar que
ninguna exclusión adicional oculta código con el fin de alcanzar un umbral.

## Política y agregación

El verificador lee `coverage/coverage-summary.json`, descarta la entrada
precalculada `total` y suma los contadores `covered`, `skipped` y `total` de
cada archivo. Calcula porcentajes desde esos contadores sin promediar
porcentajes de archivos.

Aplica la misma regla a las cuatro métricas:

| Ámbito | Líneas | Ramas | Funciones | Sentencias |
|---|---:|---:|---:|---:|
| `src/domain/` | 95 % | 95 % | 95 % | 95 % |
| `src/application/` | 90 % | 90 % | 90 % | 90 % |
| Global | 80 % | 80 % | 80 % | 80 % |

La ausencia de archivos en un ámbito requerido es un error de política, no un
100 % vacío. Cualquier métrica inferior a su umbral produce salida distinta de
cero y enumera ámbito, métrica, porcentaje real y mínimo.

El verificador imprime una tabla estable con los valores reales de los tres
ámbitos. Esa salida alimenta el informe de cierre y permite copiar la tabla a
otro documento sin convertir README en fuente de verdad.

## Ramas de dominio no cubiertas

Además del resumen, el verificador lee `coverage/coverage-final.json`.
Para cada contador de rama igual a cero dentro de `src/domain/`, informa
archivo, línea, columna, tipo de rama y alternativa no tomada usando el
`branchMap` remapeado.

Las ramas faltantes no se excluyen ni permiten bajar el 95 %. Si dominio queda
por debajo del umbral, el cambio se detiene y se determina qué caso del fixture
o qué decisión autorizada carece de prueba. Si supera 95 % pero conserva alguna
rama descubierta, esa rama también aparece en el cierre.

## Pruebas de la política

Antes de implementar el verificador se añaden pruebas que usen datos sintéticos
para demostrar:

- agregación por contadores y no por promedio de porcentajes;
- clasificación correcta de rutas de dominio, aplicación y global;
- evaluación independiente de las cuatro métricas;
- fallo cuando un ámbito requerido está vacío;
- fallo al quedar una métrica por debajo de su umbral;
- aprobación exacta en el límite inclusivo; y
- localización de ramas de dominio con contador cero.

Una revisión estructural de la configuración comprueba `all: true`, los cuatro
reportes, el universo de `src`, las cuatro exclusiones justificadas y la
presencia del mismo comando de cobertura en CI.

## Demostración de la puerta

La verificación final prueba tanto el camino verde como el rojo:

1. ejecutar `npm run test:coverage` con la política aprobada y conservar la
   salida completa;
2. elevar temporalmente un umbral por encima del porcentaje real;
3. ejecutar literalmente el verificador y observar salida distinta de cero;
4. restaurar el umbral aprobado; y
5. volver a ejecutar la verificación verde.

La modificación temporal no se incorpora a ningún commit. Esta demostración
prueba que el umbral rompe la construcción y no se limita a informar.

## CI y errores operativos

CI mantiene lint, restricciones de imports y typecheck como puertas previas.
Después ejecuta `npm run test:coverage` contra el servicio PostgreSQL declarado
por el workflow. El guion detecta `CI=true` y no intenta crear otro contenedor,
pero siempre aplica las migraciones antes de las suites.

Los fallos se distinguen por etapa:

- una suite fallida conserva su código y evita validar cobertura incompleta;
- un informe ausente o malformado falla con una explicación;
- una capa sin archivos falla como configuración inválida;
- una métrica baja imprime la comparación exacta; y
- un error al generar HTML impide declarar terminado el comando.

## Riesgos y mitigaciones

- **Los procesos descendientes no entregan cobertura.** Una medición temprana
  confirma que `c8` recibe resultados de las suites y del servidor Next; si no,
  la orquestación ejecutará explícitamente los procesos bajo el mismo entorno
  V8 antes de continuar.
- **Los sourcemaps atribuyen código compilado a rutas incorrectas.** Se audita
  el listado de archivos de ambos JSON y enlaces del HTML contra rutas reales
  de `src`.
- **El global oculta una capa débil.** Los umbrales de dominio y aplicación se
  calculan separadamente desde contadores.
- **Un archivo sin importar desaparece.** `all: true` y el patrón de inclusión
  lo incorporan con cero.
- **Se excluye código para aprobar.** La prueba estructural fija la lista
  justificada y la auditoría final compara configuración, documentación e
  informe.
- **La cobertura duplica toda la suite en CI.** El workflow ejecuta las suites
  una sola vez dentro del comando de cobertura.

## Verificación y cierre

Antes de afirmar que el cambio está terminado se ejecutan de forma fresca:

- prueba roja y verde del verificador de política;
- `npm run lint`;
- `npm run lint:imports`;
- `npm run typecheck`;
- `npm run test:coverage`;
- `npm run build`;
- prueba contractual limpia, mutación HTTP manual y nueva prueba contractual;
- demostración temporal de fallo del umbral y restauración;
- inspección de `coverage/index.html`, `coverage-summary.json` y
  `coverage-final.json`;
- `git diff --check`;
- contraste con `docs/TESTING.md` y las secciones `Verificación` de los ADR
  aplicables;
- auditoría requisito por requisito del OpenSpec y del diff; y
- revisión de que cada commit contiene solo archivos del cambio.

El cierre informa los porcentajes reales por capa, todas las exclusiones y su
motivo, las ramas de dominio no cubiertas y la línea de README que puede
retirarse después:
`truncate table projects restart identity cascade`.

Crear un pull request no autoriza fusionarlo. El PR, si se solicita, se dirige
a `develop`; rama y worktree se conservan hasta confirmar la integración.
