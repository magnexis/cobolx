import path from "node:path";
import type {
  ConstDeclarationNode,
  ExpressionNode,
  FunctionDeclarationNode,
  MatchArmNode,
  PatternNode,
  ProgramNode,
  StatementNode
} from "../ast/types.js";

class EmitScope {
  private readonly declarations = new Set<string>();
  constructor(private readonly parent?: EmitScope) {}
  has(name: string): boolean {
    if (this.declarations.has(name)) return true;
    return this.parent?.has(name) ?? false;
  }
  declare(name: string): void {
    this.declarations.add(name);
  }
}

function emitPattern(pattern: PatternNode, valueRef: string): { condition: string; bindings: string[] } {
  switch (pattern.kind) {
    case "WildcardPattern":
      return { condition: "true", bindings: [] };
    case "IdentifierPattern":
      return { condition: "true", bindings: [`const ${pattern.name} = ${valueRef};`] };
    case "LiteralPattern":
      return { condition: `${valueRef} === ${emitExpression(pattern.expression)}`, bindings: [] };
    case "VariantPattern":
      return {
        condition: `${valueRef}?.tag === ${JSON.stringify(pattern.variantName)}`,
        bindings: pattern.bindings.map((binding, index) => `const ${binding} = ${valueRef}.values[${index}];`)
      };
  }
}

function emitExpression(expression: ExpressionNode): string {
  switch (expression.kind) {
    case "NumberLiteral":
      return String(expression.value);
    case "StringLiteral":
      return JSON.stringify(expression.value);
    case "BooleanLiteral":
      return expression.value ? "true" : "false";
    case "Identifier":
      return expression.name;
    case "ArrayLiteral":
      return `[${expression.items.map(emitExpression).join(", ")}]`;
    case "UnaryExpression":
      return `${expression.operator}${emitExpression(expression.operand)}`;
    case "BinaryExpression":
      return `(${emitExpression(expression.left)} ${expression.operator} ${emitExpression(expression.right)})`;
    case "CallExpression":
      return `${emitExpression(expression.callee)}(${expression.args.map(emitExpression).join(", ")})`;
    case "MacroInvocation":
      return `${expression.name}(${expression.args.map(emitExpression).join(", ")})`;
    case "TryExpression":
      return `__propagate(${emitExpression(expression.expression)})`;
    case "MemberExpression":
      return `${emitExpression(expression.object)}.${expression.property}`;
    case "EnumConstructorExpression":
      return `__variant(${JSON.stringify(expression.variantName)}, [${expression.fields.map(emitExpression).join(", ")}])`;
    case "StringInterpolation": {
      if (expression.expressions.length === 0) return JSON.stringify(expression.quasis.join(""));
      let tpl = "`";
      for (let i = 0; i < expression.quasis.length; i++) {
        tpl += expression.quasis[i].replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");
        if (i < expression.expressions.length) {
          tpl += "${" + emitExpression(expression.expressions[i]) + "}";
        }
      }
      tpl += "`";
      return tpl;
    }
  }
}

function emitStatement(statement: StatementNode, indent: string, scope: EmitScope): string {
  switch (statement.kind) {
    case "LetStatement": {
      const name = statement.binding.name;
      if (!scope.has(name)) scope.declare(name);
      return `${indent}${statement.isMutable ? "let" : "const"} ${name} = ${emitExpression(statement.expression)};\n${indent}__debug.set(${JSON.stringify(name)}, ${name});`;
    }
    case "SetStatement":
      if (scope.has(statement.name)) {
        return `${indent}${statement.name} = ${emitExpression(statement.expression)};\n${indent}__debug.set(${JSON.stringify(statement.name)}, ${statement.name});`;
      }
      scope.declare(statement.name);
      return `${indent}let ${statement.name} = ${emitExpression(statement.expression)};\n${indent}__debug.set(${JSON.stringify(statement.name)}, ${statement.name});`;
    case "DisplayStatement":
      return `${indent}__debug.record(${JSON.stringify("display")});\n${indent}display(${emitExpression(statement.expression)});`;
    case "InputStatement":
      if (scope.has(statement.name)) {
        return `${indent}${statement.name} = input(${statement.prompt ? emitExpression(statement.prompt) : "\"\""});\n${indent}__debug.set(${JSON.stringify(statement.name)}, ${statement.name});`;
      }
      scope.declare(statement.name);
      return `${indent}let ${statement.name} = input(${statement.prompt ? emitExpression(statement.prompt) : "\"\""});\n${indent}__debug.set(${JSON.stringify(statement.name)}, ${statement.name});`;
    case "IfStatement": {
      const thenScope = new EmitScope(scope);
      const elseScope = new EmitScope(scope);
      const thenBranch = statement.thenBranch.map((child) => emitStatement(child, `${indent}  `, thenScope)).join("\n");
      const elseBranch = statement.elseBranch.map((child) => emitStatement(child, `${indent}  `, elseScope)).join("\n");
      const elseSection = elseBranch ? `\n${indent}else {\n${elseBranch}\n${indent}}` : "";
      return `${indent}if (${emitExpression(statement.condition)}) {\n${thenBranch}\n${indent}}${elseSection}`;
    }
    case "ForStatement": {
      const forScope = new EmitScope(scope);
      if (!forScope.has(statement.variable)) forScope.declare(statement.variable);
      const body = statement.body.map((child) => emitStatement(child, `${indent}  `, forScope)).join("\n");
      const stepExpr = emitExpression(statement.step);
      const stepIsOne = statement.step.kind === "NumberLiteral" && statement.step.value === 1;
      if (stepIsOne) {
        return `${indent}for (let ${statement.variable} = ${emitExpression(statement.from)}; ${statement.variable} <= ${emitExpression(statement.to)}; ${statement.variable}++) {\n${body}\n${indent}}`;
      }
      return `${indent}for (let ${statement.variable} = ${emitExpression(statement.from)}; ${statement.variable} <= ${emitExpression(statement.to)}; ${statement.variable} += ${stepExpr}) {\n${body}\n${indent}}`;
    }
    case "MatchStatement":
      return emitMatchStatement(statement.arms, emitExpression(statement.expression), indent, scope);
    case "UnsafeBlock":
      return `${indent}{\n${indent}  __debug.record(${JSON.stringify("unsafe:enter")});\n${indent}  // unsafe block\n${statement.body.map((child) => emitStatement(child, `${indent}  `, new EmitScope(scope))).join("\n")}\n${indent}  __debug.record(${JSON.stringify("unsafe:exit")});\n${indent}}`;
    case "AssertStatement":
      return `${indent}if (!(${emitExpression(statement.expression)})) throw new Error("Assertion failed");\n${indent}__debug.record(${JSON.stringify("assert")});`;
    case "SpawnStatement":
      return `${indent}__debug.record(${JSON.stringify("spawn")});\n${indent}spawn(() => ${emitExpression(statement.expression)});`;
    case "BlockStatement":
      return `${indent}{\n${statement.body.map((child) => emitStatement(child, `${indent}  `, new EmitScope(scope))).join("\n")}\n${indent}}`;
    case "ReturnStatement":
      return `${indent}__debug.record(${JSON.stringify("return")});\n${indent}return ${emitExpression(statement.expression)};`;
    case "ExpressionStatement":
      return `${indent}${emitExpression(statement.expression)};\n${indent}__debug.record(${JSON.stringify("expression")});`;
  }
}

