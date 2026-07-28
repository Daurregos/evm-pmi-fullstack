# Phase 0 Project Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar un andamiaje Next.js con PostgreSQL, Drizzle, fronteras automatizadas, mock y semilla ejecutables, sin lógica EVM en `src/`.

**Architecture:** El dominio solo expone la política decimal y firmas sin cuerpo; application define un repositorio único; infrastructure implementa PostgreSQL, mapeo, mock y semilla; App Router expone únicamente handlers mock. ESLint materializa las fronteras y las pruebas ejercitan PostgreSQL real y la superficie HTTP contra el fixture.

**Tech Stack:** Node.js 22, npm, TypeScript 7, Next.js 16, React 19, decimal.js 10, Drizzle ORM/Kit, PostgreSQL 17, Docker Compose, ESLint 10, Node Test Runner y GitHub Actions.

---

## Mapa de archivos

- `package.json`, `package-lock.json`: dependencias fijadas y comandos públicos.
- `tsconfig.json`, `next-env.d.ts`, `next.config.ts`: compilación Next/TypeScript.
- `.env.example`, `docker-compose.yml`, `drizzle.config.ts`: entorno PostgreSQL.
- `eslint.config.mjs`: límites de imports y política decimal de `src/`.
- `src/domain/decimal.ts`: configuración decimal y redondeo de presentación.
- `src/domain/derive-magnitudes.ts`: firma de la primitiva futura.
- `src/domain/derive-activity.ts`: firma futura que delegará en la primitiva.
- `src/domain/derive-project.ts`: firma futura que sumará y delegará.
- `src/domain/evm-types.ts`: magnitudes y forma de resultados, sin entidades.
- `src/application/evm-repository.ts`: único puerto de persistencia.
- `src/infrastructure/database/schema.ts`: dos tablas Drizzle.
- `src/infrastructure/database/client.ts`: creación y cierre del cliente.
- `src/infrastructure/database/drizzle-evm-repository.ts`: implementación del
  puerto.
- `src/infrastructure/database/map-activity-row.ts`: conversión unidireccional
  de fila a valores con `Decimal`.
- `src/infrastructure/database/seed.ts`: proyección idempotente del fixture.
- `src/infrastructure/mock/fixture.ts`: carga y limpieza recursiva del fixture.
- `src/infrastructure/mock/responses.ts`: selección de respuestas mock.
- `src/app/projects/route.ts`, `src/app/projects/[projectId]/route.ts`: handlers
  HTTP mock.
- `src/shared/contract.ts`, `src/shared/errors.ts`: formas compartidas mínimas.
- `drizzle/0000_phase_0.sql`, `drizzle/meta/*`: migración generada.
- `scripts/env-up.sh`, `scripts/test.sh`: orquestación local.
- `scripts/seed.ts`: entrada ejecutable de la semilla.
- `scripts/run-contract-tests.ts`: ciclo de vida de Next durante contrato.
- `scripts/verify-decimal.mjs`: sonda preexistente movida y anotada.
- `tests/domain/architecture.test.ts`: reglas estructurales y decimal.
- `tests/domain/migration.test.ts`: inspección del SQL generado.
- `tests/integration/decimal-roundtrip.test.ts`: frontera `numeric`/`Decimal`.
- `tests/integration/seed.test.ts`: fidelidad e idempotencia.
- `tests/contract/mock-http.test.ts`: respuestas HTTP del fixture.
- `tests/client/README.md`, `src/ui/README.md`: nivel reservado sin fingir
  implementación.
- `.github/workflows/ci.yml`: verificación con PostgreSQL.
- `README.md`: elecciones tecnológicas, comandos y deuda conocida.

Las tareas canónicas están en
`openspec/changes/phase-0-project-scaffold/tasks.md`; este plan solo detalla su
ejecución. Las fuentes cerradas se consultan y no se modifican.

### Task 1: Base reproducible, estructura y sonda

**Files:**
- Create: `package.json`
- Create: `package-lock.json`
- Create: `tsconfig.json`
- Create: `next-env.d.ts`
- Create: `next.config.ts`
- Create: `.env.example`
- Modify: `.gitignore`
- Create: `src/ui/README.md`
- Create: `tests/client/README.md`
- Modify: `README.md`
- Move: `verify-decimal.mjs` to `scripts/verify-decimal.mjs`

- [ ] **Step 1: Crear el manifiesto reproducible**

Escribir `package.json` con contenido exacto:

