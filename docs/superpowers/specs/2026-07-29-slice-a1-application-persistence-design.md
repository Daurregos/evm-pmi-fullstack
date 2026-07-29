# Slice A1: aplicación, persistencia y validación — Diseño

**Fecha:** 2026-07-29
**Estado:** aprobado por el usuario
**Base:** `origin/develop` en `84bd92e`

## Objetivo y alcance

Completar el slice A1 en `src/application/` y
`src/infrastructure/database/`: persistencia Drizzle, validación de negocio y
casos de uso para gestionar proyectos y actividades, listar proyectos y
obtener el análisis EVM autoritativo. Las pruebas de integración usarán
PostgreSQL real y cargarán directamente
`contracts/evm/evm-fixture.json`.

El cambio no modifica `src/domain/`, `src/shared/`, `src/ui/`, las páginas, el
mock ni las fuentes cerradas. La superficie HTTP real, el análisis estructural
de tipos y formatos, los códigos de estado y las envolventes de error quedan
para el slice A2.

El cambio OpenSpec que se cree después de aprobar este documento será la
definición canónica de propuesta, requisitos, diseño y tareas. Este documento
registra el razonamiento previo y deberá enlazar ese cambio sin competir con
sus artefactos.

## Enfoques considerados

### Casos de uso sobre un único puerto de persistencia — elegido

`application/` conserva una sola interfaz de repositorio y expone operaciones
enfocadas. Los casos de uso dependen del dominio, del contrato compartido ya
congelado y del puerto; la implementación Drizzle permanece en
`infrastructure/`. Es el enfoque que respeta las fronteras automatizadas y el
volumen actual sin añadir coordinación innecesaria.

### Repositorios separados y unidad de trabajo

Separar proyectos y actividades y añadir un coordinador transaccional haría
explícita una futura composición de operaciones. En este slice introduciría
tres abstracciones donde una interfaz basta y duplicaría la política de
transacciones que PostgreSQL ya garantiza para la cascada.

### Casos de uso acoplados a Drizzle

Reduciría archivos y adaptadores, pero invertiría la dependencia aprobada:
`application/` conocería el ORM y la base. También dificultaría probar
validación y cálculo sin infraestructura.

## Arquitectura y responsabilidades

`src/application/evm-repository.ts` amplía el puerto existente con las
operaciones mínimas de proyecto y actividad: insertar con identificador
generado, buscar, listar, reemplazar y eliminar. Los records persistidos
contienen solo identidad, relación y datos capturados.

La validación de aplicación recibe las propiedades originales para poder
distinguir campos editables, campos de lectura y propiedades desconocidas.
Devuelve un resultado discriminado: o un comando normalizado o todas las
infracciones. Los casos de uso no llaman al repositorio cuando la validación
falla. Los tipos y formatos incompatibles son una precondición del adaptador
HTTP de A2 y no crean nuevas reglas de negocio.

Los casos de uso se separan por responsabilidad, pero comparten adaptadores
puros:

- proyectos: crear, reemplazar, eliminar y listar;
- actividades: crear, reemplazar y eliminar dentro de su proyecto;
- análisis: cargar la foto vigente, invocar el dominio y materializar
  `ProjectAnalysis`;
- presentación de mutaciones: crear o reemplazar actividad devuelve
  `ActivityRead` derivado; proyecto devuelve `ProjectRead`.

Un recurso inexistente se representa como resultado de aplicación, no como
`404`. A2 decidirá el código y la envolvente.

`DrizzleEvmRepository` implementa el puerto. El mapeador de filas de actividad
continúa siendo el único punto que reconstruye cada `numeric` recibido como
cadena mediante el constructor `Decimal` de dominio. Ningún repositorio calcula
indicadores ni escribe columnas derivadas.

## Datos y recorrido

Los porcentajes cruzan el contrato y permanecen almacenados en escala 0–100,
coherente con la semilla integrada. Justo al construir `ActivityInput`, la
capa de aplicación los divide por cien y entrega fracciones al dominio,
conforme a ADR-003. Esta conversión ocurre en un único adaptador de análisis y
no se repite en repositorios ni consumidores.

El recorrido de lectura es:

1. el caso de uso solicita proyecto y actividades al puerto;
2. Drizzle lee PostgreSQL y los mapeadores reconstruyen `Decimal`;
3. aplicación normaliza porcentajes e invoca `deriveActivity` y
   `consolidateProject`;
4. aplicación convierte los resultados completos, sin redondear magnitudes, a
   los DTO congelados de `src/shared/contract.ts`;
5. A2 podrá transportar ese resultado sin reimplementar reglas EVM.

