function collectCalls(expression, calls) {
    switch (expression.kind) {
        case "CallExpression":
            calls.push(expression);
            for (const arg of expression.args) {
                collectCalls(arg, calls);
            }
            break;
        case "BinaryExpression":
            collectCalls(expression.left, calls);
            collectCalls(expression.right, calls);
            break;
        case "UnaryExpression":
            collectCalls(expression.operand, calls);
            break;
        default:
            break;
    }
}
function collectStatementCalls(statement, calls) {
    switch (statement.kind) {
        case "SetStatement":
        case "DisplayStatement":
        case "ReturnStatement":
        case "ExpressionStatement":
            collectCalls(statement.expression, calls);
            break;
        case "InputStatement":
            if (statement.prompt) {
                collectCalls(statement.prompt, calls);
            }
            break;
        case "IfStatement":
            collectCalls(statement.condition, calls);
            for (const child of statement.thenBranch) {
                collectStatementCalls(child, calls);
            }
            for (const child of statement.elseBranch) {
                collectStatementCalls(child, calls);
            }
            break;
    }
}
export function runBorrowChecker(hir) {
    const diagnostics = [];
    const mutationMap = new Map(hir.functions.map((fn) => [fn.name, fn.mutatedParams]));
    const calls = [];
    for (const statement of hir.program.body) {
        collectStatementCalls(statement, calls);
    }
    for (const fn of hir.program.functions) {
        for (const statement of fn.body) {
            collectStatementCalls(statement, calls);
        }
    }
    for (const call of calls) {
        const mutatedParams = mutationMap.get(call.callee) ?? [];
        if (mutatedParams.length < 2) {
            continue;
        }
        const identifiers = call.args.map((arg) => (arg.kind === "Identifier" ? arg.name : undefined));
        const seen = new Map();
        for (let index = 0; index < call.args.length; index += 1) {
            const identifier = identifiers[index];
            if (!identifier) {
                continue;
            }
            if (seen.has(identifier)) {
                diagnostics.push({
                    message: `Borrow checker: '${identifier}' is passed multiple times to mutating function '${call.callee}'`,
                    severity: "error",
                    range: call.range
                });
            }
            else {
                seen.set(identifier, index);
            }
        }
    }
    return diagnostics;
}
//# sourceMappingURL=checker.js.map