## Context

La fase de dominio ya deriva todos los indicadores de manera pura y la fase de
andamiaje ya dispone de PostgreSQL, Drizzle, una FK con cascada, un constructor
Decimal centralizado y tipos HTTP congelados. Sin embargo, el puerto actual
solo guarda y busca una actividad; no hay casos de uso, validación de negocio
ni lectura que conecte persistencia con dominio. La superficie HTTP real no
existe: /mock-api sigue siendo una simulación de contrato.

El diseño aprobado completo está en
docs/superpowers/specs/2026-07-29-slice-a1-application-persistence-design.md.
Las fuentes de producto y contrato permanecen cerradas. Este cambio implementa
solo application e infraestructura de datos, en paralelo con el frontend.

## Goals / Non-Goals

**Goals:**

- Ampliar el único puerto de repositorio y su adaptador Drizzle para la foto
  vigente de proyectos y actividades.
- Validar escrituras de negocio acumulando infracciones y sin mutar ante fallo.
- Exponer casos de uso que invoquen el único módulo de cálculo EVM y produzcan
  las representaciones publicadas sin redondear ni persistir derivados.
- Comprobar contra PostgreSQL real las decisiones de persistencia, foto única,
  cascada y validación.
- Documentar las capas y fronteras que existen al finalizar el slice.

**Non-Goals:**

- Rutas HTTP reales, parseo estructural de JSON, códigos de estado y envolventes
  de error; esos adaptadores pertenecen a A2.
- Cambios a domain, shared, ui, páginas, mock, migración, PRD, ADR, fixture u
  OpenAPI.
- Historial, fecha de corte por actividad, indicadores persistidos, cálculos en
  el cliente o una abstracción adicional de transacciones.

## Decisions

### Un solo puerto de persistencia y casos de uso inyectables

application conservará una interfaz EvmRepository que expresa insertar, buscar,
listar, reemplazar y eliminar proyectos y actividades. Los casos de uso
recibirán esa interfaz y el adaptador Drizzle será su única implementación. Los
resultados distinguirán éxito, infracciones y ausencia de recurso sin contener
códigos HTTP.

Separar dos repositorios y una unidad de trabajo añadiría coordinación sin
necesidad; importar Drizzle desde application invertiría la frontera
arquitectónica protegida por lint.

### Normalizar porcentajes al entrar en dominio

El contrato y la semilla guardan plannedProgress y actualProgress en la escala
0–100. Un adaptador de application convertirá el Decimal persistido a fracción
al construir ActivityInput para deriveActivity y consolidateProject. La salida
conserva la escala pública 0–100 y convierte los resultados Decimal a números
JSON sin cuantizarlos.

Mover la normalización al repositorio mezclaría persistencia con dominio;
calcular en A2 o UI duplicaría la regla de ADR-001 y ADR-003.

### Validación acumulativa previa a toda escritura

Los validadores reciben propiedades originales para detectar miembros ausentes,
null, campos de solo lectura y claves desconocidas. Recortan name, acumulan
reglas independientes y devuelven un comando tipado solo cuando no existen
infracciones. La mutación se ejecuta exclusivamente después de ese resultado.

Usar un esquema estricto como única barrera adelantaría 400 que ADR-009 reserva
a A2; lanzar en la primera regla impediría corregir V9 en una sola operación.

### Cascada declarativa y prueba de fallo dentro de PostgreSQL

Eliminar un proyecto será una única sentencia DELETE; la FK existente con ON
DELETE CASCADE conserva la composición dentro de PostgreSQL. La prueba de
reversión instalará temporalmente un trigger que falla durante el borrado de
una actividad en cascada y comprobará que la sentencia completa se revierte.

Coordinar borrados desde application duplicaría la política y abriría estados
parciales. Un hook de producción para fallar pruebas agregaría comportamiento
inexistente al producto.

### Arquitectura factual después de la implementación

docs/ARCHITECTURE.md se redactará cuando exista la aplicación. Mostrará las
dependencias que lint permite, el recorrido de GET /projects/{id} como diseño
de extremo a extremo y el límite actual: hoy solo /mock-api ejecuta esa
superficie; los handlers reales siguen pendientes de A2. La UI se describirá
por reglas, no por componentes de otro trabajo paralelo.

## Risks / Trade-offs

- [Una conversión 0–100/fracción se puede duplicar] → un único adaptador de
  entrada a dominio y pruebas contra las salidas publicadas del fixture.
- [Las validaciones pueden cambiar estado parcialmente] → validación completa
  antes de toda llamada de repositorio y pruebas de estado intacto.
- [La cascada parece atómica sin una prueba de reversión] → trigger temporal en
  PostgreSQL real durante la cascada de la FK.
- [El análisis podría persistir resultados] → revisión del esquema y de las
  escrituras, más las pruebas de ADR-002.
- [La arquitectura podría prometer HTTP inexistente] → marcar expresamente
  /mock-api y A2 como frontera actual y pendiente.

## Migration Plan

No hay migración de datos ni cambios en esquema. Se introduce código de
application e infraestructura compatible con las tablas existentes; la semilla
vigente conserva sus porcentajes 0–100. El despliegue aplica los commits del
slice y ejecuta la migración existente antes de las pruebas. Para revertir antes
de integrar se revierten los commits del cambio; los datos no cambian de forma.

## Open Questions

Ninguna. Las decisiones de producto, contrato y límites del slice están
cerradas por las fuentes aplicables.
