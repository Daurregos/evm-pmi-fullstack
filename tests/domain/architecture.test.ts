import assert from "node:assert/strict";
import { test } from "node:test";
import { ESLint } from "eslint";

const projectRoot = process.cwd();
const eslint = new ESLint({ cwd: projectRoot });
const typedProbePaths = new Set([
  "src/infrastructure/invalid.ts",
  "src/infrastructure/valid.ts",
]);
const typedProbeEslint = new ESLint({
  cwd: projectRoot,
  overrideConfig: [
    {
      files: [...typedProbePaths],
      languageOptions: {
        parserOptions: {
          projectService: {
            allowDefaultProject: [...typedProbePaths],
          },
          tsconfigRootDir: projectRoot,
        },
      },
    },
  ],
});
const syntaxProbeEslint = new ESLint({
  cwd: projectRoot,
  overrideConfig: [
    {
      files: ["src/**/*.ts", "src/**/*.tsx"],
      languageOptions: {
        parserOptions: {
          projectService: false,
        },
      },
      rules: {
        "phase0/decimal-policy": "off",
      },
    },
  ],
});

async function rulesFor(code: string, filePath: string): Promise<string[]> {
  const probeEslint = typedProbePaths.has(filePath)
    ? typedProbeEslint
    : filePath === "src/domain/decimal.ts"
      ? eslint
      : syntaxProbeEslint;
  const [result] = await probeEslint.lintText(code, { filePath });
  return result.messages.map(({ ruleId }) => ruleId ?? "");
}

async function assertRestrictedImport(
  code: string,
  filePath: string,
): Promise<void> {
  const rules = await rulesFor(code, filePath);
  assert.ok(
    rules.includes("no-restricted-imports"),
    `Expected no-restricted-imports for ${filePath}: ${code}`,
  );
}

async function assertRestrictedBy(
  ruleId: string,
  code: string,
  filePath: string,
): Promise<void> {
  const rules = await rulesFor(code, filePath);
  assert.ok(
    rules.includes(ruleId),
    `Expected ${ruleId} for ${filePath}: ${code}`,
  );
}

test("the App Router config disables the pages-only link rule", async () => {
  const config = await eslint.calculateConfigForFile(
    "tests/domain/decimal.test.ts",
  );

  assert.equal(config?.rules?.["@next/next/no-html-link-for-pages"]?.[0], 0);
});

test("scripts and contracts are outside source prohibitions", async () => {
  for (const filePath of ["scripts/seed.ts", "contracts/probe.ts"]) {
    const config = await eslint.calculateConfigForFile(filePath);
    assert.notEqual(config?.rules?.["phase0/source-boundaries"]?.[0], 2);
    assert.notEqual(config?.rules?.["phase0/decimal-policy"]?.[0], 2);
  }
});

test("domain rejects forbidden layers through aliases", async () => {
  for (const source of [
    "@/app/projects/route",
    "@/ui/dashboard",
    "@/infrastructure/database/schema",
  ]) {
    await assertRestrictedImport(`import "${source}";`, "src/domain/invalid.ts");
  }
});

test("domain rejects forbidden layers through relative paths", async () => {
  for (const source of [
    "../app/projects/route",
    "../ui/dashboard",
    "../infrastructure/database/schema",
  ]) {
    await assertRestrictedImport(`import "${source}";`, "src/domain/invalid.ts");
  }
});

test("domain rejects framework, database, and filesystem imports", async () => {
  for (const source of [
    "next",
    "next/server",
    "drizzle-orm",
    "drizzle-orm/pg-core",
    "pg",
    "fs",
    "fs/promises",
    "node:fs",
    "node:fs/promises",
  ]) {
    await assertRestrictedImport(`import "${source}";`, "src/domain/invalid.ts");
  }
});

test("ui rejects server layers through aliases", async () => {
  for (const source of [
    "@/domain/decimal",
    "@/application/evm-repository",
    "@/infrastructure/database/schema",
  ]) {
    await assertRestrictedImport(`import "${source}";`, "src/ui/invalid.ts");
  }
});

test("ui rejects server layers through relative paths", async () => {
  for (const source of [
    "../domain/decimal",
    "../application/evm-repository",
    "../infrastructure/database/schema",
  ]) {
    await assertRestrictedImport(`import "${source}";`, "src/ui/invalid.ts");
  }
});

test("application rejects forbidden layers through aliases", async () => {
  for (const source of [
    "@/app/projects/route",
    "@/ui/dashboard",
    "@/infrastructure/database/schema",
  ]) {
    await assertRestrictedImport(
      `import "${source}";`,
      "src/application/invalid.ts",
    );
  }
});

test("application rejects forbidden layers through relative paths", async () => {
  for (const source of [
    "../app/projects/route",
    "../ui/dashboard",
    "../infrastructure/database/schema",
  ]) {
    await assertRestrictedImport(
      `import "${source}";`,
      "src/application/invalid.ts",
    );
  }
});

