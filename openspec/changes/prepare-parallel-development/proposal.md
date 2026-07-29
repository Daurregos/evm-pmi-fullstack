## Why

Backend y frontend empezarán a evolucionar en paralelo, pero hoy colisionarían
en las rutas HTTP del mock y en tipos compartidos incompletos. Además, la suite
de dominio omite una de las cuatro estrategias negativas que el fixture ya
publica para proteger la consolidación de todas las actividades.

## What Changes

- Añadir la aserción negativa
  `negativeChecks.cpiExcludingZeroAcActivity` y eliminar expectativas
  duplicadas cuando el mismo valor ya reside en el fixture.
- **BREAKING** para consumidores del mock local: moverlo de `/projects` a
  `/mock-api/projects`, dejando libres las rutas contractuales reales.
- Resolver la base del cliente mediante `NEXT_PUBLIC_EVM_API_BASE_URL`, con
  `/mock-api` como valor predeterminado y soporte para rutas relativas o URL
  absolutas.
- Completar en `src/shared/` los tipos de lectura, escritura, colección,
  índices y errores derivados del OpenAPI y del fixture, y comprobar por tipos
  que la lectura del fixture satisface la envolvente completa.
- Declarar `src/shared/` cerrado durante la fase paralela y documentar el
  prefijo y la configuración del mock.
- Alinear la guía del fixture y la estrategia de pruebas con las cuatro
  comprobaciones negativas, sin modificar PRD, ADR, fixture ni OpenAPI.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `evm-domain-calculation`: la consolidación rechaza explícitamente también la
  estrategia que excluye actividades con EV positivo y AC cero.
- `project-scaffold`: el mock usa un prefijo reservado y configurable, las
  rutas reales quedan libres y la frontera compartida contiene el contrato
  completo y cerrado para el trabajo paralelo.

## Impact

El cambio afecta pruebas de dominio y tipos, handlers App Router del mock, su
runner contractual, configuración del cliente, `src/shared/`, documentación y
artefactos OpenSpec. No añade dependencias ni implementa rutas reales,
persistencia, casos de uso, validación o componentes de UI.
