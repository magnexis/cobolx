import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ProgramNode } from "./ast/types.js";
import type { Diagnostic } from "./diagnostics.js";
import { CobolxError, formatDiagnostic } from "./diagnostics.js";
import { Lexer } from "./lexer/lexer.js";
import { Parser } from "./parser/parser.js";
import { emitCustomBackend } from "./backend/custom.js";
import { runBorrowChecker } from "./borrow_checker/checker.js";
import { evaluateConstDeclarations } from "./const_eval/evaluator.js";
import { lowerToHIR } from "./hir/lower.js";
import { expandMacros } from "./macros/expand.js";
import { applyCompilerPlugins } from "./plugins/loader.js";
import { SemanticAnalyzer } from "./semantic/analyzer.js";
import { lowerToMIR } from "./mir/lower.js";
import { optimizeMIR } from "./optimizer/constantFold.js";
import type { HIRProgram } from "./hir/types.js";
import type { MIRProgram } from "./mir/types.js";

export interface CompileResult {
  program: ProgramNode;
  diagnostics: Diagnostic[];
  output?: string;
  hir?: HIRProgram;
  mir?: MIRProgram;
}

export function parseSource(source: string): ProgramNode {
  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  return parser.parseProgram();
}

export function analyzeSource(source: string): CompileResult {
  const program = expandMacros(evaluateConstDeclarations(parseSource(source)));
  return analyzeProgram(program);
}

function analyzeProgram(program: ProgramNode): CompileResult {
  const semanticDiagnostics = new SemanticAnalyzer().analyze(program);
  const hirResult = lowerToHIR(program);
  const borrowDiagnostics = runBorrowChecker(hirResult.hir);
  const diagnostics = [...semanticDiagnostics, ...hirResult.diagnostics, ...borrowDiagnostics];
  const mir = optimizeMIR(lowerToMIR(hirResult.hir));
  return { program, diagnostics, hir: hirResult.hir, mir };
}

export function compileSource(source: string, outputFilePath: string, stdlibDir: string): CompileResult {
  const analyzed = analyzeProgram(expandMacros(evaluateConstDeclarations(parseSource(source))));
  if (analyzed.diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
    return analyzed;
  }
  const backend = emitCustomBackend(analyzed.program, analyzed.mir!, outputFilePath, stdlibDir);
  return {
    ...analyzed,
    output: backend.code
  };
}

export function compileFile(inputPath: string, outputPath: string, stdlibDir: string): Diagnostic[] {
  const source = fs.readFileSync(inputPath, "utf8");
  const parsed = expandMacros(evaluateConstDeclarations(parseSource(source)));
  const pluginResult = applyCompilerPlugins(parsed, path.dirname(inputPath));
  const result = analyzeProgram(pluginResult.program);
  result.diagnostics.unshift(...pluginResult.diagnostics);
  const hasErrors = result.diagnostics.some((diagnostic) => diagnostic.severity === "error");
  if (!hasErrors) {
    const backend = emitCustomBackend(result.program, result.mir!, outputPath, stdlibDir);
    result.output = backend.code;
  }
  if (hasErrors || !result.output) {
    return result.diagnostics;
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, result.output, "utf8");
  return result.diagnostics;
}

export function checkFile(inputPath: string): Diagnostic[] {
  const source = fs.readFileSync(inputPath, "utf8");
  return analyzeSource(source).diagnostics;
}

export function printDiagnostics(filePath: string, diagnostics: Diagnostic[]): void {
  for (const diagnostic of diagnostics) {
    console.error(formatDiagnostic(filePath, diagnostic));
  }
}

export function compilerStdlibDir(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..", "stdlib/core");
}

export function runCompilerCli(argv: string[]): number {
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
  } catch (error) {
    if (error instanceof CobolxError) {
      console.error(formatDiagnostic(inputPath, error.diagnostic));
      return 1;
    }
    throw error;
  }
}

export { CobolxError, formatDiagnostic } from "./diagnostics.js";
export type { Diagnostic } from "./diagnostics.js";
export type { ExpressionNode, PatternNode, ProgramNode, StatementNode } from "./ast/types.js";