test("application rejects concrete framework and database imports", async () => {
  for (const source of [
    "next",
    "next/server",
    "drizzle-orm",
    "drizzle-orm/pg-core",
    "pg",
  ]) {
    await assertRestrictedImport(
      `import "${source}";`,
      "src/application/invalid.ts",
    );
  }
});

test("Decimal configuration, quantization, and presentation calls are rejected by type", async () => {
  const calls = [
    "Decimal.set({ precision: 20 })",
    "Decimal.config({ precision: 20 })",
    'Decimal["clone"]({ precision: 20 })',
    "Decimal.round(value)",
    'Decimal["floor"](value)',
    "Decimal.ceil(value)",
    'Decimal["trunc"](value)',
    "value.toDecimalPlaces(2)",
    'value["toDP"](2)',
    "value.toExponential(2, Decimal.ROUND_HALF_UP)",
    "value.toFixed(2)",
    "value.toPrecision(2)",
    "value.toSignificantDigits(2)",
    "value.toSD(2)",
    "value.toNearest(1)",
    "value.ceil()",
    "value.floor()",
    "value.round()",
    "value.truncated()",
    "value.trunc()",
    "value.toInteger()",
    "value.dividedToIntegerBy(2)",
    "value.divToInt(2)",
    "value.toBinary(2, Decimal.ROUND_HALF_UP)",
    "value.toHexadecimal(2, Decimal.ROUND_HALF_UP)",
    "value.toHex(2, Decimal.ROUND_HALF_UP)",
    "value.toOctal(2, Decimal.ROUND_HALF_UP)",
    'new Decimal("1.2").toExponential(2, Decimal.ROUND_HALF_UP)',
    'new Decimal("1").plus(1).toFixed(2)',
    "Decimal.add(1, 2).toFixed(2)",
    "activity.bac.toFixed(2)",
    "decimalValue().toFixed(2)",
    "declared.toFixed(2)",
    "((parameter: Decimal) => parameter.toFixed(2))(value)",
  ];
  const rules = await rulesFor(
    [
      'import { Decimal } from "@/domain/decimal";',
      "interface ActivityRecord { bac: Decimal }",
      "declare const activity: ActivityRecord;",
      "declare const declared: Decimal;",
      "declare const value: Decimal;",
      "declare function decimalValue(): Decimal;",
      `${calls.join(";\n")};`,
    ].join("\n"),
    "src/infrastructure/invalid.ts",
  );

  assert.equal(
    rules.filter((rule) => rule === "phase0/decimal-policy").length,
    calls.length,
  );
});

test("extracted and bound Decimal policy methods are rejected by type", async () => {
  const rules = await rulesFor(
    [
      'import { Decimal } from "@/domain/decimal";',
      "declare const value: Decimal;",
      "const { set } = Decimal;",
      "set({ precision: 20 });",
      "const format = value.toFixed;",
      "format(2);",
      "const bound = value.toFixed.bind(value);",
      "bound(2);",
      "let configure: typeof Decimal.set;",
      "({ set: configure } = Decimal);",
      "configure({ precision: 20 });",
    ].join("\n"),
    "src/infrastructure/invalid.ts",
  );

  assert.equal(
    rules.filter((rule) => rule === "phase0/decimal-policy").length,
    4,
  );
});

test("Decimal methods destructured from typed parameters are rejected", async () => {
  const rules = await rulesFor(
    [
      'import { Decimal } from "@/domain/decimal";',
      "declare const value: Decimal;",
      "function format({ toFixed }: Decimal) {",
      "  return toFixed.call(value, 2);",
      "}",
      "function configure({ set }: typeof Decimal) {",
      "  set({ precision: 20 });",
      "}",
      "const formatDefault = ({ toPrecision }: Decimal = value) =>",
      "  toPrecision.call(value, 2);",
      "const configureRest = ({ set, ...rest }: typeof Decimal) => {",
      "  set({ precision: 20 });",
      "  return rest;",
      "};",
      "function formatRestParameter(",
      "  ...[{ toExponential }]: [Decimal]",
      ") {",
      "  return toExponential.call(value, 2);",
      "}",
    ].join("\n"),
    "src/infrastructure/invalid.ts",
  );

  assert.equal(
    rules.filter((rule) => rule === "phase0/decimal-policy").length,
    5,
  );
});

test("nested Decimal destructuring is rejected recursively", async () => {
  const rules = await rulesFor(
    [
      'import { Decimal } from "@/domain/decimal";',
      "declare const decimal: Decimal;",
      "declare const wrapped: { value: Decimal };",
      "declare const wrappedList: readonly [{ value: Decimal }];",
      "function nestedParameter(",
      "  { value: { toFixed } }: { value: Decimal }",
      ") {",
      "  return toFixed.call(decimal, 2);",
      "}",
      "const { value: { toPrecision } } = wrapped;",
      "toPrecision.call(decimal, 2);",
      "let assigned: Decimal[\"toFixed\"];",
      "({ value: { toFixed: assigned } } = wrapped);",
      "assigned.call(decimal, 2);",
      "const [{ value: { toExponential } }] = wrappedList;",
      "toExponential.call(decimal, 2);",
    ].join("\n"),
    "src/infrastructure/invalid.ts",
  );

  assert.equal(
    rules.filter((rule) => rule === "phase0/decimal-policy").length,
    4,
  );
});

