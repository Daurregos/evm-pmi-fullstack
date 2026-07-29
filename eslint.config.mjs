import path from "node:path";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import ts from "typescript";

const projectRoot = process.cwd();
const sourceRoot = path.join(projectRoot, "src");
const decimalModulePath = path.join(sourceRoot, "domain", "decimal.ts");

const restrictedImport = (regex, message) => ({
  regex,
  message,
});

const decimalImport = restrictedImport(
  "^decimal\\.js(?:/|$)",
  "Import Decimal from src/domain/decimal.ts.",
);

const layerImport = (layers) =>
  restrictedImport(
    `(?:^@/(?:${layers})(?:/|$))|(?:^(?:\\.{1,2}/)+(?:[^/]+/)*(?:${layers})(?:/|$))`,
    "This import crosses a forbidden source boundary.",
  );

const concreteServerImport = restrictedImport(
  "^(?:next|drizzle-orm|pg)(?:/|$)",
  "This layer cannot depend on a concrete server framework or database package.",
);

const filesystemImport = restrictedImport(
  "^(?:node:)?fs(?:/|$)",
  "Domain cannot depend on the filesystem.",
);

const restrictedSyntax = (selector) => ({
  selector,
  message: "Import Decimal from src/domain/decimal.ts.",
});

const decimalInstancePolicyMethods = new Set([
  "ceil",
  "dividedToIntegerBy",
  "divToInt",
  "floor",
  "round",
  "toBinary",
  "toDecimalPlaces",
  "toDP",
  "toExponential",
  "toFixed",
  "toHexadecimal",
  "toHex",
  "toInteger",
  "toNearest",
  "toOctal",
  "toPrecision",
  "toSignificantDigits",
  "toSD",
  "truncated",
  "trunc",
]);
const decimalStaticPolicyMethods = new Set([
  "ceil",
  "clone",
  "config",
  "floor",
  "round",
  "set",
  "trunc",
]);
const decimalPolicyMethods = new Set([
  ...decimalInstancePolicyMethods,
  ...decimalStaticPolicyMethods,
]);
const directDecimalDependencySelectors = [
  "ImportExpression[source.value='decimal.js']",
  "CallExpression[callee.name='require'][arguments.0.value='decimal.js']",
].map(restrictedSyntax);

const forbiddenTargetLayers = {
  domain: new Set(["app", "ui", "infrastructure"]),
  ui: new Set(["domain", "application", "infrastructure"]),
  application: new Set(["app", "ui", "infrastructure"]),
};

function staticValue(node) {
  if (
    node?.type === "Literal" &&
    ["string", "number", "boolean"].includes(typeof node.value)
  ) {
    return node.value;
  }

  if (node?.type === "BinaryExpression" && node.operator === "+") {
    const left = staticValue(node.left);
    const right = staticValue(node.right);
    if (left === undefined || right === undefined) {
      return undefined;
    }
    return left + right;
  }

  if (node?.type === "TemplateLiteral") {
    let value = node.quasis[0]?.value.cooked ?? "";
    for (let index = 0; index < node.expressions.length; index += 1) {
      const expressionValue = staticValue(node.expressions[index]);
      if (expressionValue === undefined) {
        return undefined;
      }
      value += String(expressionValue);
      value += node.quasis[index + 1]?.value.cooked ?? "";
    }
    return value;
  }

  return undefined;
}

function literalString(node) {
  const value = staticValue(node);
  return typeof value === "string" ? value : undefined;
}

function normalizedInternalTarget(source, filename) {
  if (source.startsWith("@/")) {
    const aliasRemainder = source.slice(2).replace(/^\/+/, "");
    return path.resolve(sourceRoot, aliasRemainder);
  }
  if (source.startsWith(".")) {
    return path.resolve(path.dirname(filename), source);
  }
  return undefined;
}

function layerForPath(filename) {
  const relativePath = path.relative(sourceRoot, filename);
  if (
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath)
  ) {
    return undefined;
  }
  return relativePath.split(path.sep)[0];
}

function isPackage(source, packageName) {
  return source === packageName || source.startsWith(`${packageName}/`);
}

function sourceFromImportNode(node) {
  return literalString(node.source);
}

function variableForIdentifier(sourceCode, node) {
  if (node?.type !== "Identifier") {
    return undefined;
  }

  for (
    let scope = sourceCode.getScope(node);
    scope;
    scope = scope.upper
  ) {
    const variable = scope.set.get(node.name);
    if (variable) {
      return variable;
    }
  }

  return undefined;
}

