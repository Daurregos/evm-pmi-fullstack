# Verificación y publicación del contrato OpenAPI — Diseño

**Fecha:** 2026-07-29
**Estado:** aprobado por el usuario
**Base:** `origin/develop` en `9588c65`
**Rama:** `feat/verify-publish-openapi`

## Objetivo

Comprobar que `contracts/evm/openapi.yaml` describe exactamente la superficie
HTTP implementada por el slice A2, impedir nuevas divergencias mediante
validación de respuestas HTTP reales contra OpenAPI 3.1 y publicar una
interfaz Swagger ejecutable en `/api-docs`.

El contrato, los ADR y el fixture son fuentes cerradas durante la
implementación. Una discrepancia atribuible al YAML se corrige en el contrato.
Una discrepancia atribuible al código detiene el cambio y se reporta, porque
los ADR deciden el comportamiento HTTP.

## Fuentes y alcance

La auditoría contrasta:

- producto y criterios de aceptación en `docs/PRD.md`;
- decisiones HTTP y contractuales en ADR-004, ADR-006a, ADR-006b, ADR-007,
  ADR-008 y ADR-009;
- estrategia de prueba en `docs/TESTING.md`;
- valores y ejemplos en `contracts/evm/evm-fixture.json`;
- contrato publicado en `contracts/evm/openapi.yaml`;
- diseño y evidencia histórica del slice A2; y
- rutas, adaptadores HTTP y pruebas reales vigentes.

El cambio puede modificar el contrato solo si la auditoría demuestra que el
YAML contradice sus fuentes autoritativas. Añade pruebas contractuales,
dependencias necesarias y Route Handlers dedicados a la documentación.

Quedan excluidos `src/ui/`, las páginas, `src/domain/`, `src/application/` y
`README.md`. Tampoco se modifican PRD, ADR ni fixture.

## Enfoques considerados

### Validador OpenAPI 3.1 y Swagger UI autoalojada — elegido

`openapi-backend` carga directamente el archivo YAML y valida cada cuerpo de
respuesta por `operationId` y código de estado. `swagger-ui-dist` aporta los
recursos estáticos de Swagger UI, servidos por la propia aplicación. Este
enfoque valida semántica OpenAPI 3.1, evita mantener una copia del contrato y
no depende de una CDN ni de una página React.

### JSON Schema 2020-12 extraído y Swagger UI autoalojada

AJV podría validar los esquemas extraídos, pero esa prueba dejaría de verificar
el documento como contrato OpenAPI: la selección de operación, respuesta y
referencias sería lógica propia de la prueba. Se descarta porque ofrece
evidencia más débil que un validador consciente de OpenAPI 3.1.

### Validador externo y documentación separada

Una herramienta como Schemathesis podría explorar más combinaciones, pero
introduciría otro runtime y un segundo flujo de ejecución para una suite
TypeScript que ya levanta la aplicación y PostgreSQL. También separaría la
publicación del contrato de la aplicación que describe. Se descarta por costo
operativo sin beneficio requerido en este alcance.

## Auditoría contractual

La revisión construye una matriz con las ocho operaciones publicadas:

| Ruta | Operaciones |
|---|---|
| `/projects` | `GET`, `POST` |
| `/projects/{projectId}` | `GET`, `PUT`, `DELETE` |
| `/projects/{projectId}/activities` | `POST` |
| `/projects/{projectId}/activities/{activityId}` | `PUT`, `DELETE` |

Para cada operación se comparan:

1. verbo, ruta y `operationId`;
2. parámetros de ruta;
3. esquema del cuerpo de escritura cuando exista;
4. código y cuerpo de éxito;
5. respuestas 400, 404 y 422 aplicables; y
6. ausencia de cuerpo en 204.

La revisión de restos comprueba que:

- el documento declara OpenAPI 3.1;
- `info.version` contiene una versión SemVer fija;
- no existe `x-decisions-missing` en ningún nivel;
- no hay rutas ni operaciones adicionales; y
- todo esquema de `components.schemas` es alcanzable desde una operación y
  corresponde a una forma observable de petición, respuesta o error.

La matriz se materializa como aserciones estructurales para que verbos,
operaciones, respuestas y esquemas huérfanos no dependan de una revisión
manual futura. La validación de respuestas reales aporta la evidencia sobre
las formas observables.

## Validación de respuestas reales

Una prueba contractual nueva forma parte del runner existente que arranca
Next.js y usa PostgreSQL real. Inicializa una sola instancia del validador con
`contracts/evm/openapi.yaml`.

Cada caso:

1. restablece y siembra la base desde el fixture;
2. construye la petición con datos leídos del fixture;
3. ejecuta la operación HTTP real;
4. confirma el código esperado del fixture;
5. valida el cuerpo contra `operationId` y código de respuesta; y
6. conserva las aserciones de cuerpo exacto que aporten evidencia adicional.

La cobertura mínima obligatoria incluye:

