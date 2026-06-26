import type { CallExpressionNode, ExpressionNode, StatementNode } from "../ast/types.js";
import type { Diagnostic } from "../diagnostics.js";
import type { HIRProgram } from "../hir/types.js";

function collectCalls(expression: ExpressionNode, calls: CallExpressionNode[]): void {
  switch (expression.kind) {
    case "CallExpression":
      calls.push(expression);
      collectCalls(expression.callee, calls);
      for (const arg of expression.args) collectCalls(arg, calls);
      break;
    case "BinaryExpression":
      collectCalls(expression.left, calls);
      collectCalls(expression.right, calls);
      break;
    case "UnaryExpression":
      collectCalls(expression.operand, calls);
      break;
    case "TryExpression":
      collectCalls(expression.expression, calls);
      break;
    case "MemberExpression":
      collectCalls(expression.object, calls);
      break;
    case "MacroInvocation":
      for (const arg of expression.args) collectCalls(arg, calls);
      break;
    case "EnumConstructorExpression":
      for (const field of expression.fields) collectCalls(field, calls);
      break;
    case "ArrayLiteral":
      for (const item of expression.items) collectCalls(item, calls);
      break;
    default:
      break;
  }
}

function collectStatementCalls(statement: StatementNode, calls: CallExpressionNode[]): void {
  switch (statement.kind) {
    case "LetStatement":
      collectCalls(statement.expression, calls);
      break;
    case "SetStatement":
    case "DisplayStatement":
    case "ReturnStatement":
    case "ExpressionStatement":
    case "AssertStatement":
    case "SpawnStatement":
      collectCalls(statement.expression, calls);
      break;
    case "InputStatement":
      if (statement.prompt) collectCalls(statement.prompt, calls);
      break;
    case "IfStatement":
      collectCalls(statement.condition, calls);
      for (const child of statement.thenBranch) collectStatementCalls(child, calls);
      for (const child of statement.elseBranch) collectStatementCalls(child, calls);
      break;
    case "MatchStatement":
      collectCalls(statement.expression, calls);
      for (const arm of statement.arms) for (const child of arm.body) collectStatementCalls(child, calls);
      break;
    case "UnsafeBlock":
    case "BlockStatement":
      for (const child of statement.body) collectStatementCalls(child, calls);
      break;
  }
}

export function runBorrowChecker(hir: HIRProgram): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const mutationMap = new Map(hir.functions.map((fn) => [fn.name, fn.mutatedParams]));
  const calls: CallExpressionNode[] = [];

  for (const statement of hir.program.body) collectStatementCalls(statement, calls);
  for (const fn of hir.program.functions) for (const statement of fn.body) collectStatementCalls(statement, calls);

  for (const call of calls) {
    if (call.callee.kind !== "Identifier") continue;
    const calleeName = call.callee.name;
    const mutatedParams = mutationMap.get(calleeName) ?? [];
    if (mutatedParams.length < 2) continue;
    const identifiers = call.args.map((arg) => (arg.kind === "Identifier" ? arg.name : undefined));
    const seen = new Set<string>();
    for (const identifier of identifiers) {
      if (!identifier) continue;
      if (seen.has(identifier)) {
        diagnostics.push({
          message: `Borrow checker: '${identifier}' is passed multiple times to mutating function '${calleeName}'`,
          severity: "error",
          range: call.range
        });
      }
      seen.add(identifier);
    }
  }

  return diagnostics;
}
