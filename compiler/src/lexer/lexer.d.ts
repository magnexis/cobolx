import type { Token } from "./tokens.js";
export declare class Lexer {
    private readonly source;
    private index;
    private location;
    constructor(source: string);
    tokenize(): Token[];
    private newlineToken;
    private consumeComment;
    private identifier;
    private number;
    private string;
    private symbol;
    private advance;
    private peek;
    private peekNext;
    private isAtEnd;
    private isAlpha;
    private isDigit;
    private isAlphaNumeric;
}
