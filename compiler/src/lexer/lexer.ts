import type { SourceLocation, SourceRange } from "../ast/types.js";
import { CobolxError } from "../diagnostics.js";
import type { Token, TokenType } from "./tokens.js";
import { KEYWORDS } from "./tokens.js";

function cloneLocation(location: SourceLocation): SourceLocation {
  return { ...location };
}

export class Lexer {
  private index = 0;
  private location: SourceLocation = { line: 1, column: 1, offset: 0 };

  constructor(private readonly source: string) {}

  tokenize(): Token[] {
    const tokens: Token[] = [];

    while (!this.isAtEnd()) {
      const char = this.peek();

      if (char === " " || char === "\t" || char === "\r") {
        this.advance();
        continue;
      }

      if (char === "\n") {
        tokens.push(this.simpleToken("NEWLINE", this.advance()));
        continue;
      }

      if (char === "/" && this.peekNext() === "/" && this.peekThird() === "/") {
        tokens.push(this.docComment());
        continue;
      }

      if (char === "*" && this.peekNext() === ">") {
        this.consumeLineComment();
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

    const eofRange: SourceRange = {
      start: cloneLocation(this.location),
      end: cloneLocation(this.location)
    };
    tokens.push({ type: "EOF", lexeme: "", range: eofRange });
    return tokens;
  }

  private docComment(): Token {
    const start = cloneLocation(this.location);
    this.advance();
    this.advance();
    this.advance();
    let value = "";
    while (!this.isAtEnd() && this.peek() !== "\n") {
      value += this.advance();
    }
    return {
      type: "DOC_COMMENT",
      lexeme: value.trim(),
      range: { start, end: cloneLocation(this.location) }
    };
  }

  private consumeLineComment(): void {
    while (!this.isAtEnd() && this.peek() !== "\n") {
      this.advance();
    }
  }

  private identifier(): Token {
    const start = cloneLocation(this.location);
    let value = "";
    while (!this.isAtEnd() && (this.isAlphaNumeric(this.peek()) || this.peek() === "-" || this.peek() === "_")) {
      value += this.advance();
    }
    const upper = value.toUpperCase();
    const type = KEYWORDS[upper] ?? "IDENTIFIER";
    return {
      type,
      lexeme: type === "IDENTIFIER" ? value : upper,
      range: { start, end: cloneLocation(this.location) }
    };
  }

  private number(): Token {
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

  private string(): Token {
    const start = cloneLocation(this.location);
    this.advance();
    let value = "";
    let hasInterpolation = false;
    while (!this.isAtEnd() && this.peek() !== "\"") {
      if (this.peek() === "\n") {
        throw new CobolxError({
          message: "Unterminated string literal",
          range: { start, end: cloneLocation(this.location) },
          severity: "error"
        });
      }
      if (this.peek() === "{") {
        hasInterpolation = true;
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
      type: hasInterpolation ? "STRING_INTERPOLATION" : "STRING",
      lexeme: value,
      range: { start, end: cloneLocation(this.location) }
    };
  }

  private symbol(): Token {
    const start = cloneLocation(this.location);
    const char = this.advance();
    const emit = (type: TokenType, lexeme: string): Token => ({
      type,
      lexeme,
      range: { start, end: cloneLocation(this.location) }
    });

    switch (char) {
      case "+":
        return emit("PLUS", char);
      case "-":
        if (this.peek() === ">") {
          this.advance();
          return emit("ARROW", "->");
        }
        return emit("MINUS", char);
      case "*":
        return emit("STAR", char);
      case "/":
        return emit("SLASH", char);
      case "%":
        return emit("PERCENT", char);
      case "!":
        if (this.peek() === "=") {
          this.advance();
          return emit("NOT_EQUAL", "!=");
        }
        return emit("BANG", char);
      case "?":
        return emit("QUESTION", char);
      case "(":
        return emit("LPAREN", char);
      case ")":
        return emit("RPAREN", char);
      case "[":
        return emit("LBRACKET", char);
      case "]":
        return emit("RBRACKET", char);
      case ",":
        return emit("COMMA", char);
      case ":":
        return emit("COLON", char);
      case ".":
        return emit("DOT", char);
      case "=":
        return emit("ASSIGN", char);
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
      case "&":
        return emit("AMPERSAND", char);
    }

    throw new CobolxError({
      message: `Unexpected character '${char}'`,
      range: { start, end: cloneLocation(this.location) },
      severity: "error"
    });
  }

  private simpleToken(type: TokenType, lexeme: string): Token {
    const end = cloneLocation(this.location);
    const start = {
      line: end.line,
      column: end.column - lexeme.length,
      offset: end.offset - lexeme.length
    };
    return { type, lexeme, range: { start, end } };
  }

  private advance(): string {
    const char = this.source[this.index] ?? "\0";
    this.index += 1;
    this.location.offset += 1;
    if (char === "\n") {
      this.location.line += 1;
      this.location.column = 1;
    } else {
      this.location.column += 1;
    }
    return char;
  }

  private peek(): string {
    return this.source[this.index] ?? "\0";
  }

  private peekNext(): string {
    return this.source[this.index + 1] ?? "\0";
  }

  private peekThird(): string {
    return this.source[this.index + 2] ?? "\0";
  }

  private isAtEnd(): boolean {
    return this.index >= this.source.length;
  }

  private isAlpha(char: string): boolean {
    return /[A-Za-z_]/.test(char);
  }

  private isDigit(char: string): boolean {
    return /[0-9]/.test(char);
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }
}
