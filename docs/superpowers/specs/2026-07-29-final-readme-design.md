# Diseño del README definitivo y visibilidad de cobertura

**Fecha:** 2026-07-29

**Base:** `origin/develop` en `d87ee61ff82aec24087673eb529afeae321e9a5c`

**Rama:** `docs/final-readme`

## Objetivo

Entregar un `README.md` que permita a una persona sin contexto clonar el
repositorio, levantarlo en menos de tres minutos y ver el dashboard con datos
sin consultar otro documento. La misma entrega incorpora el material existente
de `docs/ai_process/` y hace visible la cobertura de CI en el resumen de GitHub
Actions y como artefacto descargable.

## Alcance

Se modifican únicamente:

- `README.md`;
- `.github/workflows/ci.yml`;
- los tres archivos existentes que el usuario aportó en `docs/ai_process/`;
- esta especificación y el plan de ejecución exigidos por el flujo de trabajo
  del repositorio.

No cambia el producto, el dominio EVM, la arquitectura, el contrato HTTP, el
fixture ni las pruebas. Por tanto, no se abre un cambio OpenSpec: el trabajo es
documental y de presentación de evidencia ya generada por CI, no una
modificación de comportamiento de producto o implementación.

Se preservan los demás archivos no rastreados del worktree principal y la rama
local `chore/code-quality-pass`.

## README orientado al evaluador

El documento reemplaza el seguimiento técnico acumulado por nueve secciones
ordenadas según el recorrido de evaluación:

1. **Qué es.** Dos frases: el problema que resuelve y el uso de Earned Value
   Management para comparar valor planificado, valor ganado y costo real.
2. **Puesta en marcha.** Requisitos con las versiones exactas verificadas,
   secuencia copiable desde `git clone` hasta `http://localhost:3000`, resultado
   visible, variables de entorno y sus valores por defecto, alternancia entre
   mock y backend real, y apagado.
3. **Documentación del API.** Swagger en
   `http://localhost:3000/api-docs` y fuente en
   `contracts/evm/openapi.yaml`.
4. **Pruebas y cobertura.** Comandos por nivel y suite completa, porcentajes
   reales, umbrales diferenciados, motivo de medir ramas y generación del
   informe HTML.
5. **Integración continua.** Enlaces al workflow y a sus ejecuciones, puertas
   reales y ubicación de la cobertura en el resumen y en el artefacto.
6. **Cómo está construido.** Diagrama textual de una línea y tabla de
   elecciones tecnológicas.
7. **Mapa de documentos.** Orden recomendado y autoridad de PRD, ASSUMPTIONS,
   ADR, ARCHITECTURE, TESTING, guía operativa, FIXTURE y OpenAPI.
8. **Decisiones y trade-offs.** Cuatro decisiones como máximo.
9. **Limitaciones conocidas.** Deudas registradas, límites metodológicos y
   curva S como evolución diferida.

El README enlaza las fuentes canónicas en vez de reproducir sus reglas. Como no
existe `docs/OPERATIONS.md`, la fila de operaciones apunta a la sección
**Puesta en marcha** del propio README y declara que esa es la guía operativa
canónica actual; no se crea un enlace roto ni un documento fuera del alcance.

## Puesta en marcha verificable

La guía distingue requisitos exigidos de versiones usadas en la verificación:

| Herramienta | Versión verificada |
|---|---:|
| Git | 2.43.0 |
| Node.js | 22.22.3 |
| npm | 10.9.8 |
| Docker Engine | 27.4.0 |
| Docker Compose | 2.31.0 |

`package.json` exige Node.js `>=20.19.0`; el README recomienda Node.js 22 y
publica las versiones exactas con las que se repite la secuencia.

La secuencia base será:

```bash
git clone https://github.com/Daurregos/evm-pmi-fullstack.git
cd evm-pmi-fullstack
cp .env.example .env.local
npm run env:up
```

`npm run env:up` ejecuta `npm ci`, levanta PostgreSQL, aplica migraciones,
siembra `contracts/evm/evm-fixture.json` y deja Next.js en primer plano. Con la
configuración predeterminada, el cliente consulta `/mock-api` y muestra en
`http://localhost:3000` el proyecto de referencia con ocho actividades.

Las variables documentadas serán:

| Variable | Valor predeterminado | Uso |
|---|---|---|
| `DATABASE_URL` | `postgres://evm:evm@127.0.0.1:5432/evm` | PostgreSQL real |
| `NEXT_PUBLIC_EVM_API_BASE_URL` | `/mock-api` | Base HTTP consumida por el cliente |
| `MOCK_PORT` | `3000` | Declarada en `.env.example`, pero sin consumidor en el código actual |

El README aclara que los scripts de migración y semilla usan el valor de
`DATABASE_URL` exportado en el proceso o su fallback; no cargan
`.env.local` por sí solos. `MOCK_PORT` no cambia ningún puerto en la
implementación vigente: el dashboard usa el puerto 3000 de Next.js y el runner
contractual fija internamente el 3100.

Para cambiar al backend real del mismo proceso se detiene solo Next.js con
`Ctrl+C` y se ejecuta:

```bash
NEXT_PUBLIC_EVM_API_BASE_URL=/ npm run dev
```

Para apagar todo el entorno:

```bash
# primero Ctrl+C en la terminal donde corre Next.js
npm run env:down
```

La validación final repetirá literalmente la secuencia desde un estado limpio,
comprobará el dashboard y Swagger mediante HTTP y apagará el entorno.

## Pruebas y cobertura

El README documentará los comandos existentes, sin alias inventados:

