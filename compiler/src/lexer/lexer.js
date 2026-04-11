import { CobolxError } from "../diagnostics.js";
import { KEYWORDS } from "./tokens.js";
function cloneLocation(location) {
    return { ...location };
}
export class Lexer {
    source;
    index = 0;
    location = { line: 1, column: 1, offset: 0 };
    constructor(source) {
        this.source = source;
    }
    tokenize() {
        const tokens = [];
        while (!this.isAtEnd()) {
            const char = this.peek();
            if (char === " " || char === "\t" || char === "\r") {
                this.advance();
                continue;
            }
            if (char === "\n") {
                tokens.push(this.newlineToken());
                continue;
            }
            if (char === "*" && this.peekNext() === ">") {
                this.consumeComment();
                continue;
            }
            if (this.isAlpha(char)) {
                tokens.push(this.identifier());
                continue;
            }
            if (this.isDigit(char)) {
                tokens.push(this.number());
                continue;
            }
            if (char === "\"") {
                tokens.push(this.string());
                continue;
            }
            tokens.push(this.symbol());
        }
        const eofRange = {
            start: cloneLocation(this.location),
            end: cloneLocation(this.location)
        };
        tokens.push({ type: "EOF", lexeme: "", range: eofRange });
        return tokens;
    }
    newlineToken() {
        const start = cloneLocation(this.location);
        const lexeme = this.advance();
        return {
            type: "NEWLINE",
            lexeme,
            range: { start, end: cloneLocation(this.location) }
        };
    }
    consumeComment() {
        while (!this.isAtEnd() && this.peek() !== "\n") {
            this.advance();
        }
    }
    identifier() {
        const start = cloneLocation(this.location);
        let value = "";
        while (!this.isAtEnd() && (this.isAlphaNumeric(this.peek()) || this.peek() === "-")) {
            value += this.advance();
        }
        const upper = value.toUpperCase();
        const type = KEYWORDS[upper] ?? "IDENTIFIER";
        const lexeme = type === "IDENTIFIER" ? value : upper;
        return {
            type,
            lexeme,
            range: { start, end: cloneLocation(this.location) }
        };
    }
    number() {
        const start = cloneLocation(this.location);
        let value = "";
        while (!this.isAtEnd() && this.isDigit(this.peek())) {
            value += this.advance();
        }
        if (!this.isAtEnd() && this.peek() === "." && this.isDigit(this.peekNext())) {
            value += this.advance();
            while (!this.isAtEnd() && this.isDigit(this.peek())) {
                value += this.advance();
            }
        }
        return {
            type: "NUMBER",
            lexeme: value,
            range: { start, end: cloneLocation(this.location) }
        };
    }
    string() {
        const start = cloneLocation(this.location);
        this.advance();
        let value = "";
        while (!this.isAtEnd() && this.peek() !== "\"") {
            if (this.peek() === "\n") {
                throw new CobolxError({
                    message: "Unterminated string literal",
                    range: { start, end: cloneLocation(this.location) },
                    severity: "error"
                });
            }
            value += this.advance();
        }
        if (this.isAtEnd()) {
            throw new CobolxError({
                message: "Unterminated string literal",
                range: { start, end: cloneLocation(this.location) },
                severity: "error"
            });
        }
        this.advance();
        return {
            type: "STRING",
            lexeme: value,
            range: { start, end: cloneLocation(this.location) }
        };
    }
    symbol() {
        const start = cloneLocation(this.location);
        const char = this.advance();
        const emit = (type, lexeme) => ({
            type,
            lexeme,
            range: { start, end: cloneLocation(this.location) }
        });
        switch (char) {
            case "+":
                return emit("PLUS", char);
            case "-":
                return emit("MINUS", char);
            case "*":
                return emit("STAR", char);
            case "/":
                return emit("SLASH", char);
            case "(":
                return emit("LPAREN", char);
            case ")":
                return emit("RPAREN", char);
            case ",":
                return emit("COMMA", char);
            case "=":
                return emit("ASSIGN", char);
            case "!":
                if (this.peek() === "=") {
                    this.advance();
                    return emit("NOT_EQUAL", "!=");
                }
                break;
            case "<":
                if (this.peek() === "=") {
                    this.advance();
                    return emit("LESS_EQUAL", "<=");
                }
                return emit("LESS", char);
            case ">":
                if (this.peek() === "=") {
                    this.advance();
                    return emit("GREATER_EQUAL", ">=");
                }
                return emit("GREATER", char);
        }
        throw new CobolxError({
            message: `Unexpected character '${char}'`,
            range: { start, end: cloneLocation(this.location) },
            severity: "error"
        });
    }
    advance() {
        const char = this.source[this.index] ?? "\0";
        this.index += 1;
        this.location.offset += 1;
        if (char === "\n") {
            this.location.line += 1;
            this.location.column = 1;
        }
        else {
            this.location.column += 1;
        }
        return char;
    }
    peek() {
        return this.source[this.index] ?? "\0";
    }
    peekNext() {
        return this.source[this.index + 1] ?? "\0";
    }
    isAtEnd() {
        return this.index >= this.source.length;
    }
    isAlpha(char) {
        return /[A-Za-z_]/.test(char);
    }
    isDigit(char) {
        return /[0-9]/.test(char);
    }
    isAlphaNumeric(char) {
        return this.isAlpha(char) || this.isDigit(char);
    }
}
//# sourceMappingURL=lexer.js.map