function requireSourceNode(sourceCode, node) {
  if (
    node.type !== "CallExpression" ||
    node.callee.type !== "Identifier" ||
    node.callee.name !== "require" ||
    node.arguments.length === 0
  ) {
    return undefined;
  }

  const requireVariable = variableForIdentifier(sourceCode, node.callee);
  if (requireVariable && requireVariable.defs.length > 0) {
    return undefined;
  }

  return node.arguments[0];
}

const sourceBoundariesRule = {
  meta: {
    type: "problem",
    schema: [],
    messages: {
      forbiddenDecimalDependency:
        "Import Decimal from src/domain/decimal.ts.",
      forbiddenDependency:
        "{{layer}} cannot import the concrete dependency {{source}}.",
      forbiddenLayer: "{{layer}} cannot import from {{targetLayer}}.",
      unresolvedDynamicSource:
        "Dynamic module sources must resolve to a static string.",
    },
  },
  create(context) {
    const { sourceCode } = context;
    const filename = path.resolve(context.filename);
    const layer = layerForPath(filename);
    const forbiddenLayers = forbiddenTargetLayers[layer];
    const authorizedDecimalModule = filename === decimalModulePath;

    if (!layer) {
      return {};
    }

    function checkSource(node, source, dynamic = false) {
      if (source === undefined) {
        if (dynamic) {
          context.report({ node, messageId: "unresolvedDynamicSource" });
        }
        return;
      }

      if (
        !authorizedDecimalModule &&
        isPackage(source, "decimal.js")
      ) {
        context.report({ node, messageId: "forbiddenDecimalDependency" });
        return;
      }

      if (!forbiddenLayers) {
        return;
      }

      const target = normalizedInternalTarget(source, filename);
      const targetLayer = target && layerForPath(target);
      if (targetLayer && forbiddenLayers.has(targetLayer)) {
        context.report({
          node,
          messageId: "forbiddenLayer",
          data: { layer, targetLayer },
        });
        return;
      }

      const serverPackage =
        isPackage(source, "next") ||
        isPackage(source, "drizzle-orm") ||
        isPackage(source, "pg");
      const filesystemPackage =
        layer === "domain" &&
        (isPackage(source, "fs") || isPackage(source, "node:fs"));

      if (
        ((layer === "domain" || layer === "application") &&
          serverPackage) ||
        filesystemPackage
      ) {
        context.report({
          node,
          messageId: "forbiddenDependency",
          data: { layer, source },
        });
      }
    }

    function checkImport(node) {
      checkSource(node, sourceFromImportNode(node));
    }

    function checkDynamicImport(node) {
      checkSource(node, sourceFromImportNode(node), true);
    }

    function checkNormalizedImport(node) {
      const source = sourceFromImportNode(node);
      if (
        source &&
        (source.includes("//") ||
          source.includes("/../") ||
          source.includes("/./"))
      ) {
        checkSource(node, source);
      }
    }

    function checkRequire(node) {
      const sourceNode = requireSourceNode(sourceCode, node);
      if (sourceNode) {
        checkSource(node, literalString(sourceNode), true);
      }
    }

    return {
      CallExpression: checkRequire,
      ExportAllDeclaration: checkImport,
      ExportNamedDeclaration: checkImport,
      ImportDeclaration: checkNormalizedImport,
      ImportExpression: checkDynamicImport,
    };
  },
};

