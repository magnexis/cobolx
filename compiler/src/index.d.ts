import type { ProgramNode } from "./ast/types.js";
import type { Diagnostic } from "./diagnostics.js";
import type { HIRProgram } from "./hir/types.js";
import type { MIRProgram } from "./mir/types.js";
export interface CompileResult {
    program: ProgramNode;
    diagnostics: Diagnostic[];
    output?: string;
    hir?: HIRProgram;
    mir?: MIRProgram;
}
export declare function parseSource(source: string): ProgramNode;
export declare function analyzeSource(source: string): CompileResult;
export declare function compileSource(source: string, outputFilePath: string, stdlibDir: string): CompileResult;
export declare function compileFile(inputPath: string, outputPath: string, stdlibDir: string): Diagnostic[];
export declare function checkFile(inputPath: string): Diagnostic[];
export declare function printDiagnostics(filePath: string, diagnostics: Diagnostic[]): void;
export declare function compilerStdlibDir(): string;
export declare function runCompilerCli(argv: string[]): number;
export { CobolxError, formatDiagnostic } from "./diagnostics.js";
export type { Diagnostic } from "./diagnostics.js";
export type { ExpressionNode, ProgramNode, StatementNode } from "./ast/types.js";
