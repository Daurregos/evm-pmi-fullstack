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

function staticValue(node, sourceCode, seenVariables = new Set()) {
  if (
    node?.type === "Literal" &&
    ["string", "number", "boolean"].includes(typeof node.value)
  ) {
    return node.value;
  }

  if (node?.type === "BinaryExpression" && node.operator === "+") {
    const left = staticValue(node.left, sourceCode, seenVariables);
    const right = staticValue(node.right, sourceCode, seenVariables);
    if (left === undefined || right === undefined) {
      return undefined;
    }
    return left + right;
  }

  if (node?.type === "TemplateLiteral") {
    let value = node.quasis[0]?.value.cooked ?? "";
    for (let index = 0; index < node.expressions.length; index += 1) {
      const expressionValue = staticValue(
        node.expressions[index],
        sourceCode,
        seenVariables,
      );
      if (expressionValue === undefined) {
        return undefined;
      }
      value += String(expressionValue);
      value += node.quasis[index + 1]?.value.cooked ?? "";
    }
    return value;
  }

  if (
    sourceCode &&
    node?.type === "Identifier"
  ) {
    const variable = variableForIdentifier(sourceCode, node);
    const definition = variable?.defs.length === 1
      ? variable.defs[0]
      : undefined;
    if (
      !variable ||
      seenVariables.has(variable) ||
      definition?.type !== "Variable" ||
      definition.parent?.kind !== "const" ||
      definition.node.id.type !== "Identifier" ||
      !definition.node.init
    ) {
      return undefined;
    }

    const nextSeenVariables = new Set(seenVariables);
    nextSeenVariables.add(variable);
    return staticValue(
      definition.node.init,
      sourceCode,
      nextSeenVariables,
    );
  }

  if (
    [
      "ChainExpression",
      "TSAsExpression",
      "TSNonNullExpression",
      "TSTypeAssertion",
    ].includes(node?.type)
  ) {
    return staticValue(node.expression, sourceCode, seenVariables);
  }

  return undefined;
}

