import { CobolxError } from "../diagnostics.js";
export class Parser {
    tokens;
    index = 0;
    constructor(tokens) {
        this.tokens = tokens;
    }
    parseProgram() {
        this.skipNewlines();
        const programToken = this.consume("PROGRAM", "Expected PROGRAM declaration");
        const name = this.consume("IDENTIFIER", "Expected program name");
        this.skipNewlines();
        const functions = [];
        while (this.match("FUNCTION")) {
            functions.push(this.parseFunction());
            this.skipNewlines();
        }
        this.consume("BEGIN", "Expected BEGIN");
        this.skipNewlines();
        const body = this.parseStatementsUntil(["END"]);
        const endToken = this.consume("END", "Expected END");
        this.skipNewlines();
        this.consume("EOF", "Expected end of file");
        return {
            kind: "Program",
            name: name.lexeme,
            functions,
            body,
            range: this.mergeRanges(programToken.range, endToken.range)
        };
    }
    parseFunction() {
        const functionToken = this.previous();
        const name = this.consume("IDENTIFIER", "Expected function name");
        this.consume("LPAREN", "Expected ( after function name");
        const params = [];
        if (!this.check("RPAREN")) {
            do {
                params.push(this.consume("IDENTIFIER", "Expected parameter name").lexeme);
            } while (this.match("COMMA"));
        }
        this.consume("RPAREN", "Expected ) after parameters");
        this.skipNewlines();
        this.consume("BEGIN", "Expected BEGIN after function signature");
        this.skipNewlines();
        const body = this.parseStatementsUntil(["END-FUNCTION"]);
        const endToken = this.consume("END-FUNCTION", "Expected END-FUNCTION");
        return {
            kind: "FunctionDeclaration",
            name: name.lexeme,
            params,
            body,
            range: this.mergeRanges(functionToken.range, endToken.range)
        };
    }
    parseStatementsUntil(stopTokens) {
        const statements = [];
        while (!this.checkAny(stopTokens) && !this.check("EOF")) {
            this.skipNewlines();
            if (this.checkAny(stopTokens) || this.check("EOF")) {
                break;
            }
            statements.push(this.parseStatement());
            this.skipNewlines();
        }
        return statements;
    }
    parseStatement() {
        if (this.match("SET")) {
            return this.parseSetStatement();
        }
        if (this.match("DISPLAY")) {
            return this.parseDisplayStatement();
        }
        if (this.match("INPUT")) {
            return this.parseInputStatement();
        }
        if (this.match("IF")) {
            return this.parseIfStatement();
        }
        if (this.match("RETURN")) {
            return this.parseReturnStatement();
        }
        const expression = this.parseExpression();
        return {
            kind: "ExpressionStatement",
            expression,
            range: expression.range
        };
    }
    parseSetStatement() {
        const start = this.previous().range;
        const name = this.consume("IDENTIFIER", "Expected variable name after SET");
        this.consume("ASSIGN", "Expected = in SET statement");
        const expression = this.parseExpression();
        return {
            kind: "SetStatement",
            name: name.lexeme,
            expression,
            range: this.mergeRanges(start, expression.range)
        };
    }
    parseDisplayStatement() {
        const start = this.previous().range;
        const expression = this.parseExpression();
        return {
            kind: "DisplayStatement",
            expression,
            range: this.mergeRanges(start, expression.range)
        };
    }
    parseInputStatement() {
        const start = this.previous().range;
        const name = this.consume("IDENTIFIER", "Expected variable name after INPUT");
        let prompt;
        if (!this.check("NEWLINE") && !this.check("EOF")) {
            prompt = this.parseExpression();
        }
        return {
            kind: "InputStatement",
            name: name.lexeme,
            prompt,
            range: this.mergeRanges(start, prompt?.range ?? name.range)
        };
    }
    parseIfStatement() {
        const start = this.previous().range;
        const condition = this.parseExpression();
        this.consume("THEN", "Expected THEN after IF condition");
        this.skipNewlines();
        const thenBranch = this.parseStatementsUntil(["ELSE", "END-IF"]);
        let elseBranch = [];
        if (this.match("ELSE")) {
            this.skipNewlines();
            elseBranch = this.parseStatementsUntil(["END-IF"]);
        }
        const endToken = this.consume("END-IF", "Expected END-IF");
        return {
            kind: "IfStatement",
            condition,
            thenBranch,
            elseBranch,
            range: this.mergeRanges(start, endToken.range)
        };
    }
    parseReturnStatement() {
        const start = this.previous().range;
        const expression = this.parseExpression();
        return {
            kind: "ReturnStatement",
            expression,
            range: this.mergeRanges(start, expression.range)
        };
    }
    parseExpression() {
        return this.parseComparison();
    }
    parseComparison() {
        let expression = this.parseTerm();
        while (this.match("LESS", "LESS_EQUAL", "GREATER", "GREATER_EQUAL", "EQUAL", "NOT_EQUAL", "ASSIGN")) {
            const operator = this.previous();
            const mappedOperator = operator.type === "ASSIGN" ? "==" : operator.lexeme;
            const right = this.parseTerm();
            expression = this.binaryNode(expression, mappedOperator, right);
        }
        return expression;
    }
    parseTerm() {
        let expression = this.parseFactor();
        while (this.match("PLUS", "MINUS")) {
            const operator = this.previous();
            const right = this.parseFactor();
            expression = this.binaryNode(expression, operator.lexeme, right);
        }
        return expression;
    }
    parseFactor() {
        let expression = this.parseUnary();
        while (this.match("STAR", "SLASH")) {
            const operator = this.previous();
            const right = this.parseUnary();
            expression = this.binaryNode(expression, operator.lexeme, right);
        }
        return expression;
    }
    parseUnary() {
        if (this.match("MINUS")) {
            const operator = this.previous();
            const operand = this.parseUnary();
            return {
                kind: "UnaryExpression",
                operator: operator.lexeme,
                operand,
                range: this.mergeRanges(operator.range, operand.range)
            };
        }
        return this.parseCall();
    }
    parseCall() {
        let expression = this.parsePrimary();
        while (this.match("LPAREN")) {
            if (expression.kind !== "Identifier") {
                throw new CobolxError({
                    message: "Only identifiers can be called as functions",
                    range: expression.range,
                    severity: "error"
                });
            }
            const args = [];
            if (!this.check("RPAREN")) {
                do {
                    args.push(this.parseExpression());
                } while (this.match("COMMA"));
            }
            const close = this.consume("RPAREN", "Expected ) after arguments");
            expression = {
                kind: "CallExpression",
                callee: expression.name,
                args,
                range: this.mergeRanges(expression.range, close.range)
            };
        }
        return expression;
    }
    parsePrimary() {
        if (this.match("NUMBER")) {
            return {
                kind: "NumberLiteral",
                value: Number(this.previous().lexeme),
                range: this.previous().range
            };
        }
        if (this.match("STRING")) {
            return {
                kind: "StringLiteral",
                value: this.previous().lexeme,
                range: this.previous().range
            };
        }
        if (this.match("TRUE", "FALSE")) {
            return {
                kind: "BooleanLiteral",
                value: this.previous().type === "TRUE",
                range: this.previous().range
            };
        }
        if (this.match("IDENTIFIER")) {
            return {
                kind: "Identifier",
                name: this.previous().lexeme,
                range: this.previous().range
            };
        }
        if (this.match("LPAREN")) {
            const expression = this.parseExpression();
            this.consume("RPAREN", "Expected ) after expression");
            return expression;
        }
        throw new CobolxError({
            message: `Unexpected token ${this.peek().type}`,
            range: this.peek().range,
            severity: "error"
        });
    }
    binaryNode(left, operator, right) {
        return {
            kind: "BinaryExpression",
            operator,
            left,
            right,
            range: this.mergeRanges(left.range, right.range)
        };
    }
    match(...types) {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }
    consume(type, message) {
        if (this.check(type)) {
            return this.advance();
        }
        throw new CobolxError({
            message,
            range: this.peek().range,
            severity: "error"
        });
    }
    skipNewlines() {
        while (this.match("NEWLINE")) {
            continue;
        }
    }
    check(type) {
        return this.peek().type === type;
    }
    checkAny(types) {
        return types.some((type) => this.check(type));
    }
    advance() {
        if (this.index < this.tokens.length) {
            this.index += 1;
        }
        return this.previous();
    }
    peek() {
        return this.tokens[this.index];
    }
    previous() {
        return this.tokens[this.index - 1];
    }
    mergeRanges(start, end) {
        return {
            start: start.start,
            end: end.end
        };
    }
}
//# sourceMappingURL=parser.js.map