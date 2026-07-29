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
      "new Decimal(1).toDecimalPlaces(2)",
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

test("allowed domain require dependencies are not rejected globally", async () => {
  const rules = await rulesFor(
    'const types = require("@/domain/evm-types");',
    "src/domain/valid.ts",
  );

  assert.equal(rules.length, 0);
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
    ].join("\n"),
    "src/infrastructure/valid.ts",
  );

  assert.equal(rules.length, 0);
});