- `listProjects` 200;
- `createProject` 201;
- `getProject` 200;
- `replaceProject` 200;
- `deleteProject` 204 sin cuerpo;
- `createActivity` 201;
- `replaceActivity` 200;
- `deleteActivity` 204 sin cuerpo;
- `malformed_request` 400;
- `not_found` 404; y
- `validation_failed` 422.

Los casos de error usan literalmente las tres envolventes de
`errorEnvelopes`. Las escrituras válidas se derivan de `readResponse`,
`emptyProject` o `writeSchemas`; no introducen cifras ni formas contractuales
inventadas. Los dos 204 se validan por operación y estado, y además se
comprueba que el cuerpo HTTP crudo esté vacío.

## Publicación de Swagger UI

La documentación vive únicamente en Route Handlers con runtime Node.js:

- `GET /api-docs` devuelve el HTML que inicializa Swagger UI;
- `GET /api-docs/openapi.yaml` lee y devuelve
  `contracts/evm/openapi.yaml`; y
- `GET /api-docs/assets/{asset}` sirve una lista cerrada de recursos de
  `swagger-ui-dist`.

El HTML configura el contrato con la URL relativa
`/api-docs/openapi.yaml`. Por compartir origen con las rutas reales, “Try it
out” invoca la misma aplicación sin CORS ni una URL de backend duplicada.

El contrato servido se lee desde su ruta canónica en tiempo de solicitud; no
se genera ni conserva otro YAML. La lista cerrada de recursos evita recorrido
de directorios y responde 404 para nombres no publicados. Los tipos MIME de
HTML, YAML, JavaScript y CSS son explícitos.

## Pruebas de documentación

La misma suite contractual verifica con el entorno levantado que:

1. `/api-docs` responde 200 como HTML y configura Swagger UI con la URL
   canónica servida;
2. `/api-docs/openapi.yaml` responde 200 y sus bytes coinciden con el archivo
   del repositorio;
3. los recursos JavaScript y CSS configurados responden 200 con su tipo
   correcto;
4. un recurso fuera de la lista cerrada responde 404; y
5. el contrato cargado por la interfaz describe las ocho operaciones reales,
   por lo que “Try it out” dispone de sus verbos, rutas y cuerpos.

La verificación final abre la ruta contra el entorno real y ejecuta al menos
una operación desde la misma configuración de origen. Si no hay navegador
automatizable disponible, la evidencia mínima es la carga completa de HTML,
YAML y recursos, seguida de una petición real a una operación publicada.

## Estrategia de implementación

El cambio sigue RED–GREEN–REFACTOR:

1. añadir primero las pruebas de higiene, respuestas reales y documentación;
2. confirmar el rojo por ausencia del validador y de `/api-docs`;
3. instalar versiones fijadas compatibles con OpenAPI 3.1;
4. implementar los Route Handlers mínimos;
5. corregir solo discrepancias contractuales demostradas; y
6. refactorizar helpers de prueba o servicio sin ampliar el territorio.

La base de desarrollo y pruebas se aísla del entorno paralelo mediante un
PostgreSQL propio o un puerto alternativo. Nunca se migrará ni se truncará la
base usada por B2 u otro worktree.

## Riesgos y mitigaciones

- **Una prueba valida el esquema equivocado.** Cada caso identifica
  explícitamente `operationId` y código de estado.
- **Los 204 pasan sin demostrar cuerpo vacío.** Se combina validación
  contractual con una aserción sobre el cuerpo HTTP crudo.
- **Swagger UI sirve una copia obsoleta.** El handler lee el archivo canónico
  en cada solicitud y una prueba compara sus bytes.
- **Los recursos de Swagger permiten leer archivos arbitrarios.** Solo se
  sirven nombres enumerados.
- **Una dependencia afirma soporte 3.1 sin manejar sus esquemas.** Una prueba
  de inicialización estricta y la validación de todos los tipos de respuesta
  ejercitan las formas 3.1 usadas por el contrato.
- **El cambio interfiere con B2.** El territorio excluido se revisa en el diff
  y la base de datos de prueba permanece aislada.

## Verificación y cierre

Antes de afirmar que el cambio está terminado se ejecutan de forma fresca:

- prueba roja registrada y prueba verde de contrato;
- `npm run typecheck`;
- `npm run lint`;
- `npm run build`;
- suite completa contra PostgreSQL aislado;
- `git diff --check`;
- auditoría del diff y de los archivos del commit;
- contraste con `docs/TESTING.md` y las secciones `Verificación` de los ADR
  aplicables; y
- comprobación de `/api-docs`, sus recursos, el YAML servido y una operación
  real con el entorno levantado.

El informe final enumera cada discrepancia y su origen, la cobertura exacta de
la prueba de validación y la línea para documentar posteriormente:
`Swagger UI: /api-docs`. Crear un pull request, fusionarlo, eliminar la rama o
retirar el worktree requiere el flujo GitFlow y la autorización
correspondientes.
