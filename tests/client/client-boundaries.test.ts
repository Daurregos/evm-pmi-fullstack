import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { test } from "node:test";
import { globSync } from "node:fs";
import ts from "typescript";

/**
 * Revisión estructural de ADR-001 y ADR-007: el cliente no contiene fórmulas
 * EVM ni conserva indicadores como estado autoritativo.
 *
 * La afirmación se comprueba con dos invariantes sobre el árbol de fuentes del
 * cliente. La primera es el vocabulario: una fórmula EVM necesita operar sobre
 * los nombres del dominio, de modo que un módulo que los menciona no puede
 * contener aritmética. La segunda es la frontera de importaciones.
 *
 * Lo que esta revisión NO puede descartar es que alguien copie los valores a
 * nombres neutros antes de operar. Ese hueco lo cubre la carga centinela de
 * `dashboard-data.test.tsx`, que comprueba que la vista muestra los indicadores
 * que sirvió el API.
 */

/** Datos capturados, indicadores derivados y consolidados del PRD §3. */
const EVM_VOCABULARY = new Set([
  "ac",
  "activitiesWithEvAndZeroAc",
  "actualProgress",
  "bac",
  "cpi",
  "cv",
  "eac",
  "ev",
  "plannedProgress",
  "progress",
  "pv",
  "spi",
  "sv",
  "vac",
]);

const ARITHMETIC_OPERATORS = new Set<ts.SyntaxKind>([
  ts.SyntaxKind.AsteriskAsteriskToken,
  ts.SyntaxKind.AsteriskToken,
  ts.SyntaxKind.MinusToken,
  ts.SyntaxKind.PercentToken,
  ts.SyntaxKind.PlusToken,
  ts.SyntaxKind.SlashToken,
]);

const ARITHMETIC_ASSIGNMENTS = new Set<ts.SyntaxKind>([
  ts.SyntaxKind.AsteriskAsteriskEqualsToken,
  ts.SyntaxKind.AsteriskEqualsToken,
  ts.SyntaxKind.MinusEqualsToken,
  ts.SyntaxKind.PercentEqualsToken,
  ts.SyntaxKind.PlusEqualsToken,
  ts.SyntaxKind.SlashEqualsToken,
]);

const SERVER_LAYER = /(^|\/|@\/)(application|domain|infrastructure)\//;

interface ClientModule {
  readonly path: string;
  readonly source: ts.SourceFile;
}

function clientModules(): ClientModule[] {
  const paths = [
    ...globSync("src/ui/**/*.{ts,tsx}"),
    ...globSync("src/app/**/*.{ts,tsx}"),
  ]
    .map((path) => relative(".", path).replaceAll("\\", "/"))
    .filter((path) => !path.startsWith("src/app/mock-api/"))
    .sort();

  return paths.map((path) => ({
    path,
    source: ts.createSourceFile(
      path,
      readFileSync(path, "utf8"),
      ts.ScriptTarget.ES2022,
      true,
      path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    ),
  }));
}

function walk(node: ts.Node, visit: (node: ts.Node) => void): void {
  visit(node);
  node.forEachChild((child) => {
    walk(child, visit);
  });
}

/** Menciones de vocabulario EVM como identificador o nombre de propiedad. */
export function evmVocabularyIn(source: ts.SourceFile): string[] {
  const found = new Set<string>();

  walk(source, (node) => {
    if (
      (ts.isIdentifier(node) || ts.isStringLiteral(node)) &&
      EVM_VOCABULARY.has(node.text)
    ) {
      found.add(node.text);
    }
  });

  return [...found].sort();
}

/** Expresiones aritméticas, con la línea donde aparecen. */
export function arithmeticIn(source: ts.SourceFile): string[] {
  const found: string[] = [];

  walk(source, (node) => {
    if (!ts.isBinaryExpression(node)) {
      return;
    }

    const operator = node.operatorToken.kind;

    if (
      !ARITHMETIC_OPERATORS.has(operator) &&
      !ARITHMETIC_ASSIGNMENTS.has(operator)
    ) {
      return;
    }

    const { line } = source.getLineAndCharacterOfPosition(node.getStart());
    found.push(`${source.fileName}:${String(line + 1)} ${node.getText()}`);
  });

  return found;
}

/** Especificadores importados por el módulo. */
export function importsOf(source: ts.SourceFile): string[] {
  const found: string[] = [];

  walk(source, (node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier !== undefined &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      found.push(node.moduleSpecifier.text);
    }

    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] !== undefined &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      found.push(node.arguments[0].text);
    }
  });

  return found;
}

const modules = clientModules();
const uiModules = modules.filter((module) =>
  module.path.startsWith("src/ui/"),
);

test("the review inspects the client tree it claims to inspect", () => {
  const paths = modules.map((module) => module.path);

  for (const expected of [
    "src/app/layout.tsx",
    "src/app/page.tsx",
    "src/ui/activities-table.tsx",
    "src/ui/dashboard-view.tsx",
    "src/ui/project-summary-panel.tsx",
  ]) {
    assert.ok(paths.includes(expected), `Expected ${expected} in the review`);
  }

  assert.ok(!paths.some((path) => path.startsWith("src/app/mock-api/")));
});

test("some client module does mention EVM vocabulary", () => {
  // Sin esta comprobación, la revisión pasaría sobre un árbol vacío.
  const mentioning = modules.filter(
    (module) => evmVocabularyIn(module.source).length > 0,
  );

  assert.ok(mentioning.length >= 3, "Expected the client to present indicators");
});

test("no client module mixes EVM vocabulary with arithmetic", () => {
  const offenders = modules
    .map((module) => ({
      arithmetic: arithmeticIn(module.source),
      path: module.path,
      vocabulary: evmVocabularyIn(module.source),
    }))
    .filter(
      (module) => module.vocabulary.length > 0 && module.arithmetic.length > 0,
    );

  assert.deepEqual(
    offenders,
    [],
    `EVM vocabulary and arithmetic coexist in: ${JSON.stringify(offenders, null, 2)}`,
  );
});

test("no UI module imports a server layer", () => {
  const offenders = uiModules
    .map((module) => ({
      forbidden: importsOf(module.source).filter((specifier) =>
        SERVER_LAYER.test(specifier),
      ),
      path: module.path,
    }))
    .filter((module) => module.forbidden.length > 0);

  assert.deepEqual(
    offenders,
    [],
    `Server layers imported from: ${JSON.stringify(offenders, null, 2)}`,
  );
});

test("both invariants reject a violating probe", () => {
  const probe = ts.createSourceFile(
    "src/ui/probe.tsx",
    [
      'import { computeEvm } from "@/domain/evm";',
      'import { rows } from "../application/evm-repository";',
      "export function derive(activity: { ev: number; ac: number }) {",
      "  return activity.ev / activity.ac;",
      "}",
    ].join("\n"),
    ts.ScriptTarget.ES2022,
    true,
    ts.ScriptKind.TSX,
  );

  assert.deepEqual(evmVocabularyIn(probe), ["ac", "ev"]);
  assert.equal(arithmeticIn(probe).length, 1);
  assert.deepEqual(
    importsOf(probe).filter((specifier) => SERVER_LAYER.test(specifier)),
    ["@/domain/evm", "../application/evm-repository"],
  );
});
