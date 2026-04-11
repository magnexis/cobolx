import { parseSource } from "@cobolx/compiler";
function formatExpression(expression) {
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
            return `${expression.callee}(${expression.args.map(formatExpression).join(", ")})`;
    }
}
function formatStatement(statement, indent = "") {
    switch (statement.kind) {
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
    }
}
function formatProgram(program) {
    const lines = [`PROGRAM ${program.name}`, ""];
    for (const fn of program.functions) {
        lines.push(`FUNCTION ${fn.name}(${fn.params.join(", ")}) BEGIN`);
        lines.push(...fn.body.map((statement) => formatStatement(statement, "  ")));
        lines.push("END-FUNCTION", "");
    }
    lines.push("BEGIN");
    lines.push(...program.body.map((statement) => formatStatement(statement, "  ")));
    lines.push("END", "");
    return lines.join("\n");
}
export function formatSource(source) {
    return formatProgram(parseSource(source));
}
//# sourceMappingURL=index.js.map