test("for-of Decimal destructuring is rejected", async () => {
  const rules = await rulesFor(
    [
      'import { Decimal } from "@/domain/decimal";',
      "declare const decimal: Decimal;",
      "declare const decimalValues: readonly Decimal[];",
      "for (const { toFixed } of decimalValues) {",
      "  toFixed.call(decimal, 2);",
      "}",
      "let toPrecision: Decimal[\"toPrecision\"];",
      "for ({ toPrecision } of decimalValues) {",
      "  toPrecision.call(decimal, 2);",
      "}",
      "async function inspect(values: AsyncIterable<Decimal>) {",
      "  for await (const { toExponential } of values) {",
      "    toExponential.call(decimal, 2);",
      "  }",
      "}",
    ].join("\n"),
    "src/infrastructure/invalid.ts",
  );

  assert.equal(
    rules.filter((rule) => rule === "phase0/decimal-policy").length,
    3,
  );
});

test("Decimal computed policy methods resolve through const aliases", async () => {
  const rules = await rulesFor(
    [
      'import { Decimal } from "@/domain/decimal";',
      "declare const value: Decimal;",
      'const instanceMethod = "toFixed";',
      "const instanceAlias = instanceMethod;",
      "value[instanceAlias](2);",
      'const staticMethod = "set";',
      "const staticAlias = staticMethod;",
      "Decimal[staticAlias]({ precision: 20 });",
    ].join("\n"),
    "src/infrastructure/invalid.ts",
  );

  assert.equal(
    rules.filter((rule) => rule === "phase0/decimal-policy").length,
    2,
  );
});

test("unknown computed methods are rejected on Decimal receivers", async () => {
  const rules = await rulesFor(
    [
      'import { Decimal } from "@/domain/decimal";',
      "declare const value: Decimal;",
      "declare const instanceMethod: string;",
      "declare const staticMethod: string;",
      "value[instanceMethod](2);",
      "Decimal[staticMethod]({ precision: 20 });",
      "const { [instanceMethod]: instanceExtracted } = value;",
      "const { [staticMethod]: staticExtracted } = Decimal;",
      "void instanceExtracted;",
      "void staticExtracted;",
    ].join("\n"),
    "src/infrastructure/invalid.ts",
  );

  assert.equal(
    rules.filter((rule) => rule === "phase0/decimal-policy").length,
    4,
  );
});

test("decimal.js imports are rejected outside the authorized module", async () => {
  for (const filePath of [
    "src/domain/invalid.ts",
    "src/application/invalid.ts",
    "src/infrastructure/invalid.ts",
    "src/shared/invalid.ts",
  ]) {
    await assertRestrictedImport('import Decimal from "decimal.js";', filePath);
  }
});

test("the decimal module may own only its authorized decimal operations", async () => {
  const allowedRules = await rulesFor(
    [
      'import Decimal from "decimal.js";',
      "Decimal.set({ precision: 40 })",
      "const value = new Decimal(1);",
      "value.toDecimalPlaces(2)",
      "const configuredSet = Decimal.set.bind(Decimal);",
      "configuredSet({ precision: 40 });",
      "const quantize = value.toDecimalPlaces.bind(value);",
      "quantize(2);",
      'const setMethod = "set";',
      "Decimal[setMethod]({ precision: 40 });",
      'const quantizeMethod = "toDecimalPlaces";',
      "value[quantizeMethod](2);",
      'import("decimal.js/decimal.mjs");',
      'require("decimal.js/decimal.mjs");',
    ].join("\n"),
    "src/domain/decimal.ts",
  );
  assert.ok(!allowedRules.includes("no-restricted-imports"));
  assert.ok(!allowedRules.includes("no-restricted-syntax"));
  assert.ok(!allowedRules.includes("phase0/decimal-policy"));

  const forbiddenRules = await rulesFor(
    [
      'import Decimal from "decimal.js";',
      "new Decimal(1).toFixed(2)",
    ].join("\n"),
    "src/domain/decimal.ts",
  );
  assert.ok(forbiddenRules.includes("phase0/decimal-policy"));
});

const decimalModuleBoundaryCases = [
  {
    name: "decimal module still rejects Next imports",
    code: 'import "next/server";',
  },
  {
    name: "decimal module still rejects infrastructure aliases",
    code: 'import "@/infrastructure/database/schema";',
  },
  {
    name: "decimal module still rejects filesystem imports",
    code: 'import "node:fs";',
  },
];

