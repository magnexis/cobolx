import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CobolxError, formatDiagnostic } from "./diagnostics.js";
import { Lexer } from "./lexer/lexer.js";
import { Parser } from "./parser/parser.js";
import { emitCustomBackend } from "./backend/custom.js";
import { runBorrowChecker } from "./borrow_checker/checker.js";
import { lowerToHIR } from "./hir/lower.js";
import { SemanticAnalyzer } from "./semantic/analyzer.js";
import { lowerToMIR } from "./mir/lower.js";
import { optimizeMIR } from "./optimizer/constantFold.js";
export function parseSource(source) {
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    return parser.parseProgram();
}
export function analyzeSource(source) {
    const program = parseSource(source);
    const semanticDiagnostics = new SemanticAnalyzer().analyze(program);
    const hirResult = lowerToHIR(program);
    const borrowDiagnostics = runBorrowChecker(hirResult.hir);
    const diagnostics = [...semanticDiagnostics, ...hirResult.diagnostics, ...borrowDiagnostics];
    const mir = optimizeMIR(lowerToMIR(hirResult.hir));
    return { program, diagnostics, hir: hirResult.hir, mir };
}
export function compileSource(source, outputFilePath, stdlibDir) {
    const analyzed = analyzeSource(source);
    if (analyzed.diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
        return analyzed;
    }
    const backend = emitCustomBackend(analyzed.program, analyzed.mir, outputFilePath, stdlibDir);
    return {
        ...analyzed,
        output: backend.code
    };
}
export function compileFile(inputPath, outputPath, stdlibDir) {
    const source = fs.readFileSync(inputPath, "utf8");
    const result = compileSource(source, outputPath, stdlibDir);
    if (result.diagnostics.length > 0 || !result.output) {
        return result.diagnostics;
    }
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, result.output, "utf8");
    return [];
}
export function checkFile(inputPath) {
    const source = fs.readFileSync(inputPath, "utf8");
    return analyzeSource(source).diagnostics;
}
export function printDiagnostics(filePath, diagnostics) {
    for (const diagnostic of diagnostics) {
        console.error(formatDiagnostic(filePath, diagnostic));
    }
}
export function compilerStdlibDir() {
    return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..", "stdlib/core");
}
export function runCompilerCli(argv) {
    const [inputPath, outputPath] = argv;
    if (!inputPath || !outputPath) {
        console.error("Usage: cobolxc <input.cbx> <output.js>");
        return 1;
    }
    try {
        const diagnostics = compileFile(path.resolve(inputPath), path.resolve(outputPath), compilerStdlibDir());
        if (diagnostics.length > 0) {
            printDiagnostics(inputPath, diagnostics);
            return 1;
        }
        return 0;
    }
    catch (error) {
        if (error instanceof CobolxError) {
            console.error(formatDiagnostic(inputPath, error.diagnostic));
            return 1;
        }
        throw error;
    }
}
export { CobolxError, formatDiagnostic } from "./diagnostics.js";
//# sourceMappingURL=index.js.map