function literalString(node, sourceCode) {
  const value = staticValue(node, sourceCode);
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

function sourceFromImportNode(node, sourceCode) {
  return literalString(node.source, sourceCode);
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

function unwrapExpression(node) {
  return [
    "ChainExpression",
    "TSAsExpression",
    "TSNonNullExpression",
    "TSTypeAssertion",
  ].includes(node?.type)
    ? unwrapExpression(node.expression)
    : node;
}

function memberName(node, sourceCode) {
  return node.computed
    ? literalString(node.property, sourceCode)
    : node.property.name;
}

function isUnshadowedIdentifier(sourceCode, node, name) {
  if (node?.type !== "Identifier" || node.name !== name) {
    return false;
  }

  const variable = variableForIdentifier(sourceCode, node);
  return !variable || variable.defs.length === 0;
}

function isIdentifierReference(node) {
  const parent = node.parent;
  if (
    parent?.type === "MemberExpression" &&
    parent.property === node &&
    !parent.computed
  ) {
    return false;
  }

  if (
    [
      "MethodDefinition",
      "Property",
      "PropertyDefinition",
      "TSMethodSignature",
      "TSPropertySignature",
    ].includes(parent?.type) &&
    parent.key === node &&
    !parent.computed &&
    !parent.shorthand
  ) {
    return false;
  }

  if (
    [
      "BreakStatement",
      "ContinueStatement",
      "LabeledStatement",
    ].includes(parent?.type) &&
    parent.label === node
  ) {
    return false;
  }

  if (
    [
      "TSInterfaceDeclaration",
      "TSTypeAliasDeclaration",
    ].includes(parent?.type) &&
    parent.id === node
  ) {
    return false;
  }

  return !(
    parent?.type === "ImportSpecifier" &&
    parent.imported === node
  );
}

function isDirectGlobalRequireCall(sourceCode, node) {
  return (
    node?.type === "CallExpression" &&
    node.callee.type === "Identifier" &&
    isUnshadowedIdentifier(sourceCode, node.callee, "require")
  );
}

function isCanonicalModuleSource(source) {
  return source === "node:module" || source === "module";
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
      forbiddenLoaderCapability:
        "Runtime module-loader capabilities are forbidden in src. Use a direct require(...) call with a statically resolvable source.",
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
      checkSource(node, sourceFromImportNode(node, sourceCode));
    }

    function checkDynamicImport(node) {
      const source = sourceFromImportNode(node, sourceCode);
      checkSource(node, source, true);
      if (isCanonicalModuleSource(source)) {
        context.report({
          node,
          messageId: "forbiddenLoaderCapability",
        });
      }
    }

    function checkLoaderReexport(node) {
      checkImport(node);
      const source = sourceFromImportNode(node, sourceCode);
      if (
        !isCanonicalModuleSource(source) ||
        node.exportKind === "type"
      ) {
        return;
      }

      if (node.type === "ExportAllDeclaration") {
        context.report({
          node,
          messageId: "forbiddenLoaderCapability",
        });
        return;
      }

      for (const specifier of node.specifiers) {
        if (specifier.exportKind === "type") {
          continue;
        }

        const localName =
          specifier.type === "ExportSpecifier"
            ? specifier.local.name ?? specifier.local.value
            : undefined;
        if (
          specifier.type === "ExportDefaultSpecifier" ||
          specifier.type === "ExportNamespaceSpecifier" ||
          localName === "createRequire" ||
          localName === "Module" ||
          localName === "default"
        ) {
          context.report({
            node: specifier,
            messageId: "forbiddenLoaderCapability",
          });
        }
      }
    }

    function checkNormalizedImport(node) {
      const source = sourceFromImportNode(node, sourceCode);
      if (
        source &&
        (source.includes("//") ||
          source.includes("/../") ||
          source.includes("/./"))
      ) {
        checkSource(node, source);
      }
    }

    // Source files may call global require directly, but they may not retain
    // a dynamic loader capability whose later sources cannot be audited here.
    // The runtime node:module object is likewise allowed only through a safe,
    // statically named member or destructuring access.
    function checkLoaderIdentifier(node) {
      if (!isIdentifierReference(node)) {
        return;
      }

      if (isUnshadowedIdentifier(sourceCode, node, "require")) {
        const directCall =
          node.parent?.type === "CallExpression" &&
          node.parent.callee === node;
        if (!directCall) {
          context.report({
            node,
            messageId: "forbiddenLoaderCapability",
          });
        }
        return;
      }

      if (!isUnshadowedIdentifier(sourceCode, node, "module")) {
        return;
      }

      const parent = node.parent;
      const memberAccess =
        parent?.type === "MemberExpression" &&
        parent.object === node;
      const member = memberAccess
        ? memberName(parent, sourceCode)
        : undefined;
      if (
        !memberAccess ||
        member === "require" ||
        (parent.computed && member === undefined)
      ) {
        context.report({
          node,
          messageId: "forbiddenLoaderCapability",
        });
      }
    }

    function checkDirectRequire(node) {
      if (isDirectGlobalRequireCall(sourceCode, node)) {
        const source = literalString(node.arguments[0], sourceCode);
        checkSource(
          node,
          source,
          true,
        );
        if (
          isCanonicalModuleSource(source) &&
          !(
            node.parent?.type === "MemberExpression" &&
            node.parent.object === node
          ) &&
          !(
            node.parent?.type === "VariableDeclarator" &&
            node.parent.init === node &&
            node.parent.id.type === "ObjectPattern"
          ) &&
          !(
            node.parent?.type === "AssignmentExpression" &&
            node.parent.right === node &&
            node.parent.left.type === "ObjectPattern"
          )
        ) {
          context.report({
            node,
            messageId: "forbiddenLoaderCapability",
          });
        }
      }
    }

    function checkLoaderImport(node) {
      checkNormalizedImport(node);
      const source = sourceFromImportNode(node, sourceCode);
      if (
        !isCanonicalModuleSource(source) ||
        node.importKind === "type"
      ) {
        return;
      }

      for (const specifier of node.specifiers) {
        if (specifier.importKind === "type") {
          continue;
        }

        const importedName =
          specifier.type === "ImportSpecifier"
            ? specifier.imported.name ?? specifier.imported.value
            : undefined;
        if (
          specifier.type === "ImportDefaultSpecifier" ||
          specifier.type === "ImportNamespaceSpecifier" ||
          importedName === "createRequire" ||
          importedName === "Module"
        ) {
          context.report({
            node: specifier,
            messageId: "forbiddenLoaderCapability",
          });
        }
      }
    }

    function directCanonicalModuleRequire(node) {
      return (
        isDirectGlobalRequireCall(sourceCode, node) &&
        isCanonicalModuleSource(
          literalString(node.arguments[0], sourceCode),
        )
      );
    }

    function checkCanonicalModuleAccess(node) {
      const property = memberName(node, sourceCode);
      if (
        directCanonicalModuleRequire(unwrapExpression(node.object)) &&
        (
          property === "createRequire" ||
          (node.computed && property === undefined)
        )
      ) {
        context.report({
          node,
          messageId: "forbiddenLoaderCapability",
        });
      }
    }

    function checkCanonicalModulePattern(pattern, source) {
      if (
        pattern.type !== "ObjectPattern" ||
        !directCanonicalModuleRequire(unwrapExpression(source))
      ) {
        return;
      }

      for (const property of pattern.properties) {
        if (property.type === "RestElement") {
          context.report({
            node: property,
            messageId: "forbiddenLoaderCapability",
          });
          continue;
        }

        const name = property.computed
          ? literalString(property.key, sourceCode)
          : property.key.name ?? property.key.value;
        if (
          name === "createRequire" ||
          (property.computed && name === undefined)
        ) {
          context.report({
            node: property,
            messageId: "forbiddenLoaderCapability",
          });
        }
      }
    }

    function checkCanonicalModuleVariable(node) {
      checkCanonicalModulePattern(node.id, node.init);
    }

    function checkCanonicalModuleAssignment(node) {
      checkCanonicalModulePattern(node.left, node.right);
    }

    return {
      AssignmentExpression: checkCanonicalModuleAssignment,
      CallExpression: checkDirectRequire,
      ExportAllDeclaration: checkLoaderReexport,
      ExportNamedDeclaration: checkLoaderReexport,
      Identifier: checkLoaderIdentifier,
      ImportDeclaration: checkLoaderImport,
      ImportExpression: checkDynamicImport,
      MemberExpression: checkCanonicalModuleAccess,
      VariableDeclarator: checkCanonicalModuleVariable,
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

    function typeAt(node) {
      return checker.getTypeAtLocation(esTreeNodeToTSNodeMap.get(node));
    }

    function typeIsDecimal(receiverType, method) {
      return (
        (
          typeof method === "string" &&
          symbolComesFromDecimal(
            checker.getPropertyOfType(receiverType, method),
          )
        ) ||
        typeComesFromDecimal(receiverType)
      );
    }

    function receiverIsDecimal(node, method) {
      return typeIsDecimal(typeAt(node), method);
    }

    function propertyName(node) {
      const property =
        node.type === "Property" ? node.key : node.property;
      return node.computed
        ? literalString(property, sourceCode)
        : property.name ?? property.value;
    }

    function checkMember(node) {
      const method = propertyName(node);
      const object = node.object;
      const authorizedOperation =
        authorizedModule &&
        (method === "set" || method === "toDecimalPlaces");
      const unresolvedComputedMethod =
        node.computed && method === undefined;
      if (
        !authorizedOperation &&
        (
          decimalPolicyMethods.has(method) ||
          unresolvedComputedMethod
        ) &&
        receiverIsDecimal(object, method)
      ) {
        context.report({ node, messageId: "restrictedOperation" });
      }
    }

    function checkPattern(pattern, receiverType = typeAt(pattern)) {
      if (pattern.type === "AssignmentPattern") {
        checkPattern(pattern.left, receiverType);
        return;
      }

      if (pattern.type === "RestElement") {
        checkPattern(pattern.argument, receiverType);
        return;
      }

      if (pattern.type === "ArrayPattern") {
        for (const element of pattern.elements) {
          if (element) {
            checkPattern(element);
          }
        }
        return;
      }

      if (pattern.type === "TSParameterProperty") {
        checkPattern(pattern.parameter);
        return;
      }

      if (pattern.type !== "ObjectPattern") {
        return;
      }

      for (const property of pattern.properties) {
        if (property.type === "RestElement") {
          checkPattern(property.argument);
          continue;
        }

        const method = propertyName(property);
        const authorizedOperation =
          authorizedModule &&
          (method === "set" || method === "toDecimalPlaces");
        const unresolvedComputedMethod =
          property.computed && method === undefined;
        if (
          !authorizedOperation &&
          (
            decimalPolicyMethods.has(method) ||
            unresolvedComputedMethod
          ) &&
          typeIsDecimal(receiverType, method)
        ) {
          context.report({ node: property, messageId: "restrictedOperation" });
        }

        const propertySymbol =
          typeof method === "string"
            ? checker.getPropertyOfType(receiverType, method)
            : undefined;
        const propertyType = propertySymbol
          ? checker.getTypeOfSymbolAtLocation(
            propertySymbol,
            esTreeNodeToTSNodeMap.get(property.value),
          )
          : typeAt(property.value);
        checkPattern(property.value, propertyType);
      }
    }

    function checkAssignmentDestructuring(node) {
      checkPattern(node.left, typeAt(node.right));
    }

    function checkVariableDestructuring(node) {
      if (node.init) {
        checkPattern(node.id, typeAt(node.init));
      }
    }

    function checkForOfDestructuring(node) {
      const iterableType = typeAt(node.right);
      const elementType =
        checker.getElementTypeOfArrayType(iterableType) ??
        checker.getIndexTypeOfType(iterableType, ts.IndexKind.Number);
      if (node.left.type === "VariableDeclaration") {
        for (const declaration of node.left.declarations) {
          checkPattern(declaration.id, elementType ?? typeAt(declaration.id));
        }
      } else {
        checkPattern(node.left, elementType ?? typeAt(node.left));
      }
    }

    function checkFunctionParameters(node) {
      for (const parameter of node.params) {
        checkPattern(parameter);
      }
    }

    return {
      AssignmentExpression: checkAssignmentDestructuring,
      ArrowFunctionExpression: checkFunctionParameters,
      ForOfStatement: checkForOfDestructuring,
      FunctionDeclaration: checkFunctionParameters,
      FunctionExpression: checkFunctionParameters,
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