```json
{
  "name": "evm-pmi-fullstack",
  "version": "0.0.0",
  "private": true,
  "engines": {
    "node": ">=20.19.0"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "env:up": "bash scripts/env-up.sh",
    "env:down": "docker compose down",
    "db:generate": "drizzle-kit generate --name phase_0",
    "db:migrate": "drizzle-kit migrate",
    "db:seed": "tsx scripts/seed.ts",
    "lint": "eslint .",
    "lint:imports": "node --import tsx --test tests/domain/architecture.test.ts",
    "typecheck": "tsc --noEmit",
    "test:structure": "node --import tsx --test tests/domain/*.test.ts",
    "test:integration": "node --import tsx --test tests/integration/*.test.ts",
    "test:contract": "tsx scripts/run-contract-tests.ts",
    "test": "bash scripts/test.sh"
  },
  "dependencies": {
    "decimal.js": "10.6.0",
    "drizzle-orm": "0.45.2",
    "next": "16.2.12",
    "pg": "8.22.0",
    "react": "19.2.8",
    "react-dom": "19.2.8"
  },
  "devDependencies": {
    "@types/node": "22.20.1",
    "@types/pg": "8.20.0",
    "@types/react": "19.2.17",
    "@types/react-dom": "19.2.3",
    "drizzle-kit": "0.31.10",
    "eslint": "10.8.0",
    "eslint-config-next": "16.2.12",
    "tsx": "4.23.1",
    "typescript": "7.0.2"
  }
}
```

Run: `npm install --package-lock-only`

Expected: `package-lock.json` actualizado sin cambios en fuentes cerradas.

- [ ] **Step 2: Crear configuración TypeScript/Next**

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "src/**/*.ts", "src/**/*.tsx", "scripts/**/*.ts", "tests/**/*.ts", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "scripts/verify-decimal.mjs"]
}
```

`next-env.d.ts`:

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

`next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

`.env.example`:

```dotenv
DATABASE_URL=postgres://evm:evm@127.0.0.1:5432/evm
MOCK_PORT=3000
```

Actualizar `.gitignore` a:

```gitignore
.worktrees/
node_modules/
.next/
.env
*.tsbuildinfo
```

- [ ] **Step 3: Mover y anotar la sonda sin refactorizarla**

Run:

```bash
mkdir -p scripts
mv ../../verify-decimal.mjs scripts/verify-decimal.mjs
```

Insertar inmediatamente después del shebang:

```js
// Sonda de viabilidad de una sola ejecución, ya satisfecha. Su implementación
// es deliberadamente independiente de src/ y se retirará en el primer slice de fase 1.
```

No cambiar ninguna otra línea del archivo. Confirmar:

Run: `git diff --no-index /dev/null scripts/verify-decimal.mjs | sed -n '1,16p'`

Expected: shebang, nueva nota y comentario original; la sonda no aparece en
ningún script `test*`.

- [ ] **Step 4: Crear marcadores sin componentes**

`src/ui/README.md`:

```markdown
# UI

Componentes de cliente. Presentan payloads recibidos y no calculan indicadores.
La fase 0 no incluye componentes.
```

`tests/client/README.md`:

```markdown
# Pruebas de cliente

Este nivel probará el dashboard contra la API simulada. La fase 0 no implementa
interfaz y no añade casos artificiales.
```

- [ ] **Step 5: Registrar README**

`README.md` debe contener:

```markdown
# evm-pmi-fullstack

## Elecciones tecnológicas

| Elección | Motivo |
|---|---|
| Next.js App Router | Mantiene frontend y backend en un repositorio y un proceso. |
| PostgreSQL en Docker | Prueba tipos decimales y transacciones reales. |
| Drizzle ORM | `numeric` llega como cadena y se convierte explícitamente al `Decimal` configurado por el dominio; sus migraciones SQL permiten revisar `ON DELETE CASCADE`. |
| decimal.js | Proporciona aritmética decimal base diez según ADR-003. |

## Comandos

- `npm run env:up`: instala, levanta PostgreSQL, migra, siembra y arranca el mock.
- `npm run env:down`: detiene PostgreSQL.
- `npm run db:seed`: carga el fixture.
- `npm test`: ejecuta la suite completa contra PostgreSQL.

## Deuda conocida

`scripts/verify-decimal.mjs` es una sonda de viabilidad independiente, ya
satisfecha y excluida de pruebas y CI. Se archivará o eliminará en el primer
slice de fase 1, cuando el dominio cubra el fixture, los empates y el viaje JSON.
```

- [ ] **Step 6: Instalar y verificar configuración**

Run: `npm ci`

Expected: instalación exitosa con Node `>=20.19.0`.

Run: `npm run typecheck`

Expected: puede fallar únicamente porque todavía no existen scripts/fuentes
referenciados; no por incompatibilidad de versiones.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json tsconfig.json next-env.d.ts next.config.ts .env.example README.md src/ui/README.md tests/client/README.md scripts/verify-decimal.mjs
git commit -m "chore: add reproducible phase 0 base"
```

### Task 2: Fronteras, política decimal y firmas

**Files:**
- Create: `eslint.config.mjs`
- Create: `tests/domain/architecture.test.ts`
- Create: `src/domain/decimal.ts`
- Create: `src/domain/evm-types.ts`
- Create: `src/domain/derive-magnitudes.ts`
- Create: `src/domain/derive-activity.ts`
- Create: `src/domain/derive-project.ts`
- Create: `src/application/evm-repository.ts`
- Create: `src/shared/contract.ts`
- Create: `src/shared/errors.ts`

- [ ] **Step 1: Escribir la prueba estructural fallida**

Crear `tests/domain/architecture.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { ESLint } from "eslint";

