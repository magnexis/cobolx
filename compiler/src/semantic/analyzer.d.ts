import type { ProgramNode } from "../ast/types.js";
import type { Diagnostic } from "../diagnostics.js";
export declare class SemanticAnalyzer {
    analyze(program: ProgramNode): Diagnostic[];
    private analyzeStatements;
    private analyzeIfStatement;
    private analyzeExpression;
    private analyzeIdentifier;
    private analyzeCallExpression;
    private isStdlibSymbol;
    private isStdlibCall;
}
