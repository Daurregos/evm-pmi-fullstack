# ADR-005 — Modelo temporal: foto única vs. historial

**Estado:** Aceptada · **Fecha:** 2026-07-26

**Relacionada con:** RF-01, RF-02; modelo del PRD §5, supuesto de fecha de corte del §8 y limitaciones del §10

**Depende de:** ninguno

## Contexto

El PRD §5 establece una fecha de corte por proyecto que rige sus actividades; §§8 y 10 resuelven el producto como una fotografía y dejan el historial fuera de alcance. Aunque conservar cortes permitiría auditoría, tendencias y curva S, la aplicación pequeña tiene un usuario concurrente, decenas de actividades y tiempo limitado. Debe fijarse si una edición reemplaza la observación vigente o crea una nueva versión temporal.

## Decisión

Cada proyecto conserva una única foto mutable identificada por su fecha de corte vigente; las ediciones reemplazan los datos anteriores sin conservar versiones históricas.

## Alternativas consideradas

- **Historial de fotos por fecha de corte:** permitiría comparaciones, auditoría y curva S si esos requisitos existieran, pero introduciría selección de periodos e identidad de reportes que el alcance actual excluye.
- **Foto vigente más registro histórico auxiliar:** mantendría simples las lecturas actuales y facilitaría evolucionar, pero duplicaría el modelo temporal y exigiría coordinar dos representaciones sin un consumidor presente.

## Consecuencias

- Cada proyecto tiene un único estado vigente; su fecha de corte aplica a todas las actividades y no existen cortes independientes por actividad.
- Las ediciones son reemplazos: no se pueden reconstruir observaciones anteriores, auditar cambios ni generar tendencias o curva S. Este costo es aceptado por el alcance.
- Persistencia de indicadores, recálculo y borrado pertenecen a ADR-002, ADR-007 y ADR-008.
- Si se requieren comparaciones entre cortes, auditoría o curva S, esta decisión deberá revisarse.
- La evolución introducirá un reporte de corte inmutable que agrupe la fecha y los datos capturados de sus actividades.
- El estado vigente de cada proyecto se migrará como su primer reporte; los periodos posteriores crearán reportes en vez de sobrescribirlo.
- El dashboard leerá el reporte más reciente y las consultas históricas consumirán su secuencia; los indicadores seguirán derivándose conforme a ADR-002 y ADR-007.

## Verificación

Pruebas de integración comprueban que cada proyecto expone una sola fecha de corte vigente, que editar el proyecto o sus actividades reemplaza el estado anterior y que no existe una operación para consultar versiones históricas. Una revisión del modelo confirma que las actividades no poseen fechas de corte propias ni estructuras de historial.