for (const { name, code } of decimalModuleBoundaryCases) {
  test(name, async () => {
    await assertRestrictedBy(
      "no-restricted-imports",
      code,
      "src/domain/decimal.ts",
    );
  });
}

const normalizedBoundaryCases = [
  {
    name: "domain rejects duplicate-slash relative paths",
    code: 'import "..//app/x";',
    filePath: "src/domain/invalid.ts",
  },
  {
    name: "domain rejects alias traversal into app",
    code: 'import "@/domain/../app/x";',
    filePath: "src/domain/invalid.ts",
  },
  {
    name: "domain rejects literal dynamic app imports",
    code: 'import("@/app/x");',
    filePath: "src/domain/invalid.ts",
  },
  {
    name: "ui rejects alias traversal into domain",
    code: 'import "@/ui/../domain/x";',
    filePath: "src/ui/invalid.ts",
  },
  {
    name: "ui rejects duplicate-slash relative application paths",
    code: 'import "..//application/x";',
    filePath: "src/ui/invalid.ts",
  },
  {
    name: "ui rejects literal dynamic infrastructure imports",
    code: 'import("@/infrastructure/x");',
    filePath: "src/ui/invalid.ts",
  },
  {
    name: "application rejects alias traversal into app",
    code: 'import "@/application/../app/x";',
    filePath: "src/application/invalid.ts",
  },
  {
    name: "application rejects duplicate-slash relative infrastructure paths",
    code: 'import "..//infrastructure/x";',
    filePath: "src/application/invalid.ts",
  },
  {
    name: "application rejects literal dynamic UI imports",
    code: 'import("@/ui/x");',
    filePath: "src/application/invalid.ts",
  },
];

for (const { name, code, filePath } of normalizedBoundaryCases) {
  test(name, async () => {
    await assertRestrictedBy("phase0/source-boundaries", code, filePath);
  });
}

test("dynamic decimal.js imports are rejected outside decimal.ts", async () => {
  await assertRestrictedBy(
    "no-restricted-syntax",
    'import("decimal.js");',
    "src/infrastructure/invalid.ts",
  );
});

test("dynamic decimal.js subpath imports are rejected outside decimal.ts", async () => {
  await assertRestrictedBy(
    "phase0/source-boundaries",
    'import("decimal.js/decimal.mjs");',
    "src/infrastructure/invalid.ts",
  );
});

test("decimal.js subpaths may not be required outside decimal.ts", async () => {
  await assertRestrictedBy(
    "phase0/source-boundaries",
    'require("decimal.js/decimal.mjs");',
    "src/infrastructure/invalid.ts",
  );
});

const computedBoundaryCases = [
  {
    name: "domain rejects concatenated dynamic imports",
    code: 'import("@/app/" + name);',
    filePath: "src/domain/invalid.ts",
  },
  {
    name: "domain rejects interpolated dynamic imports",
    code: "import(`@/app/${name}`);",
    filePath: "src/domain/invalid.ts",
  },
  {
    name: "domain rejects concatenated require sources",
    code: 'require("@/infrastructure/" + name);',
    filePath: "src/domain/invalid.ts",
  },
  {
    name: "domain inspects require sources with extra arguments",
    code: 'require("@/infrastructure/x", undefined);',
    filePath: "src/domain/invalid.ts",
  },
  {
    name: "domain rejects unresolved dynamic imports",
    code: "import(name);",
    filePath: "src/domain/invalid.ts",
  },
  {
    name: "ui rejects unresolved dynamic imports",
    code: "import(name);",
    filePath: "src/ui/invalid.ts",
  },
  {
    name: "application rejects unresolved require sources",
    code: "require(name);",
    filePath: "src/application/invalid.ts",
  },
  {
    name: "infrastructure rejects unresolved dynamic imports",
    code: "import(name);",
    filePath: "src/infrastructure/invalid.ts",
  },
  {
    name: "shared rejects unresolved require sources",
    code: "require(name);",
    filePath: "src/shared/invalid.ts",
  },
];

for (const { name, code, filePath } of computedBoundaryCases) {
  test(name, async () => {
    await assertRestrictedBy("phase0/source-boundaries", code, filePath);
  });
}

test("normalized imports within the same layer remain allowed", async () => {
  const rules = await rulesFor(
    [
      'import "../domain/evm-types";',
      'import("@/domain/../domain/decimal");',
    ].join("\n"),
    "src/domain/valid.ts",
  );

  assert.ok(!rules.includes("phase0/source-boundaries"));
});

test("domain rejects aliases with extra slashes into app", async () => {
  await assertRestrictedBy(
    "phase0/source-boundaries",
    'import "@//app/x";',
    "src/domain/invalid.ts",
  );
});

