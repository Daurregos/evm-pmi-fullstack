# ADR-008 — Ciclo de vida y borrado en cascada

**Estado:** Aceptada · **Fecha:** 2026-07-26

**Relacionada con:** RF-01, RF-02; modelo del PRD §5, supuesto de borrado del §8 y limitaciones del §10

**Depende de:** ADR-005

## Contexto

RF-01 exige que eliminar un proyecto retire sus actividades y el modelo del PRD §5 establece que una actividad pertenece a un proyecto y no existe fuera de él. El supuesto del §8 ya cierra el borrado físico; ADR-005 descarta el historial y el PRD §10 excluye la recuperación. Debe decidirse dónde proteger esta composición y cómo impedir que una falla deje un proyecto parcialmente eliminado.

## Decisión

La persistencia trata Proyecto–Actividad como una composición y garantiza que eliminar físicamente un proyecto elimine todas sus actividades en la misma operación atómica, mientras eliminar una actividad conserva el proyecto y sus demás actividades.

## Alternativas consideradas

- **Coordinar el borrado desde la capa de aplicación:** haría explícita la secuencia y permitiría políticas por caso de uso, pero duplicaría la regla y expondría estados parciales si alguna ruta omite la coordinación.
- **Impedir borrar proyectos con actividades:** protegería contra pérdidas accidentales, una elección razonable en sistemas auditables, pero contradiría RF-01.
- **Aplicar borrado lógico:** permitiría recuperación y auditoría, pero introduciría estados, filtros y retención excluidos por el PRD y ADR-005.

## Consecuencias

- No pueden existir actividades huérfanas y los consumidores no coordinan manualmente el borrado descendente.
- Una falla en cualquier parte de la eliminación revierte la operación completa.
- El ciclo de vida de la actividad queda acoplado al proyecto; conservarla o moverla tras eliminarlo requeriría revisar la decisión.
- El borrado es irreversible y una acción accidental pierde también todas las actividades, costo aceptado por el alcance.
- Requisitos futuros de auditoría, recuperación o retención obligan a actualizar primero el PRD y ADR-005.
- Según ADR-002, no existe estado derivado persistido que requiera limpieza adicional.

## Verificación

Pruebas de integración verifican contra `contracts/evm/evm-fixture.json` los resultados esperados: crean un proyecto con varias actividades, eliminan el proyecto y comprueban la ausencia de ambos y de huérfanos; otra prueba provoca una falla después de iniciar el borrado y comprueba que, por la reversión, el proyecto y todas sus actividades permanecen. Otro caso elimina una actividad y verifica que el proyecto y sus actividades hermanas permanecen. Una revisión del modelo confirma que la integridad no depende de llamadas manuales de consumidores.