Crear y reemplazar validan y normalizan antes de escribir. Tras guardar una
actividad, su representación de lectura se deriva desde los datos persistidos.
Cambiar nombre o fecha de corte no entra en ninguna fórmula.

## Validación y estado intacto

Los validadores acumulan todas las comprobaciones independientes:

- ausencia, `null` o nombre vacío después de recortar:
  `required`;
- BAC menor o igual que cero: `positive`;
- AC negativo: `non_negative`;
- porcentajes fuera de 0–100: `range_0_100`;
- cualquier miembro de lectura no editable: `read_only`;
- cualquier propiedad ajena a escritura y lectura: `unknown`, conservando el
  nombre recibido.

Los espacios laterales de `name` se eliminan antes de validar y persistir; los
espacios interiores se conservan. El caso V9 debe producir siete infracciones
sobre seis reglas sin depender de su orden. Como la mutación solo se invoca con
un resultado válido, una petición rechazada conserva el estado anterior.

## Atomicidad y borrado

Eliminar una actividad ejecuta una sola eliminación dirigida por proyecto e
identificador y conserva las hermanas. Eliminar un proyecto ejecuta una sola
sentencia `DELETE`; la FK `ON DELETE CASCADE` elimina sus actividades dentro de
la misma sentencia atómica. La aplicación no coordina borrados descendentes.

La prueba de reversión instala temporalmente en PostgreSQL un trigger de
actividad que provoca una excepción durante la cascada. La sentencia completa
debe fallar y, al releer, proyecto y actividades deben permanecer. El trigger
se retira en la limpieza de prueba; no se añaden hooks de fallo al código de
producción.

## Estrategia de pruebas

Todo comportamiento nuevo sigue RED–GREEN–REFACTOR:

- validación parametrizada contra los trece `validationChecks`, más ausencia y
  `null` para cada campo de `writeSchemas`;
- CRUD y análisis contra PostgreSQL real, usando los valores esperados del
  fixture sin recalcularlos en la prueba;
- ADR-002: modificar individualmente BAC, ambos avances y AC cambia los
  derivados; editar nombre los conserva; esquema y escrituras contienen solo
  datos capturados;
- ADR-005: una sola fecha de corte mutable, sin versiones ni fecha por
  actividad; cambiarla conserva indicadores;
- ADR-008: cascada sin huérfanos, borrado aislado de actividad y reversión ante
  falla durante la cascada;
- ADR-009: acumulación, normalización y estado intacto en la parte de negocio.

Las pruebas existentes de dominio permanecen intactas. La verificación final
incluye suite completa, typecheck, lint, build, `git diff --check`, revisión
estructural del modelo y contraste literal con las secciones `Verificación` de
los ADR aplicables.

## Documento de arquitectura y A2

`docs/ARCHITECTURE.md` se escribe después del código para describir solo el
estado real. En una página incluirá:

- diagrama de capas, flechas permitidas y regla de lint que protege cada una;
- recorrido de `GET /projects/{id}` hasta el dominio y de vuelta;
- ubicación única del cálculo y su motivo;
- tabla que enruta cada frontera a los diez ADR.

Será explícito que los handlers HTTP reales aún no existen y que el recorrido
ejecutable termina en `/mock-api`, pendiente de A2. `ui/` se describirá solo
por sus reglas: no importa capas servidoras, no calcula y presenta lo recibido.

## Riesgos y mitigaciones

- **La escala persistida difiere de la interna del dominio.** Un único adaptador
  0–100 → fracción y pruebas contra el fixture hacen visible la frontera.
- **La acumulación podría escribir parcialmente.** Validación completa antes de
  toda llamada al repositorio y pruebas de estado intacto.
- **La prueba de reversión podría probar un hook artificial.** El fallo se
  provoca en PostgreSQL durante la cascada real, sin modificar producción.
- **A1 podría anticipar HTTP.** Los resultados de aplicación no contienen
  códigos de estado ni envolventes; A2 conserva esa responsabilidad.
- **La documentación podría describir código futuro.** Se redacta al final y
  marca expresamente mock y A2.

## Fuentes y trazabilidad

El cambio OpenSpec enlazará, sin reproducirlas, las reglas canónicas de
`docs/PRD.md`, ADR-001, ADR-002, ADR-003, ADR-005, ADR-007, ADR-008, ADR-009,
`docs/TESTING.md`, `contracts/evm/evm-fixture.json` y
`contracts/evm/openapi.yaml`. Si la implementación revela una contradicción
entre ellas, el trabajo se detiene en lugar de ajustar una fuente cerrada.
