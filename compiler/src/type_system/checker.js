function lookup(scope, name) {
    return scope.values.get(name) ?? (scope.parent ? lookup(scope.parent, name) : undefined);
}
function inferExpression(expression, scope, diagnostics) {
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
        case "CallExpression":
            for (const arg of expression.args) {
                inferExpression(arg, scope, diagnostics);
            }
            return "unknown";
        case "BinaryExpression":
            return inferBinaryExpression(expression, scope, diagnostics);
    }
}
function inferBinaryExpression(expression, scope, diagnostics) {
    const left = inferExpression(expression.left, scope, diagnostics);
    const right = inferExpression(expression.right, scope, diagnostics);
    if (["+", "-", "*", "/"].includes(expression.operator)) {
        if (left !== "number" || right !== "number") {
            diagnostics.push({
                message: `Arithmetic operator '${expression.operator}' expects number operands`,
                severity: "warning",
                range: expression.range
            });
        }
        return "number";
    }
    if (["==", "!=", "<", "<=", ">", ">="].includes(expression.operator)) {
        return "boolean";
    }
    return "unknown";
}
export function inferProgramTypes(program) {
    const diagnostics = [];
    const scope = { values: new Map() };
    const visitStatements = (statements, localScope) => {
        for (const statement of statements) {
            switch (statement.kind) {
                case "SetStatement":
                    localScope.values.set(statement.name, inferExpression(statement.expression, localScope, diagnostics));
                    break;
                case "InputStatement":
                    localScope.values.set(statement.name, "string");
                    if (statement.prompt) {
                        inferExpression(statement.prompt, localScope, diagnostics);
                    }
                    break;
                case "DisplayStatement":
                case "ExpressionStatement":
                case "ReturnStatement":
                    inferExpression(statement.expression, localScope, diagnostics);
                    break;
                case "IfStatement":
                    inferExpression(statement.condition, localScope, diagnostics);
                    visitStatements(statement.thenBranch, { values: new Map(localScope.values), parent: localScope.parent });
                    visitStatements(statement.elseBranch, { values: new Map(localScope.values), parent: localScope.parent });
                    break;
            }
        }
    };
    for (const fn of program.functions) {
        const fnScope = { values: new Map(), parent: scope };
        for (const param of fn.params) {
            fnScope.values.set(param, "unknown");
        }
        visitStatements(fn.body, fnScope);
    }
    visitStatements(program.body, scope);
    return {
        symbolTypes: Object.fromEntries(scope.values.entries()),
        diagnostics
    };
}
//# sourceMappingURL=checker.js.map