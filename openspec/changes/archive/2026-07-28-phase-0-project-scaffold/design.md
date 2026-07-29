## Context

El repositorio parte de documentación, contrato y oráculo aceptados, pero no
tiene código de aplicación rastreado. La fase 0 debe hacer ejecutables las
fronteras de ADR-001, ADR-002, ADR-003 y ADR-008 sin anticipar la implementación
EVM. El diseño aprobado se conserva en
`docs/superpowers/specs/2026-07-28-phase-0-project-scaffold-design.md`.

Los artefactos cerrados no se editan. El fixture se consume como fuente de datos
para el mock y la semilla, y PostgreSQL real es la única base admitida en
integración y CI.

## Goals / Non-Goals

**Goals:**

- Dejar un repositorio Next.js/TypeScript ejecutable con un solo comando local.
- Hacer fallar lint cuando se invierta una frontera de dependencias o se
  disperse la política decimal.
- Materializar dos tablas PostgreSQL mediante Drizzle y una migración SQL
  revisable.
- Probar la conversión explícita `numeric` a `Decimal` contra PostgreSQL.
- Servir y probar un mock HTTP derivado exclusivamente del fixture.
- Preparar los cuatro árboles de pruebas establecidos en `docs/TESTING.md`.

**Non-Goals:**

- Implementar cálculos, clasificación, consolidación o validación EVM.
- Crear casos de uso, API real, páginas o componentes.
- Persistir indicadores, estado derivado o historial.
- Cambiar PRD, supuestos, ADR, OpenAPI, fixture o estrategia de pruebas.

## Decisions

### Mantener una sola aplicación Next con rutas mock

Los route handlers de `src/app/` servirán exclusivamente el mock. Delegarán la
lectura y limpieza del fixture a un módulo de infraestructura. No habrá páginas
ni componentes. Esta opción evita un segundo proceso Node y dependencias de
mocking; las rutas se reemplazarán por handlers reales en una fase posterior.

Un encabezado `x-mock-scenario`, exclusivo de la simulación, permitirá devolver
las tres envolventes del fixture sin añadir rutas ajenas al OpenAPI.

### Expresar el factoring de dominio solo mediante firmas

Tres módulos documentarán las firmas de la primitiva de magnitudes, actividad y
proyecto. Serán contratos de tipos sin cuerpo ejecutable. De este modo la
dirección futura queda visible y la fase no introduce fórmulas parciales ni
stubs que puedan confundirse con comportamiento válido.

### Centralizar decimal.js en dominio

`src/domain/decimal.ts` configurará el constructor una vez con precisión 40 y
exportará la única función de redondeo de presentación. Infraestructura
importará ese constructor para convertir las cadenas que entrega Drizzle.
Reglas AST de ESLint prohibirán en el resto de `src/` la configuración y los
métodos de cuantización/presentación.

### Usar Drizzle con SQL generado y revisable

El esquema declarará `numeric(38,18)` para los cuatro valores numéricos
capturados y `onDelete: "cascade"` en la referencia de actividad. Drizzle Kit
generará una migración SQL plana. Una prueba estructural comprobará que el
archivo contiene exactamente dos tablas, los tipos esperados y
`ON DELETE CASCADE`, y que no contiene columnas derivadas.

La implementación del único repositorio encapsulará Drizzle. El mapeador será el
único punto que transforma los `numeric` recibidos como cadena en `Decimal`.

### Hacer la semilla idempotente y fiel al fixture

La semilla realizará upsert por los identificadores del fixture y reajustará las
secuencias. Proyectará cada actividad a sus cinco datos capturados y descartará
todo campo calculado. No borrará datos ajenos como efecto implícito.

### Ejecutar contrato sobre HTTP y persistencia sobre PostgreSQL

Las pruebas de contrato levantarán Next en un puerto de prueba y usarán `fetch`
contra las rutas mock. La integración aplicará la migración y ejecutará el
round-trip decimal mediante el repositorio. Node Test Runner con `tsx` basta
para esta fase y evita incorporar otro framework.

### Conservar la sonda como artefacto temporal independiente

`verify-decimal.mjs` se moverá a `scripts/` con una nota de ciclo de vida. No se
refactorizará, ejecutará en suite o CI ni quedará bajo las reglas de `src/`.
Su eliminación o archivo pertenece al primer slice de fase 1.

## Risks / Trade-offs

- [El mock comparte proceso con la futura aplicación] → sus módulos y encabezado
  se nombran explícitamente como mock y no dependen de application o domain.
- [La escala 18 limita entradas con más decimales] → `numeric(38,18)` deja un
  margen muy superior al fixture y la elección queda visible para revisión.
- [Las firmas sin cuerpo no demuestran el factoring en ejecución] → fase 1
  deberá reemplazarlas mediante TDD antes de cualquier consumidor real.
- [La semilla por upsert no elimina registros adicionales] → preserva datos
  locales; una base recién clonada sigue quedando exactamente con el fixture.
- [El comando inicial instala dependencias y puede tardar] → ofrece el criterio
  de una sola orden; los comandos parciales siguen disponibles para iteración.

## Migration Plan

1. Añadir configuración Node/Next/TypeScript/ESLint y las carpetas base.
2. Incorporar Drizzle, generar y revisar la migración.
3. Levantar PostgreSQL, aplicar la migración y ejecutar la prueba de frontera.
4. Incorporar semilla y mock, luego ejecutar las pruebas HTTP.
5. Añadir guiones y CI, y verificar desde un entorno limpio.

No existe estado productivo que migrar. Para revertir antes de integrar se
retira el cambio completo; la base local se elimina con Docker Compose.

## Open Questions

Ninguna. Las decisiones necesarias para fase 0 quedaron aprobadas.
