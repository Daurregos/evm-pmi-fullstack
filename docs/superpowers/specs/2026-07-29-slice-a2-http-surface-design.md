# Slice A2: superficie HTTP y contrato de errores

**Estado:** aprobado para convertir en cambio OpenSpec

## Objetivo

Implementar la superficie HTTP real descrita por
`contracts/evm/openapi.yaml` sobre los casos de uso y la persistencia de A1.
La capa nueva traduce entre HTTP y aplicación; no incorpora reglas de negocio
ni cálculos EVM.

## Alcance

El cambio añade las ocho operaciones publicadas:

- listar, crear, consultar, reemplazar y eliminar proyectos;
- crear, reemplazar y eliminar actividades anidadas.

Las rutas reales viven bajo `src/app/projects/`. Los adaptadores de transporte,
la composición de los casos de uso y la conexión con PostgreSQL viven bajo
`src/infrastructure/`. El mock bajo `/mock-api` permanece intacto como doble
del cliente.

También se reemplaza únicamente el recorrido pendiente de A2 en
`docs/ARCHITECTURE.md`. No se modifican PRD, supuestos, ADR, OpenAPI, fixture,
dominio, aplicación, `shared`, UI ni el mock.

## Arquitectura

Cada archivo de ruta de Next.js es un adaptador delgado. Extrae los parámetros
de ruta, solicita a infraestructura una instancia de `EvmUseCases`, delega la
lectura o mutación y convierte su resultado en una respuesta HTTP.

Infraestructura concentra tres responsabilidades:

1. Componer `EvmUseCases` con `DrizzleEvmRepository` y una conexión PostgreSQL
   reutilizable.
2. Interpretar el cuerpo JSON y comprobar solo la estructura que ADR-009 asigna
   a esta capa.
3. Traducir resultados de aplicación a respuestas de éxito o a la envolvente
   común de error.

Las rutas no importan el dominio ni reproducen fórmulas. El adaptador HTTP no
normaliza nombres, no evalúa restricciones numéricas y no clasifica campos
desconocidos o de solo lectura; esas decisiones permanecen en A1.

## Flujo de datos

Una lectura agregada recorre:

`HTTP → ruta Next.js → EvmUseCases.getProjectAnalysis → EvmRepository →
PostgreSQL → aplicación → dominio → DTO → respuesta JSON`.

Una escritura recorre:

`HTTP → parser estructural → caso de uso A1 → repositorio → PostgreSQL →
representación de lectura → respuesta JSON`.

Crear un proyecto responde con su representación de lectura, sin análisis.
Crear o reemplazar una actividad responde con sus indicadores derivados por
A1. Reemplazar un proyecto responde con su representación de lectura y no
recalcula indicadores. Los borrados exitosos responden `204` sin cuerpo.

## Interpretación y errores

El parser exige un cuerpo JSON cuyo valor raíz sea un objeto. JSON malformado,
un valor raíz incompatible, un valor no nulo de tipo incompatible en un campo
conocido o un `cutoffDate` no conforme al formato `date` producen `400
malformed_request` con `violations: []`.

Dos casos atraviesan deliberadamente la validación estructural:

- `null` en campos conocidos obligatorios, para que A1 produzca `422 required`;
- propiedades no reconocidas, para que A1 produzca `422 unknown` o
  `422 read_only`.

Las ausencias y restricciones de negocio también llegan a A1, que acumula sus
infracciones. Un resultado `validation` se convierte en `422
validation_failed`; `not_found` se convierte en `404 not_found`. Los tres
errores incluyen `code`, `message` y `violations`, y nunca exponen excepciones,
trazas ni detalles de Next.js o PostgreSQL.

## Pruebas

Las pruebas contractuales arrancan el API real, preparan PostgreSQL y cargan
directamente `contracts/evm/evm-fixture.json` como oráculo. Cubren:

- las ocho operaciones y sus códigos y cuerpos;
- la colección desnuda y su caso vacío;
- el cuerpo exacto de la lectura agregada, sin metadatos `$`;
- los trece `validationChecks`, incluida la acumulación de siete infracciones
  de V9 sin depender de su orden;
- ausencia y `null` de cada campo de `writeSchemas`;
- JSON malformado y tipos o formatos incompatibles como `400`;
- recursos inexistentes como `404`;
- presencia de mensajes sin fijar su redacción;
- estado idéntico al fixture después de escrituras rechazadas;
- ausencia de rutas planas o de indicadores y reemplazo total mediante `PUT`.

Las pruebas existentes del mock siguen ejecutándose para demostrar que el
doble del cliente no cambió. La suite completa, lint, build, revisión
estructural y las verificaciones de ADR-006a, ADR-006b, ADR-007 y ADR-009 son
condiciones de cierre.

## Alternativas descartadas

Duplicar parsing y mapeo de errores en cada ruta reduciría el número de módulos,
pero permitiría que operaciones equivalentes diverjan. Incorporar un validador
genérico o generar handlers desde OpenAPI añadiría dependencias y abstracción
para un contrato pequeño cuyas dos excepciones estructurales son deliberadas.
Se prefiere un adaptador compartido explícito, pequeño y probado.
