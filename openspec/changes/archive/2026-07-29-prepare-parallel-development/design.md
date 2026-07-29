## Context

El mock ocupa hoy las mismas rutas que ADR-006a y OpenAPI reservan al backend,
`src/shared/contract.ts` solo contiene colección y errores, y la prueba de
consolidación consume tres de las cuatro estrategias negativas del fixture.
Las dos vías paralelas consumirán `src/shared/`, pero deben editar árboles de
rutas distintos. El diseño exploratorio aprobado y sus alternativas están en
`docs/superpowers/specs/2026-07-28-prepare-parallel-development-design.md`.

Las fuentes cerradas son `docs/PRD.md`, los ADR, el fixture y OpenAPI. Este
cambio modifica las capacidades OpenSpec `evm-domain-calculation` y
`project-scaffold` para alinear las pruebas y el scaffold con esas decisiones.

## Goals / Non-Goals

**Goals:**

- Probar las cuatro estrategias negativas directamente contra el fixture.
- Reservar `/mock-api` al mock y liberar las rutas contractuales.
- Permitir seleccionar mock o backend mediante una sola variable pública.
- Congelar DTO de transporte completos en `src/shared/` y detectar deriva
  entre el tipo de lectura y el fixture durante typecheck.

**Non-Goals:**

- Persistencia, casos de uso, validación o rutas reales.
- Componentes o peticiones del frontend.
- Generación de tipos, dependencias nuevas o cambios a las fuentes cerradas.

## Decisions

### Un prefijo real de App Router

Los handlers del mock vivirán bajo `src/app/mock-api/projects/`. Un route group
no sirve porque no añade un segmento URL. Los selectores permanecen en
`src/infrastructure/mock/`, por lo que se mueve el adaptador HTTP sin duplicar
la derivación del fixture.

Las pruebas permanentes ejercitan `/mock-api`; la ausencia actual de handlers
reales se revisa estructuralmente al cerrar el cambio, pero no se convierte en
una prueba de `404` que bloquearía el backend posterior.

### Una base pública y normalizada

`src/ui/api-base-url.ts` lee directamente
`NEXT_PUBLIC_EVM_API_BASE_URL`, admite ruta relativa o URL absoluta y usa
`/mock-api` por defecto. La normalización elimina barras finales para que el
consumidor añada rutas como `/projects` sin bifurcar código.

### DTO de cable, no modelos internos

`src/shared/contract.ts` sigue los nombres de esquemas OpenAPI y números JSON.
No importa `Decimal` ni reutiliza records de persistencia. Los cuerpos de
escritura conservan la nulabilidad estructural publicada para que ADR-009
pueda clasificar `null` como `required`; comandos validados pertenecen a
application y quedan fuera de `shared/`.

`IndexResult` conserva el objeto estable con cuatro miembros y nulabilidad solo
en `value` y `display`. No se fortalece a una unión discriminada porque este
cambio congela la forma publicada, no amplía OpenAPI.

La prueba de tipos carga el fixture, elimina sus claves de metadatos con el
helper existente y genera temporalmente un literal TypeScript `as const` que
debe satisfacer `ProjectAnalysis`. Ejecuta el compilador sobre ese literal y
lo elimina incluso ante un fallo. Así conserva los valores literales que el
import JSON ensancharía a `string`, sin recalcular datos ni replicar su forma.

### El fixture sigue siendo el único oráculo numérico

La cuarta aserción accede a
`negativeChecks.cpiExcludingZeroAcActivity`. El caso decimal `a7.cpi` también
proporciona su entrada y presentación desde el fixture. Los casos decimales no
representados allí siguen siendo pruebas focalizadas de la política decimal,
no copias del oráculo.

## Risks / Trade-offs

- [La variable pública queda fijada por el build de Next] → documentar que el
  cambio entre despliegues se configura mediante
  `NEXT_PUBLIC_EVM_API_BASE_URL`.
- [Los cuerpos compartidos permiten `null`] → documentar que son DTO HTTP
  previos a validación y mantener comandos internos fuera de `shared/`.
- [Un tipo importado desde JSON ensancha literales] → generar desde el JSON
  limpio un literal temporal `as const satisfies ProjectAnalysis` y ejecutar
  el compilador sobre él.
- [El backend futuro ocupa `/projects`] → no conservar pruebas que exijan su
  ausencia; verificar solo que ningún archivo del mock viva allí.

## Migration Plan

1. Añadir la cobertura negativa y alinear las guías dependientes.
2. Mover pruebas y runner a `/mock-api`, observar RED y mover los handlers.
3. Añadir la resolución de base y sus pruebas.
4. Añadir la prueba de tipos, observar RED y completar `src/shared/contract.ts`.
5. Verificar, revisar, archivar OpenSpec y abrir un PR a `develop`.

La reversión aplica los commits lógicos en orden inverso. No existe migración
de datos. Consumidores temporales del mock cambian su base a `/mock-api`.

## Open Questions

Ninguna. El usuario eligió una variable compatible con ruta relativa y URL
absoluta, y aprobó el diseño y el plan.
