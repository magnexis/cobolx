import type { ConstDeclarationNode, ExpressionNode, ProgramNode } from "../ast/types.js";

function evaluateExpression(expression: ExpressionNode, values: Map<string, number | string | boolean>): number | string | boolean | undefined {
  switch (expression.kind) {
    case "NumberLiteral":
      return expression.value;
    case "StringLiteral":
      return expression.value;
    case "BooleanLiteral":
      return expression.value;
    case "Identifier":
      return values.get(expression.name);
    case "UnaryExpression": {
      const value = evaluateExpression(expression.operand, values);
      if (typeof value === "number" && expression.operator === "-") return -value;
      if (typeof value === "boolean" && expression.operator === "!") return !value;
      return undefined;
    }
    case "BinaryExpression": {
      const left = evaluateExpression(expression.left, values);
      const right = evaluateExpression(expression.right, values);
      if (typeof left === "number" && typeof right === "number") {
        switch (expression.operator) {
          case "+":
            return left + right;
          case "-":
            return left - right;
          case "*":
            return left * right;
          case "/":
            return left / right;
          case "%":
            return left % right;
        }
      }
      if (expression.operator === "==" && left !== undefined && right !== undefined) return left === right;
      return undefined;
    }
    default:
      return undefined;
  }
}

function literalNode(constant: ConstDeclarationNode, value: number | string | boolean): ExpressionNode {
  if (typeof value === "number") return { kind: "NumberLiteral", value, range: constant.range };
  if (typeof value === "boolean") return { kind: "BooleanLiteral", value, range: constant.range };
  return { kind: "StringLiteral", value, range: constant.range };
}

export function evaluateConstDeclarations(program: ProgramNode): ProgramNode {
  const values = new Map<string, number | string | boolean>();
  const consts = program.consts.map((constant) => {
    const evaluated = evaluateExpression(constant.expression, values);
    if (evaluated !== undefined) values.set(constant.name, evaluated);
    return evaluated === undefined ? constant : { ...constant, expression: literalNode(constant, evaluated) };
  });
  return { ...program, consts };
}
