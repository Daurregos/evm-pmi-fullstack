## Context

`contracts/evm/openapi.yaml` precede a la superficie HTTP real implementada en
el slice A2. Las pruebas actuales ejercitan rutas, códigos y cuerpos contra el
fixture, pero no pasan las respuestas reales por los esquemas OpenAPI. Tampoco
existe una ruta que publique el contrato o permita explorarlo.

El cambio cruza pruebas, dependencias y Route Handlers. Debe respetar el
contrato y los ADR como fuentes cerradas, usar el fixture como oráculo, convivir
con el worktree de B2 y excluir UI, páginas, dominio, aplicación y README. El
diseño previo aprobado está en
`docs/superpowers/specs/2026-07-29-verify-publish-openapi-design.md`.

## Goals / Non-Goals

**Goals:**

- demostrar automáticamente la paridad entre las ocho operaciones reales y
  OpenAPI 3.1;
- validar una respuesta real de éxito de cada operación y las tres envolventes
  de error;
- detectar restos contractuales como extensiones pendientes o esquemas sin uso;
- servir el archivo canónico y Swagger UI autoalojada en `/api-docs`; y
- comprobar la documentación con el mismo entorno que ejecuta las pruebas de
  contrato.

**Non-Goals:**

- cambiar reglas de producto, ADR, fixture o formas de transporte aprobadas;
- generar OpenAPI desde código o generar código desde OpenAPI;
- validar respuestas en producción dentro de cada handler;
- añadir autenticación, versionado de rutas, CORS o una página React; y
- modificar `src/ui/`, páginas, `src/domain/`, `src/application/` o README.

## Decisions

### Validación consciente de OpenAPI 3.1

La prueba usará `openapi-backend` como dependencia de desarrollo. Inicializará
una instancia desde `contracts/evm/openapi.yaml` y llamará a la validación de
respuesta con `operationId` y código de estado. Así la selección de operación,
respuesta y referencias pertenece a un validador OpenAPI y no a lógica JSON
Schema escrita por la propia prueba.

AJV directo se descarta porque exigiría extraer y resolver esquemas manualmente.
Un validador externo se descarta porque añadiría otro runtime a la suite
TypeScript existente.

### Cobertura por matriz explícita

Una prueba estructural mantendrá la matriz cerrada de las ocho operaciones,
sus cuerpos de escritura, respuestas publicadas y esquemas alcanzables. La
prueba HTTP restablecerá el fixture antes de cada caso y validará:

- los ocho éxitos por `operationId`;
- cuerpo crudo vacío en ambos 204;
- un 400, un 404 y un 422 contra sus operaciones y esquemas; y
- códigos y datos procedentes directamente del fixture.

La prueba estructural también exigirá OpenAPI 3.1, `info.version: 1.0.0`,
ausencia recursiva de `x-decisions-missing` y que todos los esquemas de
componentes sean alcanzables desde `paths`.

### Swagger UI autoalojada mediante Route Handlers

`swagger-ui-dist` será dependencia de ejecución. La aplicación servirá:

- HTML en `/api-docs`;
- el archivo del repositorio en `/api-docs/openapi.yaml`; y
- únicamente los recursos JavaScript y CSS enumerados bajo
  `/api-docs/assets/{asset}`.

El HTML usará una URL relativa al contrato y el mismo origen de las operaciones
reales, habilitando “Try it out” sin otra configuración de backend. Los
handlers usarán runtime Node.js para leer el contrato y los recursos instalados.
Una lista cerrada de recursos evita recorrido de directorios.

Una página React se descarta porque invade el territorio de B2. Una CDN se
descarta porque impediría demostrar que la documentación abre sin red externa.

### Contrato servido sin copia

El handler de `/api-docs/openapi.yaml` leerá
`contracts/evm/openapi.yaml` desde la raíz de ejecución en cada solicitud. Una
prueba comparará los bytes servidos con el archivo. No habrá generación,
sincronización ni copia en `public/`.

### Integración con el runner contractual

El runner actual añadirá el nuevo archivo de prueba a su lista explícita y
mantendrá concurrencia uno. El servidor Next y PostgreSQL que ya usa la suite
son la frontera real; no se añadirá un servidor de documentación separado.
Durante desarrollo se usará una base efímera en un puerto distinto para no
migrar ni truncar la base de otro worktree.

## Risks / Trade-offs

- [El validador no acepta una construcción OpenAPI 3.1 usada por el contrato]
  → fijar una versión que declare soporte 3.1 y demostrarlo inicializando el
  documento y validando todas las formas reales.
- [Un 204 pasa sin esquema aunque transporte contenido] → comprobar además que
  el cuerpo HTTP crudo es exactamente vacío.
- [El YAML servido diverge del repositorio] → leer la fuente canónica por
  solicitud y comparar bytes en la prueba.
- [Un nombre de recurso permite leer otro archivo] → resolver solo una tabla
  cerrada de nombres y responder 404 a cualquier otro valor.
- [Los recursos existen en desarrollo pero faltan al ejecutar el build] →
  ejecutar `npm run build` y una verificación runtime fresca sobre el artefacto
  instalado antes del cierre.
- [La auditoría descubre un defecto de código] → detener implementación y
  reportarlo; no adaptar el contrato a una implementación contraria a ADR.

## Migration Plan

No hay migración de datos ni cambio de las rutas de negocio. El despliegue
instala las dependencias fijadas y publica rutas adicionales bajo `/api-docs`.
El rollback elimina esos Route Handlers, las pruebas y dependencias nuevas; las
ocho operaciones y PostgreSQL permanecen sin cambios.

## Open Questions

No quedan preguntas de producto o arquitectura. La ruta `/api-docs`, el
validador OpenAPI 3.1 y el autoalojamiento fueron aprobados por el usuario.
