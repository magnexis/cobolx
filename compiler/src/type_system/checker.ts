import type { BinaryExpressionNode, ExpressionNode, ProgramNode, StatementNode } from "../ast/types.js";
import type { Diagnostic } from "../diagnostics.js";
import type { CobolxType } from "../hir/types.js";

interface Scope {
  values: Map<string, CobolxType>;
  parent?: Scope;
}

function lookup(scope: Scope, name: string): CobolxType | undefined {
  return scope.values.get(name) ?? scope.parent?.values.get(name) ?? (scope.parent ? lookup(scope.parent, name) : undefined);
}

function inferExpression(expression: ExpressionNode, scope: Scope, diagnostics: Diagnostic[]): CobolxType {
  switch (expression.kind) {
    case "NumberLiteral":
      return "number";
    case "StringLiteral":
      return "string";
    case "BooleanLiteral":
      return "boolean";
    case "Identifier":
      return lookup(scope, expression.name) ?? "unknown";
    case "UnaryExpression":
      return inferExpression(expression.operand, scope, diagnostics);
    case "TryExpression":
      return inferExpression(expression.expression, scope, diagnostics);
    case "MemberExpression":
      return "unknown";
    case "CallExpression":
    case "MacroInvocation":
      for (const arg of expression.args) inferExpression(arg, scope, diagnostics);
      return "unknown";
    case "EnumConstructorExpression":
      for (const field of expression.fields) inferExpression(field, scope, diagnostics);
      return "enum";
    case "ArrayLiteral":
      for (const item of expression.items) inferExpression(item, scope, diagnostics);
      return "array";
    case "BinaryExpression":
      return inferBinaryExpression(expression, scope, diagnostics);
  }
}

function inferBinaryExpression(expression: BinaryExpressionNode, scope: Scope, diagnostics: Diagnostic[]): CobolxType {
  const left = inferExpression(expression.left, scope, diagnostics);
  const right = inferExpression(expression.right, scope, diagnostics);
  if (["+", "-", "*", "/", "%"].includes(expression.operator)) {
    if (left !== "number" || right !== "number") {
      diagnostics.push({ message: `Arithmetic operator '${expression.operator}' expects number operands`, severity: "warning", range: expression.range });
    }
    return "number";
  }
  if (["==", "!=", "<", "<=", ">", ">="].includes(expression.operator)) return "boolean";
  return "unknown";
}

export function inferProgramTypes(program: ProgramNode): { symbolTypes: Record<string, CobolxType>; diagnostics: Diagnostic[] } {
  const diagnostics: Diagnostic[] = [];
  const scope: Scope = { values: new Map() };
  for (const constant of program.consts) scope.values.set(constant.name, inferExpression(constant.expression, scope, diagnostics));

  const visitStatements = (statements: StatementNode[], localScope: Scope): void => {
    for (const statement of statements) {
      switch (statement.kind) {
        case "LetStatement":
          localScope.values.set(statement.binding.name, inferExpression(statement.expression, localScope, diagnostics));
          break;
        case "SetStatement":
          localScope.values.set(statement.name, inferExpression(statement.expression, localScope, diagnostics));
          break;
        case "InputStatement":
          localScope.values.set(statement.name, "string");
          if (statement.prompt) inferExpression(statement.prompt, localScope, diagnostics);
          break;
        case "DisplayStatement":
        case "ExpressionStatement":
        case "ReturnStatement":
        case "AssertStatement":
        case "SpawnStatement":
          inferExpression(statement.expression, localScope, diagnostics);
          break;
        case "IfStatement":
          inferExpression(statement.condition, localScope, diagnostics);
          visitStatements(statement.thenBranch, { values: new Map(localScope.values), parent: localScope.parent });
          visitStatements(statement.elseBranch, { values: new Map(localScope.values), parent: localScope.parent });
          break;
        case "MatchStatement":
          inferExpression(statement.expression, localScope, diagnostics);
          for (const arm of statement.arms) visitStatements(arm.body, { values: new Map(localScope.values), parent: localScope.parent });
          break;
        case "UnsafeBlock":
        case "BlockStatement":
          visitStatements(statement.body, { values: new Map(localScope.values), parent: localScope });
          break;
      }
    }
  };

  for (const fn of program.functions) {
    const fnScope: Scope = { values: new Map(), parent: scope };
    for (const param of fn.signature.params) fnScope.values.set(param.name, param.typeName === "STRING" ? "string" : "unknown");
    visitStatements(fn.body, fnScope);
  }

  visitStatements(program.body, scope);
  return { symbolTypes: Object.fromEntries(scope.values.entries()), diagnostics };
}