test("extra-slash aliases within the same layer remain allowed", async () => {
  const rules = await rulesFor(
    'import "@//domain/evm-types";',
    "src/domain/valid.ts",
  );

  assert.ok(!rules.includes("phase0/source-boundaries"));
});

const forbiddenReexportCases = [
  {
    name: "domain rejects duplicate-slash relative reexports into app",
    code: 'export * from "..//app/x";',
  },
  {
    name: "domain rejects alias-traversal reexports into app",
    code: 'export * from "@/domain/../app/x";',
  },
  {
    name: "domain rejects named reexports into app",
    code: 'export { value } from "@/domain/../app/x";',
  },
];

for (const { name, code } of forbiddenReexportCases) {
  test(name, async () => {
    await assertRestrictedBy(
      "phase0/source-boundaries",
      code,
      "src/domain/invalid.ts",
    );
  });
}

test("same-layer normalized reexports remain allowed", async () => {
  const rules = await rulesFor(
    'export * from "@//domain/evm-types";',
    "src/domain/valid.ts",
  );

  assert.ok(!rules.includes("phase0/source-boundaries"));
});

test("domain may not require infrastructure modules", async () => {
  await assertRestrictedBy(
    "phase0/source-boundaries",
    'const schema = require("@/infrastructure/database/schema");',
    "src/domain/invalid.ts",
  );
});

test("decimal.js may not be required outside the decimal module", async () => {
  await assertRestrictedBy(
    "no-restricted-syntax",
    'const Decimal = require("decimal.js");',
    "src/domain/invalid.ts",
  );
});

test("standard CommonJS loader variants enforce source boundaries", async () => {
  const rules = await rulesFor(
    [
      "const load = require;",
      'load("@/infrastructure/x");',
      "const load2 = load;",
      'load2("@/app/x");',
      'require.call(undefined, "@/infrastructure/x");',
      'require.apply(undefined, ["@/app/x"]);',
      "const bound = require.bind(undefined);",
      'bound("@/infrastructure/x");',
      'module.require("@/app/x");',
    ].join("\n"),
    "src/domain/invalid.ts",
  );

  assert.equal(
    rules.filter((rule) => rule === "phase0/source-boundaries").length,
    5,
  );
});

test("standard CommonJS loader variants preserve Decimal centralization", async () => {
  const rules = await rulesFor(
    [
      "const load = require;",
      "const load2 = load;",
      'load2("decimal.js/decimal.mjs");',
      'require.call(undefined, "decimal.js/decimal.mjs");',
      'require.apply(undefined, ["decimal.js"]);',
      "const bound = require.bind(undefined);",
      'bound("decimal.js");',
      'module.require("decimal.js");',
    ].join("\n"),
    "src/shared/invalid.ts",
  );

  assert.equal(
    rules.filter((rule) => rule === "phase0/source-boundaries").length,
    5,
  );
});

test("canonical createRequire loaders enforce boundaries and Decimal policy", async () => {
  const rules = await rulesFor(
    [
      'import { createRequire, createRequire as makeRequire } from "node:module";',
      'import { createRequire as legacyCreateRequire } from "module";',
      "const loadModule = createRequire(import.meta.url);",
      'loadModule("@/infrastructure/x");',
      'loadModule("decimal.js/decimal.mjs");',
      "const loadModule2 = loadModule;",
      'loadModule2("@/app/x");',
      'createRequire(import.meta.url)("@/infrastructure/y");',
      "const factoryAlias = makeRequire;",
      "const aliasLoader = factoryAlias(import.meta.url);",
      'aliasLoader("decimal.js");',
      'legacyCreateRequire(import.meta.url)("@/app/y");',
    ].join("\n"),
    "src/domain/invalid.ts",
  );

  assert.equal(
    rules.filter((rule) => rule === "phase0/source-boundaries").length,
    3,
  );
});

test("unresolved standard loader sources follow dynamic-source policy", async () => {
  const rules = await rulesFor(
    [
      'import { createRequire } from "node:module";',
      "declare const source: string;",
      "const load = require;",
      "load(source);",
      "require.call(undefined, source);",
      "require.apply(undefined, [source]);",
      "const bound = require.bind(undefined);",
      "bound(source);",
      "module.require(source);",
      "const loadModule = createRequire(import.meta.url);",
      "loadModule(source);",
      "createRequire(import.meta.url)(source);",
    ].join("\n"),
    "src/domain/invalid.ts",
  );

  assert.equal(
    rules.filter((rule) => rule === "phase0/source-boundaries").length,
    6,
  );
});

test("canonical module-object imports are prohibited at creation", async () => {
  const rules = await rulesFor(
    [
      'import * as moduleApi from "node:module";',
      'import moduleApiDefault from "node:module";',
      'moduleApi.createRequire(import.meta.url)("@/infrastructure/x");',
      'moduleApiDefault.createRequire(import.meta.url)("decimal.js");',
    ].join("\n"),
    "src/domain/invalid.ts",
  );

  assert.equal(
    rules.filter((rule) => rule === "phase0/source-boundaries").length,
    2,
  );
});

