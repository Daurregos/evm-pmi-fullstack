# EVM PMI Fullstack

## 1. Qué es

Este dashboard ayuda a un líder de proyecto a entender si el trabajo avanza según el plan y el presupuesto a partir de una fotografía de sus actividades. Aplica Earned Value Management (EVM) para comparar valor planificado (PV), valor ganado (EV) y costo real (AC), y deriva variaciones, índices y proyecciones sin pedir al usuario que los calcule.

## 2. Puesta en marcha

### Requisitos previos

La secuencia se verificó con estas versiones:

| Herramienta | Versión verificada |
|---|---:|
| Git | 2.43.0 |
| Node.js | 22.22.3 |
| npm | 10.9.8 |
| Docker Engine | 27.4.0 |
| Docker Compose | 2.31.0 |

`package.json` admite Node.js `>=20.19.0`; Node.js 22 es la versión usada localmente y en CI. Los puertos `3000` y `5432` deben estar libres.

### Desde el clon hasta el dashboard

Ejecuta literalmente:

```bash
git clone --branch develop --single-branch https://github.com/Daurregos/evm-pmi-fullstack.git
cd evm-pmi-fullstack
cp .env.example .env.local
npm run env:up
```

`npm run env:up` instala las dependencias bloqueadas con `npm ci`, levanta PostgreSQL 17, aplica las migraciones, carga el [fixture canónico](contracts/evm/evm-fixture.json) y deja Next.js ejecutándose en primer plano. Cuando la terminal muestre `Ready`, abre [http://localhost:3000](http://localhost:3000).

Verás el proyecto de referencia con ocho actividades, sus datos capturados, los indicadores EVM derivados, el consolidado y la gráfica de PV, EV y AC. El selector también permite abrir el proyecto sin actividades.

### Variables de entorno

| Variable | Valor predeterminado | Efecto |
|---|---|---|
| `DATABASE_URL` | `postgres://evm:evm@127.0.0.1:5432/evm` | Conexión del backend, migraciones, semilla y pruebas |
| `NEXT_PUBLIC_EVM_API_BASE_URL` | `/mock-api` | Base HTTP que consume el navegador |
| `MOCK_PORT` | `3000` en `.env.example` | No tiene consumidor en la implementación actual y no cambia ningún puerto |

Los scripts de base de datos leen `DATABASE_URL` del proceso o usan el valor predeterminado; no cargan `.env.local` por sí solos. Next.js sí carga `.env.local`. Al ser pública, `NEXT_PUBLIC_EVM_API_BASE_URL` se incorpora al cliente cuando arranca Next.js.

El dashboard usa el mock del fixture por defecto. Para probar el backend real que sirve el mismo proceso, detén Next.js con `Ctrl+C` —PostgreSQL permanece activo— y ejecuta:

```bash
NEXT_PUBLIC_EVM_API_BASE_URL=/ npm run dev
```

Para volver al mock, detén de nuevo Next.js y ejecuta:

```bash
NEXT_PUBLIC_EVM_API_BASE_URL=/mock-api npm run dev
```

Para apagar el entorno completo:

```bash
# Primero pulsa Ctrl+C en la terminal donde se ejecuta Next.js.
npm run env:down
```

El volumen de PostgreSQL se conserva entre arranques.

## 3. Documentación del API

Con el entorno levantado, Swagger UI está en [http://localhost:3000/api-docs](http://localhost:3000/api-docs). La interfaz carga el mismo contrato versionado que se publica en [`contracts/evm/openapi.yaml`](contracts/evm/openapi.yaml); también se sirve directamente en `http://localhost:3000/api-docs/openapi.yaml`.

## 4. Pruebas y cobertura

Los niveles y sus comandos son:

| Nivel | Comando | Qué comprueba |
|---|---|---|
| Tipos contractuales | `npm run test:types` | La forma compartida de las respuestas |
| Dominio y estructura | `npm run test:structure` | Fórmulas, casos límite y límites entre capas |
| Cliente | `npm run test:client` | Tabla, resumen, gráfica, formularios y flujos de mutación |
| Integración | `npm run test:integration` | Casos de uso, persistencia y transacciones en PostgreSQL |
| Contrato HTTP | `npm run test:contract` | Rutas reales, OpenAPI, errores y mock |
| Política de cobertura | `npm run test:coverage-policy` | Agregación y aplicación de los umbrales |
| Suite completa | `npm test` | Tipos y todos los niveles ejecutables contra PostgreSQL |
| Suite con cobertura | `npm run test:coverage` | Todos los niveles ejecutables instrumentados y sus gates |

La última ejecución exitosa de [`develop`](https://github.com/Daurregos/evm-pmi-fullstack/actions/runs/30458189043) publicó estos valores reales:

| Capa | Líneas | Ramas | Funciones | Sentencias |
|---|---:|---:|---:|---:|
| `domain/` | 100,00 % | 100,00 % | 100,00 % | 100,00 % |
| `application/` | 93,22 % | 90,24 % | 100,00 % | 93,22 % |
| Global | 85,41 % | 92,04 % | 86,87 % | 85,41 % |

Los gates se aplican a las cuatro métricas: `domain/` exige 95 %, `application/` 90 % y el conjunto global 80 %. El dominio concentra las fórmulas, estados y casos límite del fixture, por eso tiene el umbral más alto; aplicación orquesta esas reglas y admite algo más de adaptación; el global incluye HTTP, persistencia e interfaz, donde existen fronteras que requieren otras clases de evidencia. La cobertura de ramas es obligatoria porque una validación o un estado evaluable/no evaluable puede dejar todas sus líneas ejecutadas aunque una alternativa nunca se haya probado. La estrategia y las exclusiones justificadas están en [`docs/TESTING.md`](docs/TESTING.md).

Para regenerar los reportes:

```bash
npm run test:coverage
```

El resumen aparece en la terminal y el informe navegable queda en `coverage/index.html`.

## 5. Integración continua

El [workflow de CI](.github/workflows/ci.yml) se ejecuta en cada pull request y push dirigido a `develop`; las [ejecuciones están en GitHub Actions](https://github.com/Daurregos/evm-pmi-fullstack/actions/workflows/ci.yml). Sobre Node.js 22 y PostgreSQL 17:

1. instala exactamente `package-lock.json`;
2. ejecuta ESLint con cero avisos permitidos;
3. hace cumplir las reglas de imports y límites de capas;
4. comprueba tipos;
5. ejecuta la suite completa instrumentada contra PostgreSQL y aplica los umbrales de cobertura;
6. construye la aplicación con Next.js.

La cobertura se ve en dos lugares de cada ejecución: la tabla de capas aparece en el **resumen del trabajo** y el informe HTML completo se descarga al final de la página como artefacto **`coverage-report`**. Tras descargarlo, abre `index.html`.

## 6. Cómo está construido

```text
UI (Next.js/React) → aplicación → dominio EVM ← infraestructura (HTTP/PostgreSQL)
```

| Elección | Motivo |
|---|---|
| Next.js 16 con React 19 | Sirve dashboard y API en un solo proceso sin duplicar contratos |
| PostgreSQL 17 | Verifica decimales exactos, restricciones y transacciones reales |
| Drizzle ORM 0.45 | Mantiene esquema y migración SQL revisables, incluida la cascada |
| decimal.js 10.6 | Evita errores de punto flotante en cálculo, clasificación y redondeo |
| Recharts 2.15.4 | Cubre la comparación PV/EV/AC con una librería declarativa comprobable |
| Runner nativo de Node.js y c8 | Mantiene una pila de pruebas pequeña y mide líneas, ramas, funciones y sentencias |

El razonamiento y los límites de las capas están en [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## 7. Mapa de documentos

Orden recomendado:

| Orden | Documento | Para qué leerlo |
|---:|---|---|
| 1 | [`docs/PRD.md`](docs/PRD.md) | Alcance, reglas EVM y criterios de aceptación; es la fuente de producto |
| 2 | [`docs/ASSUMPTIONS.md`](docs/ASSUMPTIONS.md) | Supuestos adoptados y su trazabilidad al PRD y los ADR |
| 3 | [`docs/adr/`](docs/adr/) | Decisiones arquitectónicas y técnicas, con alternativas y verificación |
| 4 | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Vista de capas, dependencias permitidas y responsabilidades |
| 5 | [`docs/TESTING.md`](docs/TESTING.md) | Niveles, oráculos, gates y estrategia de cobertura |
| 6 | [Puesta en marcha](#2-puesta-en-marcha) | Guía operativa canónica actual; no existe un `docs/OPERATIONS.md` separado |
| 7 | [`contracts/evm/FIXTURE.md`](contracts/evm/FIXTURE.md) | Cómo leer el oráculo numérico `evm-fixture.json` |
| 8 | [`contracts/evm/openapi.yaml`](contracts/evm/openapi.yaml) | Contrato HTTP publicado y consumido por Swagger |
| 9 | [`docs/ai_process/AI_PROCESS.md`](docs/ai_process/AI_PROCESS.md) | Uso de IA, decisiones humanas e historial de prompts del desarrollo |

## 8. Decisiones y trade-offs

- **Foto vigente en lugar de historial.** Mantiene simples edición, persistencia y API bajo el tiempo disponible; impide tendencias y auditoría temporal.
- **Un proyecto seleccionado en lugar de portafolio.** Profundiza el diagnóstico de un proyecto; deja fuera agregación y comparación entre proyectos.
- **Indicadores derivados solo en el servidor.** Conserva una única verdad EVM y evita divergencias; el cliente depende del contrato para cualquier nueva interpretación.
- **Profundidad verificable antes que amplitud.** Se priorizaron dominio, contrato, edición y pruebas; autenticación, permisos, recuperación e historial quedaron fuera deliberadamente.

## 9. Limitaciones conocidas

- ADR-003 conserva la frase indiferenciada «el avance a porcentaje entero». El glosario del PRD permite entenderla como avance del proyecto, pero corregir el ADR requiere su flujo documental dedicado.
- Un formato de fecha incompatible devuelve `400` con `violations: []`, sin identificar el campo; un BAC negativo devuelve `422` con `field: "bac"` y `rule: "positive"`. Los dos casos son contractuales, pero el primero ofrece menos ayuda a la persona usuaria.
- Recharts está fijado en 2.15.4 porque la versión 3 mueve el trazado a efectos y dejaría RF-09 sin la cobertura actual basada en render estático.
- Las deudas menores de interfaz incluyen `window.confirm` para borrado, ausencia de reintento automático de una vista desactualizada y pruebas React que no ejercitan efectos, el evento real del selector ni `showModal`.
- `EAC = BAC / CPI` extrapola la eficiencia de costos observada; es una de varias fórmulas posibles en PMI y no modela supuestos alternativos.
- SPI converge a 1 cuando todo el alcance termina, aunque el proyecto haya terminado tarde, y no sustituye un análisis de ruta crítica.
- Todo el diagnóstico depende del avance real reportado, que sigue siendo una estimación humana.
- La **curva S** —PV, EV y AC acumulados por periodo— es la evolución de mayor valor diagnóstico. Requiere historial temporal, hoy fuera de alcance por [ADR-005](docs/adr/005-modelo-temporal-foto-unica-historial.md).
