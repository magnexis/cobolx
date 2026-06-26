import type { SourceRange } from "../ast/types.js";
export type TokenType = "PROGRAM" | "BEGIN" | "END" | "SET" | "DISPLAY" | "INPUT" | "IF" | "THEN" | "ELSE" | "END-IF" | "FUNCTION" | "RETURN" | "END-FUNCTION" | "TRUE" | "FALSE" | "IDENTIFIER" | "NUMBER" | "STRING" | "PLUS" | "MINUS" | "STAR" | "SLASH" | "EQUAL" | "NOT_EQUAL" | "LESS" | "LESS_EQUAL" | "GREATER" | "GREATER_EQUAL" | "ASSIGN" | "LPAREN" | "RPAREN" | "COMMA" | "NEWLINE" | "EOF";
export interface Token {
    type: TokenType;
    lexeme: string;
    range: SourceRange;
}
export declare const KEYWORDS: Record<string, TokenType>;