test("dynamic canonical module imports are prohibited", async () => {
  const rules = await rulesFor(
    [
      'import("node:module");',
      'import("module");',
      'const moduleSource = "module";',
      "const moduleAlias = moduleSource;",
      "import(moduleAlias);",
      'const nodePrefix = "node:";',
      "const nodeModuleSource = `${nodePrefix}module`;",
      "import(nodeModuleSource);",
    ].join("\n"),
    "src/domain/invalid.ts",
  );

  assert.equal(
    rules.filter((rule) => rule === "phase0/source-boundaries").length,
    4,
  );
});

test("canonical loader-capability reexports are prohibited", async () => {
  const rules = await rulesFor(
    [
      'export { createRequire as nodeCreateRequire } from "node:module";',
      'export { Module as LegacyModule } from "module";',
      'export { default as ModuleDefault } from "node:module";',
      'export * as ModuleNamespace from "node:module";',
      'export * from "module";',
    ].join("\n"),
    "src/domain/invalid.ts",
  );

  assert.equal(
    rules.filter((rule) => rule === "phase0/source-boundaries").length,
    5,
  );
});

test("named runtime Module imports are prohibited at creation", async () => {
  const rules = await rulesFor(
    [
      'import { Module } from "node:module";',
      'import { Module as LegacyModule } from "module";',
      "const ModuleAlias = Module;",
      "const LoaderModule = ModuleAlias;",
      "LoaderModule.createRequire(import.meta.url);",
      "const LegacyModuleAlias = LegacyModule;",
      "LegacyModuleAlias.createRequire(import.meta.url);",
    ].join("\n"),
    "src/domain/invalid.ts",
  );

  assert.equal(
    rules.filter((rule) => rule === "phase0/source-boundaries").length,
    2,
  );
});

test("createRequire extracted from direct require is prohibited at creation", async () => {
  const rules = await rulesFor(
    [
      'const { createRequire } = require("node:module");',
      'createRequire(import.meta.url)("@/infrastructure/x");',
      'const factory = require("module").createRequire;',
      'factory(import.meta.url)("decimal.js");',
    ].join("\n"),
    "src/domain/invalid.ts",
  );

  assert.equal(
    rules.filter((rule) => rule === "phase0/source-boundaries").length,
    2,
  );
});

test("canonical runtime module objects are rejected when stored", async () => {
  const rules = await rulesFor(
    [
      'const moduleApi = require("node:module");',
      "const moduleAlias = moduleApi;",
      "const moduleAlias2 = moduleAlias;",
      'moduleAlias2.createRequire(import.meta.url)("@/infrastructure/x");',
    ].join("\n"),
    "src/domain/invalid.ts",
  );

  assert.equal(
    rules.filter((rule) => rule === "phase0/source-boundaries").length,
    1,
  );
});

test("assignment patterns cannot extract canonical createRequire capability", async () => {
  const rules = await rulesFor(
    [
      "let createRequire: unknown;",
      "let nestedFactory: unknown;",
      "let moduleRest: unknown;",
      '({ createRequire } = require("node:module"));',
      "({ createRequire: { bind: nestedFactory } } =",
      '  require("module"));',
      '({ ...moduleRest } = require("node:module"));',
    ].join("\n"),
    "src/domain/invalid.ts",
  );

  assert.equal(
    rules.filter((rule) => rule === "phase0/source-boundaries").length,
    3,
  );
});

test("global module rejects unresolved computed loader access", async () => {
  const rules = await rulesFor(
    [
      "declare const key: string;",
      "module[key];",
      'module["require"]("@/infrastructure/x");',
      'module["exports"];',
    ].join("\n"),
    "src/domain/invalid.ts",
  );

  assert.equal(
    rules.filter((rule) => rule === "phase0/source-boundaries").length,
    2,
  );
});

test("type members and labels named require or module are not runtime references", async () => {
  const rules = await rulesFor(
    [
      "interface LoaderShape {",
      "  require(source: string): unknown;",
      "  module: string;",
      "}",
      "type ModuleShape = {",
      "  require: (source: string) => unknown;",
      "  module(): void;",
      "};",
      "interface require { module: string }",
      "type module = { require(): void };",
      "require: { break require; }",
      "module: { break module; }",
    ].join("\n"),
    "src/domain/valid.ts",
  );

  assert.ok(!rules.includes("phase0/source-boundaries"));
});

test("type-only canonical module imports remain allowed", async () => {
  const rules = await rulesFor(
    [
      'import type * as ModuleTypes from "node:module";',
      'import type { createRequire as CreateRequire, Module as ModuleType } from "module";',
      'import { type createRequire as NodeCreateRequire, type Module as NodeModuleType } from "node:module";',
      "type ModuleFactory = typeof ModuleTypes.createRequire;",
      "type LegacyFactory = typeof CreateRequire;",
      "type NodeFactory = typeof NodeCreateRequire;",
      "type LegacyModule = ModuleType;",
      "type NodeModule = NodeModuleType;",
    ].join("\n"),
    "src/domain/valid.ts",
  );

  assert.ok(!rules.includes("phase0/source-boundaries"));
});

