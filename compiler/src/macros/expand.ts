import type {
  CallExpressionNode,
  ExpressionNode,
  MacroInvocationNode,
  ProgramNode,
  StatementNode
} from "../ast/types.js";

function rewriteExpression(expression: ExpressionNode): ExpressionNode {
  switch (expression.kind) {
    case "BinaryExpression":
      return { ...expression, left: rewriteExpression(expression.left), right: rewriteExpression(expression.right) };
    case "UnaryExpression":
      return { ...expression, operand: rewriteExpression(expression.operand) };
    case "TryExpression":
      return { ...expression, expression: rewriteExpression(expression.expression) };
    case "MemberExpression":
      return { ...expression, object: rewriteExpression(expression.object) };
    case "CallExpression":
      return { ...expression, callee: rewriteExpression(expression.callee), args: expression.args.map(rewriteExpression) };
    case "MacroInvocation":
      return macroToCall(expression);
    case "EnumConstructorExpression":
      return { ...expression, fields: expression.fields.map(rewriteExpression) };
    case "ArrayLiteral":
      return { ...expression, items: expression.items.map(rewriteExpression) };
    default:
      return expression;
  }
}

function rewriteStatement(statement: StatementNode): StatementNode {
  switch (statement.kind) {
    case "LetStatement":
      return { ...statement, expression: rewriteExpression(statement.expression) };
    case "SetStatement":
    case "DisplayStatement":
    case "ReturnStatement":
    case "ExpressionStatement":
    case "AssertStatement":
    case "SpawnStatement":
      return { ...statement, expression: rewriteExpression(statement.expression) };
    case "InputStatement":
      return { ...statement, prompt: statement.prompt ? rewriteExpression(statement.prompt) : undefined };
    case "IfStatement":
      return { ...statement, condition: rewriteExpression(statement.condition), thenBranch: statement.thenBranch.map(rewriteStatement), elseBranch: statement.elseBranch.map(rewriteStatement) };
    case "MatchStatement":
      return { ...statement, expression: rewriteExpression(statement.expression), arms: statement.arms.map((arm) => ({ ...arm, body: arm.body.map(rewriteStatement) })) };
    case "UnsafeBlock":
    case "BlockStatement":
      return { ...statement, body: statement.body.map(rewriteStatement) };
  }
}

function macroToCall(expression: MacroInvocationNode): CallExpressionNode {
  return {
    kind: "CallExpression",
    callee: { kind: "Identifier", name: `__macro_${expression.name}`, range: expression.range },
    args: expression.args.map(rewriteExpression),
    range: expression.range
  };
}

export function expandMacros(program: ProgramNode): ProgramNode {
  return {
    ...program,
    functions: program.functions.map((fn) => ({ ...fn, body: fn.body.map(rewriteStatement) })),
    macros: program.macros.map((macro) => ({
      ...macro,
      name: `__macro_${macro.name}`,
      body: macro.body.map(rewriteStatement)
    })),
    body: program.body.map(rewriteStatement)
  };
}