| Nivel | Comando |
|---|---|
| Tipos | `npm run test:types` |
| Estructura y dominio | `npm run test:structure` |
| Cliente | `npm run test:client` |
| Integración | `npm run test:integration` |
| Contrato HTTP | `npm run test:contract` |
| Política de cobertura | `npm run test:coverage-policy` |
| Suite completa contra PostgreSQL | `npm test` |
| Suite completa instrumentada | `npm run test:coverage` |

La última ejecución exitosa de CI sobre la base registró:

| Capa | Líneas | Ramas | Funciones | Sentencias |
|---|---:|---:|---:|---:|
| `domain/` | 100,00 % | 100,00 % | 100,00 % | 100,00 % |
| `application/` | 93,22 % | 90,24 % | 100,00 % | 93,22 % |
| Global | 85,41 % | 92,04 % | 86,87 % | 85,41 % |

Los mínimos son 95 % para las cuatro métricas de `domain/`, 90 % para las de
`application/` y 80 % global. La explicación enlaza `docs/TESTING.md` y resume
que el dominio concentra fórmulas y casos límite, aplicación orquesta reglas y
el global incluye adaptadores e interfaz. Las ramas son obligatorias porque los
estados evaluable/no evaluable, validaciones y límites pueden conservar alta
cobertura de líneas aunque una alternativa nunca se ejecute.

El informe HTML se genera con `npm run test:coverage` y se abre desde
`coverage/index.html`.

## Integración continua

`.github/workflows/ci.yml` conserva PostgreSQL 17 y Node.js 22, nombra cada paso
y ejecuta, en este orden:

1. instalación con `npm ci`;
2. lint con `npm run lint -- --max-warnings 0`;
3. reglas de imports con `npm run lint:imports`;
4. tipos con `npm run typecheck`;
5. cobertura y suite ejecutable completa con `npm run test:coverage`, guardando
   su salida para el resumen;
6. publicación de la tabla en `$GITHUB_STEP_SUMMARY`, incluso si la puerta de
   cobertura falla después de generar el reporte;
7. carga de `coverage/` mediante `actions/upload-artifact@v4`, con nombre
   `coverage-report`, también bajo `if: always()`;
8. construcción con `npm run build`.

El pipeline conserva el código de salida de cobertura mediante `pipefail`.
Cuando no exista tabla, el resumen indica que la cobertura no pudo generarse en
vez de publicar datos vacíos. El artefacto exige archivos: una ausencia se
reporta como error.

El README enlaza:

- el archivo `.github/workflows/ci.yml`;
- `https://github.com/Daurregos/evm-pmi-fullstack/actions/workflows/ci.yml`.

## Construcción y fuentes documentales

El diagrama de una línea será:

```text
UI (Next.js/React) → aplicación → dominio EVM ← infraestructura (HTTP/PostgreSQL)
```

La tabla tecnológica incluye Next.js, PostgreSQL, Drizzle ORM, `decimal.js`,
Recharts y el runner nativo de Node.js con `c8`, un motivo breve por elección.

El mapa recomienda leer primero el PRD, después ASSUMPTIONS y ADR, luego
ARCHITECTURE y TESTING, la puesta en marcha, y finalmente FIXTURE y OpenAPI.
Cada fila explica la autoridad del documento sin copiar sus contenidos.

## Decisiones, trade-offs y limitaciones

Los cuatro trade-offs serán:

- una foto vigente por proyecto en vez de historial;
- un proyecto seleccionado en vez de portafolio;
- indicadores calculados en servidor en vez de duplicados en cliente;
- profundidad de dominio, contrato y pruebas en vez de autenticación y
  capacidades fuera del alcance.

Las limitaciones incluyen explícitamente:

- la frase indiferenciada sobre «avance» que permanece en ADR-003;
- el `400` de fecha inválida con `violations` vacío y sin campo, frente al
  `422` de BAC negativo con `field` y `rule`;
- Recharts fijado en 2.15.4 para conservar la cobertura de RF-09;
- `window.confirm`, ausencia de reintento automático y cobertura de cliente
  basada en render estático como deudas menores de interfaz;
- `EAC = BAC / CPI` como una extrapolación entre varias fórmulas PMI;
- convergencia de SPI a 1 al terminar aunque el proyecto llegue tarde;
- dependencia del avance real estimado por personas;
- curva S como evolución de mayor valor diagnóstico que requiere historial por
  periodo y revisar ADR-005.

## Material de proceso de IA

Se incorporan los tres archivos locales existentes:

- `docs/ai_process/AI_PROCESS.md`;
- `docs/ai_process/Prompt log - Init EVM Research.md`;
- `docs/ai_process/Prompt log - Product Specs.md`.

Su contenido se preserva; no se reescriben afirmaciones personales ni el
historial de prompts. Solo se permiten correcciones de rutas internas si son
necesarias para que los enlaces apunten a la ubicación real.

## Verificación

La entrega no se declara completa hasta obtener evidencia fresca de:

1. `git diff --check` incluyendo cada archivo nuevo con `git add -N`;
2. lint sin avisos, imports, tipos, cobertura, suite completa y build;
3. porcentajes locales iguales a los publicados o una explicación verificable
   de cualquier diferencia;
4. dashboard con datos en `http://localhost:3000`;
5. Swagger con respuesta `200` en `http://localhost:3000/api-docs`;
6. contrato con respuesta `200` en
   `http://localhost:3000/api-docs/openapi.yaml`;
7. workflow válido, resumen de cobertura y definición del artefacto;
8. diff limitado al alcance aprobado y preservación del trabajo local ajeno;
9. rama basada en `origin/develop` y cualquier PR dirigido a `develop`.