test("safe and type-only canonical module reexports remain allowed", async () => {
  const rules = await rulesFor(
    [
      'export { isBuiltin } from "node:module";',
      'export type { createRequire as CreateRequireType, Module as ModuleType } from "node:module";',
      'export { type Module as LegacyModuleType } from "module";',
      'export type { default as ModuleDefaultType } from "node:module";',
      'export type * as ModuleTypes from "node:module";',
      'export type * from "module";',
    ].join("\n"),
    "src/domain/valid.ts",
  );

  assert.ok(!rules.includes("phase0/source-boundaries"));
});

test("bound createRequire aliases are rejected at canonical import", async () => {
  const rules = await rulesFor(
    [
      'import { createRequire } from "node:module";',
      "const boundFactory = createRequire.bind(undefined);",
      "const factoryAlias = boundFactory;",
      "const loader = factoryAlias(import.meta.url);",
      'loader("@/infrastructure/x");',
    ].join("\n"),
    "src/domain/invalid.ts",
  );

  assert.equal(
    rules.filter((rule) => rule === "phase0/source-boundaries").length,
    1,
  );
});

test("global module aliases are rejected at their first reference", async () => {
  const rules = await rulesFor(
    [
      "const moduleAlias = module;",
      "const moduleAlias2 = moduleAlias;",
      'moduleAlias2.require("@/infrastructure/x");',
    ].join("\n"),
    "src/domain/invalid.ts",
  );

  assert.equal(
    rules.filter((rule) => rule === "phase0/source-boundaries").length,
    1,
  );
});

test("nested require call binding is rejected at capability references", async () => {
  const rules = await rulesFor(
    [
      "const invoke = require.call.bind(require);",
      "const invokeAlias = invoke;",
      'invokeAlias(undefined, "@/infrastructure/x");',
    ].join("\n"),
    "src/domain/invalid.ts",
  );

  assert.equal(
    rules.filter((rule) => rule === "phase0/source-boundaries").length,
    2,
  );
});

test("allowed domain require dependencies are not rejected globally", async () => {
  const rules = await rulesFor(
    'const types = require("@/domain/evm-types");',
    "src/domain/valid.ts",
  );

  assert.equal(rules.length, 0);
});

test("literal same-layer dynamic sources and shadowed require remain allowed", async () => {
  const rules = await rulesFor(
    [
      'import("@/domain/" + "evm");',
      'require("@/domain/evm", undefined);',
      "function load(require: (source: string) => unknown, name: string) {",
      "  require(name);",
      '  require("@/infrastructure/database/schema");',
      "}",
    ].join("\n"),
    "src/domain/valid.ts",
  );

  assert.ok(!rules.includes("phase0/source-boundaries"));
});

test("local and homonymous loader functions remain allowed", async () => {
  const rules = await rulesFor(
    [
      'import { createRequire as localFactory } from "./factory";',
      "type Loader = ((source: string) => unknown) & {",
      "  call(thisArg: unknown, source: string): unknown;",
      "  apply(thisArg: unknown, sources: string[]): unknown;",
      "  bind(thisArg: unknown): (source: string) => unknown;",
      "};",
      "function inspect(require: Loader) {",
      "  const load = require;",
      "  const load2 = load;",
      '  load2("@/infrastructure/x");',
      '  require.call(undefined, "@/app/x");',
      '  require.apply(undefined, ["decimal.js"]);',
      "  const bound = require.bind(undefined);",
      '  bound("decimal.js/decimal.mjs");',
      "  const invoke = require.call.bind(require);",
      "  const invokeAlias = invoke;",
      '  invokeAlias(undefined, "@/infrastructure/x");',
      "}",
      "const helper = {",
      "  require: (source: string) => source,",
      "  call: (_thisArg: unknown, source: string) => source,",
      "  apply: (_thisArg: unknown, sources: string[]) => sources[0],",
      "  bind: () => (source: string) => source,",
      "};",
      'helper.require("@/infrastructure/x");',
      'helper.call(undefined, "@/app/x");',
      'helper.apply(undefined, ["decimal.js"]);',
      'helper.bind()("decimal.js/decimal.mjs");',
      "const module = { require: (source: string) => source };",
      'module.require("@/infrastructure/x");',
      "const moduleAlias = module;",
      "const moduleAlias2 = moduleAlias;",
      'moduleAlias2.require("decimal.js");',
      "declare const moduleKey: string;",
      "module[moduleKey];",
      "function createRequire(_url: string) {",
      "  return (source: string) => source;",
      "}",
      'createRequire(import.meta.url)("decimal.js");',
      "const boundFactory = createRequire.bind(undefined);",
      "const factoryAlias = boundFactory;",
      'factoryAlias(import.meta.url)("@/infrastructure/x");',
      "const localLoader = localFactory(import.meta.url);",
      'localLoader("@/infrastructure/x");',
      "const allowed = globalThis.require;",
      'allowed("@/infrastructure/x");',
    ].join("\n"),
    "src/domain/valid.ts",
  );

  assert.ok(!rules.includes("phase0/source-boundaries"));
});