const decimalPolicyRule = {
  meta: {
    type: "problem",
    schema: [],
    messages: {
      restrictedOperation:
        "Use src/domain/decimal.ts for Decimal configuration and presentation policy.",
    },
  },
  create(context) {
    const { sourceCode } = context;
    const filename = path.resolve(context.filename);
    const authorizedModule = filename === decimalModulePath;
    const { esTreeNodeToTSNodeMap, program } = sourceCode.parserServices;
    if (!program || !esTreeNodeToTSNodeMap) {
      throw new Error(
        "phase0/decimal-policy requires TypeScript parser services.",
      );
    }
    const checker = program.getTypeChecker();
    const decimalTypingsRoot = `${path.join(
      projectRoot,
      "node_modules",
      "decimal.js",
    )}${path.sep}`;

    function declarationComesFromDecimal(declaration) {
      const sourceFile = declaration.getSourceFile();
      const declarationPath = path.resolve(sourceFile.fileName);
      return (
        sourceFile.isDeclarationFile &&
        declarationPath.startsWith(decimalTypingsRoot)
      );
    }

    function symbolComesFromDecimal(symbol) {
      if (!symbol) {
        return false;
      }

      const resolvedSymbol =
        (symbol.flags & ts.SymbolFlags.Alias) !== 0
          ? checker.getAliasedSymbol(symbol)
          : symbol;
      return resolvedSymbol
        .getDeclarations()
        ?.some(declarationComesFromDecimal) ?? false;
    }

    function typeComesFromDecimal(type) {
      if (type.isUnionOrIntersection()) {
        return type.types.some(typeComesFromDecimal);
      }

      const symbols = [type.aliasSymbol, type.getSymbol()];
      if (symbols.some(symbolComesFromDecimal)) {
        return true;
      }

      return ["toDecimalPlaces", "set"].some((marker) =>
        symbolComesFromDecimal(checker.getPropertyOfType(type, marker)),
      );
    }

    function receiverIsDecimal(node, method) {
      const receiverType = checker.getTypeAtLocation(
        esTreeNodeToTSNodeMap.get(node),
      );
      return (
        symbolComesFromDecimal(
          checker.getPropertyOfType(receiverType, method),
        ) || typeComesFromDecimal(receiverType)
      );
    }

    function propertyName(node) {
      const property =
        node.type === "Property" ? node.key : node.property;
      return node.computed
        ? literalString(property)
        : property.name ?? property.value;
    }

    function checkMember(node) {
      const method = propertyName(node);
      const object = node.object;
      const authorizedOperation =
        authorizedModule &&
        (method === "set" || method === "toDecimalPlaces");
      if (
        !authorizedOperation &&
        decimalPolicyMethods.has(method) &&
        receiverIsDecimal(object, method)
      ) {
        context.report({ node, messageId: "restrictedOperation" });
      }
    }

    function checkObjectPattern(pattern, receiver) {
      for (const property of pattern.properties) {
        if (property.type !== "Property") {
          continue;
        }

        const method = propertyName(property);
        const authorizedOperation =
          authorizedModule &&
          (method === "set" || method === "toDecimalPlaces");
        if (
          !authorizedOperation &&
          decimalPolicyMethods.has(method) &&
          receiverIsDecimal(receiver, method)
        ) {
          context.report({ node: property, messageId: "restrictedOperation" });
        }
      }
    }

    function checkAssignmentDestructuring(node) {
      if (node.left.type === "ObjectPattern") {
        checkObjectPattern(node.left, node.right);
      }
    }

    function checkVariableDestructuring(node) {
      if (node.id.type === "ObjectPattern" && node.init) {
        checkObjectPattern(node.id, node.init);
      }
    }

    return {
      AssignmentExpression: checkAssignmentDestructuring,
      MemberExpression: checkMember,
      VariableDeclarator: checkVariableDestructuring,
    };
  },
};

const phase0Plugin = {
  rules: {
    "decimal-policy": decimalPolicyRule,
    "source-boundaries": sourceBoundariesRule,
  },
};

export default defineConfig([
  ...nextVitals,
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "drizzle/meta/**",
    "scripts/verify-decimal.mjs",
  ]),
  {
    rules: {
      "@next/next/no-html-link-for-pages": "off",
    },
  },
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: projectRoot,
      },
    },
    plugins: {
      phase0: phase0Plugin,
    },
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [decimalImport] },
      ],
      "no-restricted-syntax": [
        "error",
        ...directDecimalDependencySelectors,
      ],
      "phase0/decimal-policy": "error",
      "phase0/source-boundaries": "error",
    },
  },
  {
    files: ["src/domain/**/*.ts", "src/domain/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            decimalImport,
            layerImport("app|ui|infrastructure"),
            concreteServerImport,
            filesystemImport,
          ],
        },
      ],
    },
  },
  {
    files: ["src/ui/**/*.ts", "src/ui/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            decimalImport,
            layerImport("domain|application|infrastructure"),
          ],
        },
      ],
    },
  },
  {
    files: ["src/application/**/*.ts", "src/application/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            decimalImport,
            layerImport("app|ui|infrastructure"),
            concreteServerImport,
          ],
        },
      ],
    },
  },
  {
    files: ["src/domain/decimal.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            layerImport("app|ui|infrastructure"),
            concreteServerImport,
            filesystemImport,
          ],
        },
      ],
      "no-restricted-syntax": "off",
    },
  },
]);