function emitMatchStatement(arms: MatchArmNode[], valueExpression: string, indent: string, scope: EmitScope): string {
  const ref = "__matchValue";
  const lines = [`${indent}{`, `${indent}  const ${ref} = ${valueExpression};`];
  arms.forEach((arm, index) => {
    const pattern = emitPattern(arm.pattern, ref);
    lines.push(`${indent}  ${index === 0 ? "if" : "else if"} (${pattern.condition}) {`);
    for (const binding of pattern.bindings) lines.push(`${indent}    ${binding}`);
    const armScope = new EmitScope(scope);
    lines.push(...arm.body.map((child) => emitStatement(child, `${indent}    `, armScope)));
    lines.push(`${indent}  }`);
  });
  lines.push(`${indent}}`);
  return lines.join("\n");
}

function emitFunction(fn: FunctionDeclarationNode): string {
  const scope = new EmitScope();
  for (const param of fn.signature.params) scope.declare(param.name);
  const asyncKeyword = fn.signature.isAsync ? "async " : "";
  const body = fn.body.map((statement) => emitStatement(statement, "  ", scope)).join("\n");
  return `${asyncKeyword}function ${fn.signature.name}(${fn.signature.params.map((param) => param.name).join(", ")}) {\n${body}\n}`;
}

function emitConst(constant: ConstDeclarationNode): string {
  return `const ${constant.name} = ${emitExpression(constant.expression)};`;
}

export function generateJavaScript(program: ProgramNode, outputFilePath: string, stdlibDir: string): string {
  const runtimeImport = path.relative(path.dirname(outputFilePath), path.join(stdlibDir, "runtime.js")).replace(/\\/g, "/");
  const runtimePath = runtimeImport.startsWith(".") ? runtimeImport : `./${runtimeImport}`;
  const exports = program.exports.map((item) => item.name);
  const bodyScope = new EmitScope();
  const macroFunctions = program.macros.map((macro) =>
    `function ${macro.name}(${macro.params.join(", ")}) {\n${macro.body.map((statement) => emitStatement(statement, "  ", new EmitScope())).join("\n")}\n}`
  );
  const enumHelpers = program.enums.flatMap((enumDecl) =>
    enumDecl.variants.map((variant) => `const ${variant.name} = (...values) => __variant(${JSON.stringify(variant.name)}, values);`)
  );

  return `import { display, input, math, strings, Result, Option, iter, spawn, channel, createDebuggerContext } from "${runtimePath}";
${program.imports.map((item) => `import * as ${item.alias ?? item.importedName} from ${JSON.stringify(item.modulePath.replace(/\\.cbx$/i, ".mjs"))};`).join("\n")}

function __variant(tag, values) { return { tag, values }; }
function __propagate(value) { if (value && value.tag === "ERR") throw new Error(String(value.values?.[0] ?? "propagated error")); return value?.tag === "OK" ? value.values[0] : value; }
const __debug = createDebuggerContext();

${program.consts.map(emitConst).join("\n")}
${enumHelpers.join("\n")}
${macroFunctions.join("\n\n")}
${program.functions.map(emitFunction).join("\n\n")}

function main() {
  __debug.record("main:start");
${program.body.map((statement) => emitStatement(statement, "  ", bodyScope)).join("\n")}
  __debug.record("main:end");
}

main();
${exports.length > 0 ? `\nexport { ${exports.join(", ")} };` : ""}
`;
}
