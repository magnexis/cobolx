import type { ExpressionNode, PatternNode, ProgramNode, StatementNode } from "@cobolx/compiler";
import { parseSource } from "@cobolx/compiler";

function formatExpression(expression: ExpressionNode): string {
  switch (expression.kind) {
    case "NumberLiteral":
      return String(expression.value);
    case "StringLiteral":
      return JSON.stringify(expression.value);
    case "BooleanLiteral":
      return expression.value ? "TRUE" : "FALSE";
    case "Identifier":
      return expression.name;
    case "UnaryExpression":
      return `${expression.operator}${formatExpression(expression.operand)}`;
    case "BinaryExpression":
      return `${formatExpression(expression.left)} ${expression.operator} ${formatExpression(expression.right)}`;
    case "CallExpression":
      return `${formatExpression(expression.callee)}(${expression.args.map(formatExpression).join(", ")})`;
    case "TryExpression":
      return `${formatExpression(expression.expression)}?`;
    case "MacroInvocation":
      return `${expression.name}!(${expression.args.map(formatExpression).join(", ")})`;
    case "MemberExpression":
      return `${formatExpression(expression.object)}.${expression.property}`;
    case "EnumConstructorExpression":
      return `${expression.variantName}(${expression.fields.map(formatExpression).join(", ")})`;
    case "ArrayLiteral":
      return `[${expression.items.map(formatExpression).join(", ")}]`;
  }
}

function formatStatement(statement: StatementNode, indent = ""): string {
  switch (statement.kind) {
    case "LetStatement":
      return `${indent}LET ${statement.isMutable ? "MUT " : ""}${statement.binding.name} = ${formatExpression(statement.expression)}`;
    case "SetStatement":
      return `${indent}SET ${statement.name} = ${formatExpression(statement.expression)}`;
    case "DisplayStatement":
      return `${indent}DISPLAY ${formatExpression(statement.expression)}`;
    case "InputStatement":
      return `${indent}INPUT ${statement.name}${statement.prompt ? ` ${formatExpression(statement.prompt)}` : ""}`;
    case "ReturnStatement":
      return `${indent}RETURN ${formatExpression(statement.expression)}`;
    case "ExpressionStatement":
      return `${indent}${formatExpression(statement.expression)}`;
    case "AssertStatement":
      return `${indent}ASSERT ${formatExpression(statement.expression)}`;
    case "SpawnStatement":
      return `${indent}SPAWN ${formatExpression(statement.expression)}`;
    case "IfStatement": {
      const thenLines = statement.thenBranch.map((child) => formatStatement(child, `${indent}  `));
      const elseLines = statement.elseBranch.map((child) => formatStatement(child, `${indent}  `));
      const body = [`${indent}IF ${formatExpression(statement.condition)} THEN`, ...thenLines];
      if (elseLines.length > 0) {
        body.push(`${indent}ELSE`, ...elseLines);
      }
      body.push(`${indent}END-IF`);
      return body.join("\n");
    }
    case "MatchStatement": {
      const arms = statement.arms.map((arm) => `${indent}  ${formatPattern(arm.pattern)}:\n${arm.body.map((child) => formatStatement(child, `${indent}    `)).join("\n")}`);
      return [`${indent}MATCH ${formatExpression(statement.expression)}:`, ...arms, `${indent}END-MATCH`].join("\n");
    }
    case "UnsafeBlock":
      return [`${indent}UNSAFE`, `${indent}BEGIN`, ...statement.body.map((child) => formatStatement(child, `${indent}  `)), `${indent}END-UNSAFE`].join("\n");
    case "BlockStatement":
      return statement.body.map((child) => formatStatement(child, indent)).join("\n");
  }
}

function formatPattern(pattern: PatternNode): string {
  switch (pattern.kind) {
    case "WildcardPattern":
      return "_";
    case "IdentifierPattern":
      return pattern.name;
    case "VariantPattern":
      return `${pattern.variantName}(${pattern.bindings.join(", ")})`;
    case "LiteralPattern":
      return formatExpression(pattern.expression);
    default:
      return "_";
  }
}

function formatProgram(program: ProgramNode): string {
  const lines = [`PROGRAM ${program.name}`, ""];
  for (const constant of program.consts) lines.push(`CONST ${constant.name} = ${formatExpression(constant.expression)}`);
  for (const fn of program.functions) {
    lines.push(`${fn.signature.isAsync ? "ASYNC " : ""}FUNCTION ${fn.signature.name}(${fn.signature.params.map((param) => param.name).join(", ")}) BEGIN`);
    lines.push(...fn.body.map((statement) => formatStatement(statement, "  ")));
    lines.push("END-FUNCTION", "");
  }
  lines.push("BEGIN");
  lines.push(...program.body.map((statement) => formatStatement(statement, "  ")));
  lines.push("END", "");
  return lines.join("\n");
}

export function formatSource(source: string): string {
  return formatProgram(parseSource(source));
}