test("local and shadowed Module homonyms remain allowed", async () => {
  const rules = await rulesFor(
    [
      'import { Module as LocalModule } from "./module-helper";',
      "class Module {",
      "  static createRequire(_url: string) {",
      "    return (source: string) => source;",
      "  }",
      "}",
      "const ModuleAlias = Module;",
      'ModuleAlias.createRequire(import.meta.url)("node:module");',
      "const ImportedModuleAlias = LocalModule;",
      'ImportedModuleAlias.createRequire(import.meta.url)("module");',
      "function inspect(Module: typeof LocalModule) {",
      "  const ShadowedModule = Module;",
      '  return ShadowedModule.createRequire(import.meta.url)("node:module");',
      "}",
    ].join("\n"),
    "src/domain/valid.ts",
  );

  assert.ok(!rules.includes("phase0/source-boundaries"));
});

test("standard loader capabilities are rejected even for same-layer sources", async () => {
  const rules = await rulesFor(
    [
      'import { createRequire as makeRequire } from "node:module";',
      "const load = require;",
      'load("@/domain/evm");',
      'require.call(undefined, "@/domain/decimal");',
      'require.apply(undefined, ["@/domain/evm"]);',
      "const bound = require.bind(undefined);",
      'bound("@/domain/decimal");',
      'module.require("@/domain/evm");',
      'makeRequire(import.meta.url)("@/domain/decimal");',
    ].join("\n"),
    "src/domain/valid.ts",
  );

  assert.equal(
    rules.filter((rule) => rule === "phase0/source-boundaries").length,
    6,
  );
});

test("named non-loader module imports remain allowed", async () => {
  const rules = await rulesFor(
    [
      'import { isBuiltin } from "node:module";',
      'import { isBuiltin as legacyIsBuiltin } from "module";',
      'const { isBuiltin: requiredIsBuiltin } = require("node:module");',
      'const requiredIsBuiltin2 = require("module").isBuiltin;',
      'isBuiltin("@/infrastructure/x");',
      'legacyIsBuiltin("decimal.js");',
      'requiredIsBuiltin("node:fs");',
      'requiredIsBuiltin2("fs");',
    ].join("\n"),
    "src/domain/valid.ts",
  );

  assert.ok(!rules.includes("phase0/source-boundaries"));
});

test("similarly named non-Decimal operations and exact Decimal operations remain allowed", async () => {
  const rules = await rulesFor(
    [
      'import { Decimal } from "@/domain/decimal";',
      "const n = 1.25;",
      "n.toFixed(2);",
      "n.toExponential(2);",
      "Math.floor(Date.now() / 1000);",
      "const helper = { round() {} };",
      "helper.round();",
      'new Map().set("key", "value");',
      'new Decimal("1").plus(1).toString();',
      "function update(Decimal: Map<string, string>) {",
      '  Decimal.set("key", "value");',
      "}",
      "const { set } = new Map<string, string>();",
      'set.call(new Map<string, string>(), "key", "value");',
      "const numberFormat = n.toFixed;",
      "numberFormat.call(n, 2);",
      "const boundNumberFormat = n.toFixed.bind(n);",
      "boundNumberFormat(2);",
      "function formatNumber({ toFixed }: number) {",
      "  return toFixed.call(1, 2);",
      "}",
      "const updateMap = ({ set }: Map<string, string>) =>",
      '  set.call(new Map<string, string>(), "key", "value");',
      "declare const unknownMethod: string;",
      "const dynamicHelper: Record<string, () => void> = {};",
      "dynamicHelper[unknownMethod]();",
      "declare const wrappedNumber: { value: number };",
      "declare const wrappedNumbers: readonly { value: number }[];",
      "function nestedNumber(",
      "  { value: { toFixed } }: { value: number }",
      ") {",
      "  return toFixed.call(1, 2);",
      "}",
      "const { value: { toPrecision } } = wrappedNumber;",
      "toPrecision.call(1, 2);",
      "for (const { value: { toFixed } } of wrappedNumbers) {",
      "  toFixed.call(1, 2);",
      "}",
      "let numberToPrecision: (precision?: number) => string;",
      "for ({ value: { toPrecision: numberToPrecision } } of wrappedNumbers) {",
      "  numberToPrecision.call(1, 2);",
      "}",
    ].join("\n"),
    "src/infrastructure/valid.ts",
  );

  assert.equal(rules.length, 0);
});