const eslint = new ESLint({ cwd: process.cwd() });

async function rulesFor(code: string, filePath: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.map(({ ruleId }) => ruleId ?? "");
}

test("domain rejects infrastructure and Next imports", async () => {
  const rules = await rulesFor(
    'import "next/server"; import "@/infrastructure/database/schema";',
    "src/domain/invalid.ts",
  );
  assert.ok(rules.includes("no-restricted-imports"));
});

test("ui rejects server layers", async () => {
  const rules = await rulesFor('import "@/domain/decimal";', "src/ui/invalid.ts");
  assert.ok(rules.includes("no-restricted-imports"));
});

test("application rejects concrete infrastructure", async () => {
  const rules = await rulesFor(
    'import "@/infrastructure/database/schema";',
    "src/application/invalid.ts",
  );
  assert.ok(rules.includes("no-restricted-imports"));
});

test("decimal calls are rejected outside the authorized module", async () => {
  const rules = await rulesFor(
    "value.toDecimalPlaces(2); value.toFixed(2); Decimal.set({ precision: 20 });",
    "src/infrastructure/invalid.ts",
  );
  assert.equal(rules.filter((rule) => rule === "no-restricted-syntax").length, 3);
});
```

Run: `node --import tsx --test tests/domain/architecture.test.ts`

Expected: FAIL porque `eslint.config.mjs` aún no materializa las reglas.

- [ ] **Step 2: Configurar ESLint con overrides exactos**

Crear `eslint.config.mjs`:

```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const layerPatterns = {
  domain: ["@/app/**", "@/ui/**", "@/infrastructure/**", "next", "next/**", "drizzle-orm", "drizzle-orm/**", "pg"],
  ui: ["@/domain/**", "@/application/**", "@/infrastructure/**"],
  application: ["@/app/**", "@/ui/**", "@/infrastructure/**", "next", "next/**", "drizzle-orm", "drizzle-orm/**", "pg"],
};

const decimalSelectors = [
  "CallExpression[callee.object.name='Decimal'][callee.property.name='set']",
  "CallExpression[callee.property.name='toDecimalPlaces']",
  "CallExpression[callee.property.name='toDP']",
  "CallExpression[callee.property.name='toFixed']",
  "CallExpression[callee.property.name='toPrecision']",
  "CallExpression[callee.property.name='toSignificantDigits']",
  "CallExpression[callee.property.name='toSD']",
  "CallExpression[callee.property.name='toNearest']",
].map((selector) => ({ selector, message: "Use src/domain/decimal.ts." }));

export default defineConfig([
  ...nextVitals,
  globalIgnores([".next/**", "node_modules/**", "drizzle/meta/**", "scripts/verify-decimal.mjs"]),
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    rules: { "no-restricted-syntax": ["error", ...decimalSelectors] },
  },
  {
    files: ["src/domain/decimal.ts"],
    rules: { "no-restricted-syntax": "off" },
  },
  ...Object.entries(layerPatterns).map(([layer, patterns]) => ({
    files: [`src/${layer}/**/*.ts`, `src/${layer}/**/*.tsx`],
    rules: {
      "no-restricted-imports": ["error", { patterns }],
    },
  })),
]);
```

Run: `node --import tsx --test tests/domain/architecture.test.ts`

Expected: 4 tests PASS.

- [ ] **Step 3: Crear el módulo decimal único**

`src/domain/decimal.ts`:

```ts
import Decimal from "decimal.js";

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export { Decimal };

export function roundForPresentation(value: Decimal.Value): Decimal {
  return new Decimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}
```

- [ ] **Step 4: Crear tipos y firmas sin cuerpo**

`src/domain/evm-types.ts`:

```ts
import type { Decimal } from "./decimal";

export type EvmMagnitudes = Readonly<{ bac: Decimal; pv: Decimal; ev: Decimal; ac: Decimal }>;
export type CapturedActivity = Readonly<{
  name: string;
  bac: Decimal;
  plannedProgress: Decimal;
  actualProgress: Decimal;
  ac: Decimal;
}>;
export type EvmDerivedResult = Readonly<Record<
  "pv" | "ev" | "cv" | "sv" | "cpi" | "spi" | "eac" | "vac",
  unknown
>> & Readonly<{ state: unknown }>;
```

`src/domain/derive-magnitudes.ts`:

```ts
import type { EvmDerivedResult, EvmMagnitudes } from "./evm-types";

/** Fase 1: primitiva pura que derivará indicadores y estado desde magnitudes. */
export type DeriveMagnitudes = (input: EvmMagnitudes) => EvmDerivedResult;
```

`src/domain/derive-activity.ts`:

```ts
import type { CapturedActivity, EvmDerivedResult } from "./evm-types";
import type { DeriveMagnitudes } from "./derive-magnitudes";

/** Fase 1: obtendrá PV/EV desde porcentajes y llamará a DeriveMagnitudes. */
export type DeriveActivity = (
  input: CapturedActivity,
  deriveMagnitudes: DeriveMagnitudes,
) => EvmDerivedResult;
```

`src/domain/derive-project.ts`:

```ts
import type { CapturedActivity, EvmDerivedResult } from "./evm-types";
import type { DeriveMagnitudes } from "./derive-magnitudes";

