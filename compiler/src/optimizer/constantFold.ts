import type { ExpressionNode, StatementNode } from "../ast/types.js";
import type { MIRInstruction, MIRProgram } from "../mir/types.js";
import { CobolxError } from "../diagnostics.js";

function foldExpression(expression: ExpressionNode): ExpressionNode {
  switch (expression.kind) {
    case "BinaryExpression": {
      const left = foldExpression(expression.left);
      const right = foldExpression(expression.right);
      if (left.kind === "NumberLiteral" && right.kind === "NumberLiteral") {
        switch (expression.operator) {
          case "+":
            return { ...expression, kind: "NumberLiteral", value: left.value + right.value };
          case "-":
            return { ...expression, kind: "NumberLiteral", value: left.value - right.value };
          case "*":
            return { ...expression, kind: "NumberLiteral", value: left.value * right.value };
          case "/":
            if (right.value === 0) {
              throw new CobolxError({
                message: "Division by zero in constant expression",
                range: expression.range ?? { start: { line: 1, column: 1 }, end: { line: 1, column: 1 } },
                severity: "error",
              });
            }
            return { ...expression, kind: "NumberLiteral", value: left.value / right.value };
          case "%":
            if (right.value === 0) {
              throw new CobolxError({
                message: "Modulo by zero in constant expression",
                range: expression.range ?? { start: { line: 1, column: 1 }, end: { line: 1, column: 1 } },
                severity: "error",
              });
            }
            return { ...expression, kind: "NumberLiteral", value: left.value % right.value };
        }
      }
      return { ...expression, left, right };
    }
    case "UnaryExpression":
      return { ...expression, operand: foldExpression(expression.operand) };
    case "TryExpression":
      return { ...expression, expression: foldExpression(expression.expression) };
    case "CallExpression":
      return { ...expression, callee: foldExpression(expression.callee), args: expression.args.map(foldExpression) };
    case "MacroInvocation":
      return { ...expression, args: expression.args.map(foldExpression) };
    case "MemberExpression":
      return { ...expression, object: foldExpression(expression.object) };
    case "EnumConstructorExpression":
      return { ...expression, fields: expression.fields.map(foldExpression) };
    case "ArrayLiteral":
      return { ...expression, items: expression.items.map(foldExpression) };
    case "StringInterpolation":
      return { ...expression, expressions: expression.expressions.map(foldExpression) };
    default:
      return expression;
  }
}

function foldStatement(statement: StatementNode): StatementNode {
  switch (statement.kind) {
    case "LetStatement":
      return { ...statement, expression: foldExpression(statement.expression) };
    case "SetStatement":
      return { ...statement, expression: foldExpression(statement.expression) };
    case "DisplayStatement":
    case "ReturnStatement":
    case "ExpressionStatement":
    case "AssertStatement":
    case "SpawnStatement":
      return { ...statement, expression: foldExpression(statement.expression) };
    case "InputStatement":
      return { ...statement, prompt: statement.prompt ? foldExpression(statement.prompt) : undefined };
    case "IfStatement":
      return {
        ...statement,
        condition: foldExpression(statement.condition),
        thenBranch: statement.thenBranch.map(foldStatement),
        elseBranch: statement.elseBranch.map(foldStatement)
      };
    case "MatchStatement":
      return {
        ...statement,
        expression: foldExpression(statement.expression),
        arms: statement.arms.map((arm) => ({ ...arm, body: arm.body.map(foldStatement) }))
      };
    case "UnsafeBlock":
    case "BlockStatement":
      return { ...statement, body: statement.body.map(foldStatement) };
    case "ForStatement":
      return { ...statement, from: foldExpression(statement.from), to: foldExpression(statement.to), step: foldExpression(statement.step), body: statement.body.map(foldStatement) };
    case "WhileStatement":
      return { ...statement, condition: foldExpression(statement.condition), body: statement.body.map(foldStatement) };
    case "BreakStatement":
    case "ContinueStatement":
      return statement;
    case "TryStatement":
      return { ...statement, body: statement.body.map(foldStatement), catchBody: statement.catchBody ? statement.catchBody.map(foldStatement) : undefined };
    case "SwitchStatement":
      return { ...statement, expression: foldExpression(statement.expression), cases: statement.cases.map((c) => ({ ...c, body: c.body.map(foldStatement) })), defaultBody: statement.defaultBody ? statement.defaultBody.map(foldStatement) : undefined };
    default:
      return statement;
  }
}

function foldInstruction(instruction: MIRInstruction): MIRInstruction {
  return {
    ...instruction,
    statement: foldStatement(instruction.statement)
  };
}

export function optimizeMIR(mir: MIRProgram): MIRProgram {
  return {
    functions: mir.functions.map((fn) => ({
      ...fn,
      instructions: fn.instructions.map(foldInstruction)
    })),
    body: mir.body.map(foldInstruction)
  };
}
