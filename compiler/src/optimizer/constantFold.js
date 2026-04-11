function foldExpression(expression) {
    if (expression.kind === "BinaryExpression") {
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
                    return { ...expression, kind: "NumberLiteral", value: left.value / right.value };
            }
        }
        return { ...expression, left, right };
    }
    if (expression.kind === "UnaryExpression") {
        return { ...expression, operand: foldExpression(expression.operand) };
    }
    if (expression.kind === "CallExpression") {
        return { ...expression, args: expression.args.map(foldExpression) };
    }
    return expression;
}
function foldStatement(statement) {
    switch (statement.kind) {
        case "SetStatement":
            return { ...statement, expression: foldExpression(statement.expression) };
        case "DisplayStatement":
        case "ReturnStatement":
        case "ExpressionStatement":
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
    }
}
function foldInstruction(instruction) {
    return {
        ...instruction,
        statement: foldStatement(instruction.statement)
    };
}
export function optimizeMIR(mir) {
    return {
        functions: mir.functions.map((fn) => ({
            ...fn,
            instructions: fn.instructions.map(foldInstruction)
        })),
        body: mir.body.map(foldInstruction)
    };
}
//# sourceMappingURL=constantFold.js.map