/** Fase 1: sumará magnitudes y llamará a la misma DeriveMagnitudes. */
export type DeriveProject = (
  activities: readonly CapturedActivity[],
  deriveMagnitudes: DeriveMagnitudes,
) => EvmDerivedResult;
```

- [ ] **Step 5: Crear el único puerto y tipos compartidos**

`src/application/evm-repository.ts`:

```ts
import type { Decimal } from "@/domain/decimal";

export type ProjectRecord = Readonly<{ id: number; name: string; cutoffDate: string }>;
export type ActivityRecord = Readonly<{
  id: number;
  projectId: number;
  name: string;
  bac: Decimal;
  plannedProgress: Decimal;
  actualProgress: Decimal;
  ac: Decimal;
}>;

export interface EvmRepository {
  saveProject(project: ProjectRecord): Promise<void>;
  saveActivity(activity: ActivityRecord): Promise<void>;
  findActivity(id: number): Promise<ActivityRecord | null>;
}
```

`src/shared/errors.ts`:

```ts
export const errorCodes = ["malformed_request", "not_found", "validation_failed"] as const;
export type ErrorCode = (typeof errorCodes)[number];
```

`src/shared/contract.ts`:

```ts
import type { ErrorCode } from "./errors";

export type Violation = Readonly<{ field: string; rule: string; message: string }>;
export type ErrorEnvelope = Readonly<{
  code: ErrorCode;
  message: string;
  violations: readonly Violation[];
}>;
export type ProjectListItem = Readonly<{ id: number; name: string }>;
```

- [ ] **Step 6: Verificar y commit**

Run: `npm run lint && npm run lint:imports && npm run typecheck`

Expected: lint sin errores, 4 pruebas estructurales PASS y TypeScript PASS.

Run: `rg -n 'Decimal\\.set|toDecimalPlaces|toFixed|toPrecision|toSignificantDigits|toNearest' src`

Expected: solo dos coincidencias ejecutables en `src/domain/decimal.ts`; las
firmas contienen cero expresiones EVM.

```bash
git add eslint.config.mjs tests/domain/architecture.test.ts src/domain src/application src/shared
git commit -m "chore: enforce source boundaries and decimal policy"
```

### Task 3: PostgreSQL, esquema y migración

**Files:**
- Create: `docker-compose.yml`
- Create: `drizzle.config.ts`
- Create: `src/infrastructure/database/schema.ts`
- Create: `src/infrastructure/database/client.ts`
- Create: `tests/domain/migration.test.ts`
- Generate: `drizzle/0000_phase_0.sql`
- Generate: `drizzle/meta/*`

- [ ] **Step 1: Crear PostgreSQL y configuración Drizzle**

`docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: evm
      POSTGRES_USER: evm
      POSTGRES_PASSWORD: evm
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U evm -d evm"]
      interval: 2s
      timeout: 3s
      retries: 20
    volumes:
      - evm_postgres_data:/var/lib/postgresql/data

volumes:
  evm_postgres_data:
```

`drizzle.config.ts`:

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/infrastructure/database/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://evm:evm@127.0.0.1:5432/evm",
  },
});
```

- [ ] **Step 2: Escribir la prueba de migración antes del esquema**

`tests/domain/migration.test.ts`:

```ts
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const path = "drizzle/0000_phase_0.sql";

test("migration contains only captured persistence with database cascade", async () => {
  const sql = (await readFile(path, "utf8")).toLowerCase();
  assert.equal((sql.match(/create table/g) ?? []).length, 2);
  assert.equal((sql.match(/numeric\\(38,\\s*18\\)/g) ?? []).length, 4);
  assert.match(sql, /on delete cascade/);
  for (const forbidden of ["pv", "ev", "cv", "sv", "cpi", "spi", "eac", "vac", "interpretation", "status"]) {
    assert.doesNotMatch(sql, new RegExp(`"${forbidden}"`));
  }
  assert.doesNotMatch(sql, /"activities"[^;]*"cutoff_date"/s);
});
```

Run: `node --import tsx --test tests/domain/migration.test.ts`

Expected: FAIL con `ENOENT drizzle/0000_phase_0.sql`.

- [ ] **Step 3: Crear esquema y cliente**

`src/infrastructure/database/schema.ts`:

```ts
import { date, integer, numeric, pgTable, serial, text } from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cutoffDate: date("cutoff_date").notNull(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  bac: numeric("bac", { precision: 38, scale: 18 }).notNull(),
  plannedProgress: numeric("planned_progress", { precision: 38, scale: 18 }).notNull(),
  actualProgress: numeric("actual_progress", { precision: 38, scale: 18 }).notNull(),
  ac: numeric("ac", { precision: 38, scale: 18 }).notNull(),
});
```

`src/infrastructure/database/client.ts`:

```ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export function createDatabase(url = process.env.DATABASE_URL) {
  if (!url) throw new Error("DATABASE_URL es obligatoria.");
  const pool = new Pool({ connectionString: url });
  return { db: drizzle({ client: pool, schema }), pool };
}
```

- [ ] **Step 4: Generar y leer la migración**

Run: `npm run db:generate`

Expected: `drizzle/0000_phase_0.sql` y metadata creados.

Run: `sed -n '1,240p' drizzle/0000_phase_0.sql`

Expected: dos `CREATE TABLE`, cuatro `numeric(38, 18)` y FK con
`ON DELETE cascade`.

Run: `node --import tsx --test tests/domain/migration.test.ts`

Expected: PASS.

- [ ] **Step 5: Aplicar en PostgreSQL y commit**

Run: `docker compose up -d --wait`

Run: `npm run db:migrate`

Expected: migración aplicada a PostgreSQL 17 sin SQLite.

```bash
git add docker-compose.yml drizzle.config.ts drizzle src/infrastructure/database/schema.ts src/infrastructure/database/client.ts tests/domain/migration.test.ts
git commit -m "feat: add PostgreSQL schema and cascade migration"
```

### Task 4: Repositorio Drizzle y round-trip decimal

**Files:**
- Create: `src/infrastructure/database/map-activity-row.ts`
- Create: `src/infrastructure/database/drizzle-evm-repository.ts`
- Create: `tests/integration/decimal-roundtrip.test.ts`

- [ ] **Step 1: Escribir la prueba de integración fallida**

Crear `tests/integration/decimal-roundtrip.test.ts`:

```ts
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { eq } from "drizzle-orm";
import { Decimal } from "@/domain/decimal";
import { createDatabase } from "@/infrastructure/database/client";
import { activities, projects } from "@/infrastructure/database/schema";
import { DrizzleEvmRepository } from "@/infrastructure/database/drizzle-evm-repository";

const client = createDatabase();
const repository = new DrizzleEvmRepository(client.db);
const projectId = 900001;
const activityId = 900001;

before(async () => {
  await client.db.insert(projects).values({ id: projectId, name: "Round trip", cutoffDate: "2026-07-28" });
});

after(async () => {
  await client.db.delete(projects).where(eq(projects.id, projectId));
  await client.pool.end();
});

test("numeric round-trip reconstructs the original Decimal", async () => {
  const original = new Decimal("1234567890.123456789012345678");
  await repository.saveActivity({
    id: activityId,
    projectId,
    name: "Decimal",
    bac: original,
    plannedProgress: new Decimal("12.500000000000000001"),
    actualProgress: new Decimal("10.25"),
    ac: new Decimal("2.75"),
  });
  const raw = await client.db.select({ bac: activities.bac }).from(activities).where(eq(activities.id, activityId));
  const loaded = await repository.findActivity(activityId);
  assert.equal(raw[0]?.bac, "1234567890.123456789012345678");
  assert.ok(loaded);
  assert.ok(loaded.bac.eq(original));
});
```

Run: `node --import tsx --test tests/integration/decimal-roundtrip.test.ts`

Expected: FAIL porque repositorio y mapeador no existen.

- [ ] **Step 2: Implementar el mapeador unidireccional**

`src/infrastructure/database/map-activity-row.ts`:

```ts
import type { ActivityRecord } from "@/application/evm-repository";
import { Decimal } from "@/domain/decimal";
import type { activities } from "./schema";

type ActivityRow = typeof activities.$inferSelect;

export function mapActivityRow(row: ActivityRow): ActivityRecord {
  return {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    bac: new Decimal(row.bac),
    plannedProgress: new Decimal(row.plannedProgress),
    actualProgress: new Decimal(row.actualProgress),
    ac: new Decimal(row.ac),
  };
}
```

- [ ] **Step 3: Implementar el único repositorio**

`src/infrastructure/database/drizzle-evm-repository.ts`:

```ts
import type { ActivityRecord, EvmRepository, ProjectRecord } from "@/application/evm-repository";
import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { activities, projects } from "./schema";
import * as schema from "./schema";
import { mapActivityRow } from "./map-activity-row";

export class DrizzleEvmRepository implements EvmRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async saveProject(project: ProjectRecord): Promise<void> {
    await this.db.insert(projects).values(project).onConflictDoUpdate({
      target: projects.id,
      set: { name: project.name, cutoffDate: project.cutoffDate },
    });
  }

  async saveActivity(activity: ActivityRecord): Promise<void> {
    const values = {
      ...activity,
      bac: activity.bac.toString(),
      plannedProgress: activity.plannedProgress.toString(),
      actualProgress: activity.actualProgress.toString(),
      ac: activity.ac.toString(),
    };
    await this.db.insert(activities).values(values).onConflictDoUpdate({
      target: activities.id,
      set: values,
    });
  }

  async findActivity(id: number): Promise<ActivityRecord | null> {
    const [row] = await this.db.select().from(activities).where(eq(activities.id, id));
    return row ? mapActivityRow(row) : null;
  }
}
```

- [ ] **Step 4: Verificar y commit**

Run: `npm run db:migrate && node --import tsx --test tests/integration/decimal-roundtrip.test.ts`

Expected: 1 test PASS y cadena exacta de 18 decimales.

Run: `npm run lint && npm run typecheck`

Expected: PASS.

```bash
git add src/infrastructure/database tests/integration/decimal-roundtrip.test.ts
git commit -m "feat: map PostgreSQL numeric values to Decimal"
```

### Task 5: Mock HTTP desde el fixture

**Files:**
- Create: `src/infrastructure/mock/fixture.ts`
- Create: `src/infrastructure/mock/responses.ts`
- Create: `src/app/projects/route.ts`
- Create: `src/app/projects/[projectId]/route.ts`
- Create: `tests/contract/mock-http.test.ts`
- Create: `scripts/run-contract-tests.ts`

- [ ] **Step 1: Escribir pruebas HTTP fallidas**

`tests/contract/mock-http.test.ts` debe cargar el fixture y contener:

```ts
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const baseUrl = process.env.MOCK_BASE_URL ?? "http://127.0.0.1:3100";
const fixture = JSON.parse(await readFile("contracts/evm/evm-fixture.json", "utf8"));

function strip(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(strip);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).filter(([key]) => !key.startsWith("$")).map(([key, item]) => [key, strip(item)]),
    );
  }
  return value;
}

test("GET /projects comes from collectionResponse", async () => {
  const response = await fetch(`${baseUrl}/projects`);
  assert.equal(response.status, fixture.collectionResponse.expectedStatus);
  assert.deepEqual(await response.json(), fixture.collectionResponse.expectedBody);
});

test("GET /projects/1 strips fixture metadata recursively", async () => {
  const response = await fetch(`${baseUrl}/projects/1`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), strip(fixture.readResponse));
});

test("GET /projects/2 serves emptyProject", async () => {
  const response = await fetch(`${baseUrl}/projects/2`);
  assert.deepEqual(await response.json(), strip(fixture.emptyProject));
});

const errorScenarios = Object.entries(fixture.errorEnvelopes)
  .filter(([scenario]) => !scenario.startsWith("$")) as Array<[string, any]>;

for (const [scenario, expected] of errorScenarios) {
  test(`mock error ${scenario}`, async () => {
    const response = await fetch(`${baseUrl}/projects`, { headers: { "x-mock-scenario": scenario } });
    assert.equal(response.status, expected.expectedStatus);
    assert.deepEqual(await response.json(), expected.expectedBody);
  });
}
```

Run: `MOCK_BASE_URL=http://127.0.0.1:3100 node --import tsx --test tests/contract/mock-http.test.ts`

Expected: FAIL con conexión rechazada porque Next no está levantado.

- [ ] **Step 2: Implementar carga y respuestas**

`src/infrastructure/mock/fixture.ts`:

```ts
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export async function loadFixture(): Promise<any> {
  return JSON.parse(await readFile(resolve(process.cwd(), "contracts/evm/evm-fixture.json"), "utf8"));
}

export function stripFixtureMetadata(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripFixtureMetadata);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !key.startsWith("$"))
        .map(([key, item]) => [key, stripFixtureMetadata(item)]),
    );
  }
  return value;
}
```

`src/infrastructure/mock/responses.ts`:

```ts
import { loadFixture, stripFixtureMetadata } from "./fixture";

export async function mockError(scenario: string | null): Promise<Response | null> {
  const fixture = await loadFixture();
  const selected = scenario ? fixture.errorEnvelopes[scenario] : undefined;
  return selected ? Response.json(selected.expectedBody, { status: selected.expectedStatus }) : null;
}

export async function mockCollection(): Promise<Response> {
  const fixture = await loadFixture();
  return Response.json(fixture.collectionResponse.expectedBody, { status: fixture.collectionResponse.expectedStatus });
}

export async function mockProject(projectId: string): Promise<Response> {
  const fixture = await loadFixture();
  if (projectId === "1") return Response.json(stripFixtureMetadata(fixture.readResponse));
  if (projectId === "2") return Response.json(stripFixtureMetadata(fixture.emptyProject));
  const missing = fixture.errorEnvelopes.notFound;
  return Response.json(missing.expectedBody, { status: missing.expectedStatus });
}
```

- [ ] **Step 3: Crear handlers delgados**

`src/app/projects/route.ts`:

```ts
import { mockCollection, mockError } from "@/infrastructure/mock/responses";

export async function GET(request: Request): Promise<Response> {
  return (await mockError(request.headers.get("x-mock-scenario"))) ?? mockCollection();
}
```

`src/app/projects/[projectId]/route.ts`:

```ts
import { mockError, mockProject } from "@/infrastructure/mock/responses";

export async function GET(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
): Promise<Response> {
  const error = await mockError(request.headers.get("x-mock-scenario"));
  if (error) return error;
  return mockProject((await context.params).projectId);
}
```

- [ ] **Step 4: Crear runner HTTP y verificar**

`scripts/run-contract-tests.ts`:

```ts
import { spawn } from "node:child_process";

const port = "3100";
const baseUrl = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", port], {
  stdio: "inherit",
  env: { ...process.env },
});

async function waitForServer(): Promise<void> {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/projects`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("El mock no inició.");
}

try {
  await waitForServer();
  const tests = spawn(process.execPath, ["--import", "tsx", "--test", "tests/contract/mock-http.test.ts"], {
    stdio: "inherit",
    env: { ...process.env, MOCK_BASE_URL: baseUrl },
  });
  const code = await new Promise<number>((resolve) => tests.once("exit", (value) => resolve(value ?? 1)));
  process.exitCode = code;
} finally {
  server.kill("SIGTERM");
}
```

Run: `npm run test:contract`

Expected: 6 tests PASS (colección, dos proyectos y tres errores).

- [ ] **Step 5: Commit**

```bash
git add src/infrastructure/mock src/app tests/contract scripts/run-contract-tests.ts
git commit -m "feat: serve fixture-backed contract mock"
```

### Task 6: Semilla idempotente

**Files:**
- Create: `src/infrastructure/database/seed.ts`
- Create: `scripts/seed.ts`
- Create: `tests/integration/seed.test.ts`

- [ ] **Step 1: Escribir la prueba de semilla fallida**

`tests/integration/seed.test.ts`:

```ts
import assert from "node:assert/strict";
import { after, test } from "node:test";
import { sql } from "drizzle-orm";
import { createDatabase } from "@/infrastructure/database/client";
import { seedFixture } from "@/infrastructure/database/seed";

const client = createDatabase();
after(() => client.pool.end());

test("fixture seed is captured-only and idempotent", async () => {
  await seedFixture(client.db);
  await seedFixture(client.db);
  const projects = await client.db.execute(sql`select count(*)::int as count from projects where id in (1, 2)`);
  const activities = await client.db.execute(sql`select count(*)::int as count from activities where id between 1 and 8`);
  assert.equal(projects.rows[0]?.count, 2);
  assert.equal(activities.rows[0]?.count, 8);
  const columns = await client.db.execute(sql`
    select column_name from information_schema.columns
    where table_name = 'activities' order by ordinal_position
  `);
  assert.deepEqual(columns.rows.map((row) => row.column_name), [
    "id", "project_id", "name", "bac", "planned_progress", "actual_progress", "ac",
  ]);
});
```

Run: `node --import tsx --test tests/integration/seed.test.ts`

Expected: FAIL porque `seedFixture` no existe.

- [ ] **Step 2: Implementar la proyección de semilla**

`src/infrastructure/database/seed.ts`:

```ts
import { readFile } from "node:fs/promises";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { Decimal } from "@/domain/decimal";
import { DrizzleEvmRepository } from "./drizzle-evm-repository";
import * as schema from "./schema";

export async function seedFixture(db: NodePgDatabase<typeof schema>): Promise<void> {
  const fixture = JSON.parse(await readFile("contracts/evm/evm-fixture.json", "utf8"));
  const repository = new DrizzleEvmRepository(db);
  await repository.saveProject(fixture.readResponse.project);
  await repository.saveProject(fixture.emptyProject.project);
  for (const activity of fixture.readResponse.activities) {
    await repository.saveActivity({
      id: activity.id,
      projectId: fixture.readResponse.project.id,
      name: activity.name,
      bac: new Decimal(activity.bac),
      plannedProgress: new Decimal(activity.plannedProgress),
      actualProgress: new Decimal(activity.actualProgress),
      ac: new Decimal(activity.ac),
    });
  }
  await db.execute(sql`select setval(pg_get_serial_sequence('projects', 'id'), (select max(id) from projects), true)`);
  await db.execute(sql`select setval(pg_get_serial_sequence('activities', 'id'), (select max(id) from activities), true)`);
}
```

`scripts/seed.ts`:

```ts
import { createDatabase } from "@/infrastructure/database/client";
import { seedFixture } from "@/infrastructure/database/seed";

const client = createDatabase();
try {
  await seedFixture(client.db);
  console.log("Fixture sembrado: 2 proyectos y 8 actividades.");
} finally {
  await client.pool.end();
}
```

- [ ] **Step 3: Verificar dos ejecuciones**

Run: `npm run db:seed && npm run db:seed`

Expected twice: `Fixture sembrado: 2 proyectos y 8 actividades.`

Run: `node --import tsx --test tests/integration/seed.test.ts`

Expected: 1 test PASS.

- [ ] **Step 4: Commit**

```bash
git add src/infrastructure/database/seed.ts scripts/seed.ts tests/integration/seed.test.ts
git commit -m "feat: seed captured fixture data"
```

### Task 7: Operación local y CI

**Files:**
- Create: `scripts/env-up.sh`
- Create: `scripts/test.sh`
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Crear guion de entorno completo**

`scripts/env-up.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

npm ci
docker compose up -d --wait
npm run db:migrate
npm run db:seed
exec npm run dev -- --hostname 0.0.0.0
```

Run: `chmod +x scripts/env-up.sh`

- [ ] **Step 2: Crear suite completa contra PostgreSQL**

`scripts/test.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

docker compose up -d --wait
npm run db:migrate
npm run test:structure
npm run test:integration
npm run test:contract
```

Run: `chmod +x scripts/test.sh`

- [ ] **Step 3: Crear CI**

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
    branches: [develop]
  push:
    branches: [develop]

jobs:
  verify:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:17-alpine
        env:
          POSTGRES_DB: evm
          POSTGRES_USER: evm
          POSTGRES_PASSWORD: evm
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U evm -d evm"
          --health-interval 2s
          --health-timeout 3s
          --health-retries 20
    env:
      DATABASE_URL: postgres://evm:evm@127.0.0.1:5432/evm
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run db:migrate
      - run: npm run lint
      - run: npm run lint:imports
      - run: npm run typecheck
      - run: npm run test:structure
      - run: npm run test:integration
      - run: npm run test:contract
```

Confirmar que `verify-decimal` no aparece:

Run: `rg -n 'verify-decimal' package.json .github scripts/test.sh`

Expected: cero coincidencias.

- [ ] **Step 4: Probar camino local de clonación**

Run: `npm run env:down`

Run: `npm run env:up`

Expected: instala, PostgreSQL queda healthy, migración y semilla terminan y Next
escucha en `http://127.0.0.1:3000`.

En otra terminal:

Run: `curl --fail --silent http://127.0.0.1:3000/projects`

Expected: arreglo exacto de dos elementos del fixture.

Detener Next con `Ctrl-C`, conservar PostgreSQL para las verificaciones.

- [ ] **Step 5: Commit**

```bash
git add scripts/env-up.sh scripts/test.sh .github/workflows/ci.yml package.json package-lock.json
git commit -m "ci: automate phase 0 environment and verification"
```

### Task 8: Verificación completa, trazabilidad y OpenSpec

**Files:**
- Modify: `openspec/changes/phase-0-project-scaffold/tasks.md`
- Review: all files in the branch

- [ ] **Step 1: Ejecutar verificación fresca completa**

Run:

```bash
npm run lint
npm run lint:imports
npm run typecheck
npm test
git diff --check
```

Expected: todos exit 0; la salida de pruebas incluye arquitectura, migración,
round-trip, semilla y seis casos HTTP.

- [ ] **Step 2: Verificar literalmente migración y ausencia de fórmulas**

Run:

```bash
sed -n '1,240p' drizzle/0000_phase_0.sql
rg -n 'numeric\\(38, 18\\)|ON DELETE cascade' drizzle/0000_phase_0.sql
rg -n 'Decimal\\.set|toDecimalPlaces|toFixed|toPrecision|toSignificantDigits|toNearest' src
rg -n 'pv|ev|cv|sv|cpi|spi|eac|vac' src/infrastructure/database/schema.ts drizzle/0000_phase_0.sql
```

Expected:

- cuatro `numeric(38, 18)` y una cascada en SQL;
- configuración y redondeo solo en `src/domain/decimal.ts`;
- ninguna columna derivada;
- las únicas menciones EVM en dominio son nombres de tipos/firmas y comentarios,
  nunca expresiones.

- [ ] **Step 3: Auditar fuentes cerradas y cambios preservados**

Run:

```bash
git diff origin/develop -- docs/PRD.md docs/ASSUMPTIONS.md docs/adr docs/TESTING.md AGENTS.md contracts/evm/openapi.yaml contracts/evm/evm-fixture.json
git status --short
git diff --name-only origin/develop
```

Expected: primer comando sin salida; estado solo contiene cambios deliberados de
fase 0; no aparecen archivos ajenos del worktree original.

- [ ] **Step 4: Marcar tareas OpenSpec con evidencia**

Cambiar cada checkbox satisfecho en
`openspec/changes/phase-0-project-scaffold/tasks.md` de `- [ ]` a `- [x]` solo
después de ejecutar su comando literal. No marcar una tarea cuya evidencia no
se haya observado.

Run: `openspec validate phase-0-project-scaffold --strict`

Expected: change valid.

- [ ] **Step 5: Preparar archivos nuevos y comprobar whitespace**

Run con las rutas reales nuevas:

```bash
git add -N -- package.json package-lock.json tsconfig.json next-env.d.ts next.config.ts .env.example eslint.config.mjs docker-compose.yml drizzle.config.ts README.md src tests scripts .github drizzle
git diff --check
```

Expected: sin salida.

- [ ] **Step 6: Commit de trazabilidad**

```bash
git add openspec/changes/phase-0-project-scaffold/tasks.md
git commit -m "docs: record phase 0 verification"
```

- [ ] **Step 7: Revisión antes del cierre**

Invocar `superpowers:requesting-code-review`, resolver cada hallazgo con
`superpowers:receiving-code-review` cuando corresponda y repetir todos los
comandos del Step 1. Después invocar
`superpowers:verification-before-completion`.

No archivar OpenSpec hasta que la revisión y la verificación fresca sean
exitosas. Archivar con `openspec-archive-change` como commit lógico separado y
confirmar que el PR, si se crea por solicitud del usuario, apunta a `develop`.
