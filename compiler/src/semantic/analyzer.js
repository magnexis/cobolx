class Scope {
    parent;
    values = new Set();
    constructor(parent) {
        this.parent = parent;
    }
    declare(name) {
        this.values.add(name);
    }
    has(name) {
        if (this.values.has(name)) {
            return true;
        }
        return this.parent?.has(name) ?? false;
    }
}
export class SemanticAnalyzer {
    analyze(program) {
        const diagnostics = [];
        const functions = new Map();
        for (const fn of program.functions) {
            if (functions.has(fn.name)) {
                diagnostics.push({
                    message: `Function '${fn.name}' is already declared`,
                    range: fn.range,
                    severity: "error"
                });
            }
            else {
                functions.set(fn.name, { params: fn.params, declaration: fn });
            }
        }
        for (const fn of program.functions) {
            const scope = new Scope();
            for (const param of fn.params) {
                scope.declare(param);
            }
            this.analyzeStatements(fn.body, scope, functions, diagnostics, true);
        }
        this.analyzeStatements(program.body, new Scope(), functions, diagnostics, false);
        return diagnostics;
    }
    analyzeStatements(statements, scope, functions, diagnostics, insideFunction) {
        for (const statement of statements) {
            switch (statement.kind) {
                case "SetStatement":
                    this.analyzeExpression(statement.expression, scope, functions, diagnostics);
                    scope.declare(statement.name);
                    break;
                case "DisplayStatement":
                    this.analyzeExpression(statement.expression, scope, functions, diagnostics);
                    break;
                case "InputStatement":
                    if (statement.prompt) {
                        this.analyzeExpression(statement.prompt, scope, functions, diagnostics);
                    }
                    scope.declare(statement.name);
                    break;
                case "IfStatement":
                    this.analyzeIfStatement(statement, scope, functions, diagnostics, insideFunction);
                    break;
                case "ReturnStatement":
                    if (!insideFunction) {
                        diagnostics.push({
                            message: "RETURN can only be used inside a FUNCTION",
                            range: statement.range,
                            severity: "error"
                        });
                    }
                    this.analyzeExpression(statement.expression, scope, functions, diagnostics);
                    break;
                case "ExpressionStatement":
                    this.analyzeExpression(statement.expression, scope, functions, diagnostics);
                    break;
            }
        }
    }
    analyzeIfStatement(statement, scope, functions, diagnostics, insideFunction) {
        this.analyzeExpression(statement.condition, scope, functions, diagnostics);
        this.analyzeStatements(statement.thenBranch, new Scope(scope), functions, diagnostics, insideFunction);
        this.analyzeStatements(statement.elseBranch, new Scope(scope), functions, diagnostics, insideFunction);
    }
    analyzeExpression(expression, scope, functions, diagnostics) {
        switch (expression.kind) {
            case "Identifier":
                this.analyzeIdentifier(expression, scope, diagnostics);
                break;
            case "BinaryExpression":
                this.analyzeExpression(expression.left, scope, functions, diagnostics);
                this.analyzeExpression(expression.right, scope, functions, diagnostics);
                break;
            case "UnaryExpression":
                this.analyzeExpression(expression.operand, scope, functions, diagnostics);
                break;
            case "CallExpression":
                this.analyzeCallExpression(expression, scope, functions, diagnostics);
                break;
            case "NumberLiteral":
            case "StringLiteral":
            case "BooleanLiteral":
                break;
        }
    }
    analyzeIdentifier(expression, scope, diagnostics) {
        if (!scope.has(expression.name) && !this.isStdlibSymbol(expression.name)) {
            diagnostics.push({
                message: `Variable '${expression.name}' is not defined`,
                range: expression.range,
                severity: "error"
            });
        }
    }
    analyzeCallExpression(expression, scope, functions, diagnostics) {
        for (const arg of expression.args) {
            this.analyzeExpression(arg, scope, functions, diagnostics);
        }
        if (this.isStdlibCall(expression.callee)) {
            return;
        }
        const fn = functions.get(expression.callee);
        if (!fn) {
            diagnostics.push({
                message: `Function '${expression.callee}' is not defined`,
                range: expression.range,
                severity: "error"
            });
            return;
        }
        if (fn.params.length !== expression.args.length) {
            diagnostics.push({
                message: `Function '${expression.callee}' expects ${fn.params.length} argument(s) but received ${expression.args.length}`,
                range: expression.range,
                severity: "error"
            });
        }
    }
    isStdlibSymbol(name) {
        return name === "math" || name === "strings";
    }
    isStdlibCall(name) {
        return name === "display" || name === "input";
    }
}
//# sourceMappingURL=analyzer.js.map