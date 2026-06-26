import path from "node:path";
class EmitScope {
    parent;
    declarations = new Set();
    constructor(parent) {
        this.parent = parent;
    }
    has(name) {
        if (this.declarations.has(name)) {
            return true;
        }
        return this.parent?.has(name) ?? false;
    }
    declare(name) {
        this.declarations.add(name);
    }
}
function emitExpression(expression) {
    switch (expression.kind) {
        case "NumberLiteral":
            return String(expression.value);
        case "StringLiteral":
            return JSON.stringify(expression.value);
        case "BooleanLiteral":
            return expression.value ? "true" : "false";
        case "Identifier":
            return expression.name;
        case "UnaryExpression":
            return `${expression.operator}${emitExpression(expression.operand)}`;
        case "BinaryExpression":
            return `(${emitExpression(expression.left)} ${expression.operator} ${emitExpression(expression.right)})`;
        case "CallExpression":
            return `${expression.callee}(${expression.args.map(emitExpression).join(", ")})`;
    }
}
function emitStatement(statement, indent, scope) {
    switch (statement.kind) {
        case "SetStatement":
            if (scope.has(statement.name)) {
                return `${indent}${statement.name} = ${emitExpression(statement.expression)};`;
            }
            scope.declare(statement.name);
            return `${indent}let ${statement.name} = ${emitExpression(statement.expression)};`;
        case "DisplayStatement":
            return `${indent}display(${emitExpression(statement.expression)});`;
        case "InputStatement":
            if (scope.has(statement.name)) {
                return `${indent}${statement.name} = input(${statement.prompt ? emitExpression(statement.prompt) : "\"\""});`;
            }
            scope.declare(statement.name);
            return `${indent}let ${statement.name} = input(${statement.prompt ? emitExpression(statement.prompt) : "\"\""});`;
        case "IfStatement": {
            const thenScope = new EmitScope(scope);
            const elseScope = new EmitScope(scope);
            const thenBranch = statement.thenBranch.map((child) => emitStatement(child, `${indent}  `, thenScope)).join("\n");
            const elseBranch = statement.elseBranch.map((child) => emitStatement(child, `${indent}  `, elseScope)).join("\n");
            const elseSection = elseBranch ? `\n${indent}else {\n${elseBranch}\n${indent}}` : "";
            return `${indent}if (${emitExpression(statement.condition)}) {\n${thenBranch}\n${indent}}${elseSection}`;
        }
        case "ReturnStatement":
            return `${indent}return ${emitExpression(statement.expression)};`;
        case "ExpressionStatement":
            return `${indent}${emitExpression(statement.expression)};`;
    }
}
function emitFunction(fn) {
    const scope = new EmitScope();
    for (const param of fn.params) {
        scope.declare(param);
    }
    const body = fn.body.map((statement) => emitStatement(statement, "  ", scope)).join("\n");
    return `function ${fn.name}(${fn.params.join(", ")}) {\n${body}\n}`;
}
export function generateJavaScript(program, outputFilePath, stdlibDir) {
    const runtimeImport = path.relative(path.dirname(outputFilePath), path.join(stdlibDir, "runtime.js")).replace(/\\/g, "/");
    const runtimePath = runtimeImport.startsWith(".") ? runtimeImport : `./${runtimeImport}`;
    const functionOutput = program.functions.map(emitFunction).join("\n\n");
    const bodyScope = new EmitScope();
    const bodyOutput = program.body.map((statement) => emitStatement(statement, "  ", bodyScope)).join("\n");
    return `import { display, input, math, strings } from "${runtimePath}";

${functionOutput ? `${functionOutput}\n\n` : ""}function main() {
${bodyOutput}
}

main();
`;
}
//# sourceMappingURL=javascript.js.map