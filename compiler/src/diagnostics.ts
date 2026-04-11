import type { SourceRange } from "./ast/types.js";

export interface Diagnostic {
  message: string;
  range: SourceRange;
  severity: "error" | "warning";
}

export class CobolxError extends Error {
  constructor(public readonly diagnostic: Diagnostic) {
    super(diagnostic.message);
    this.name = "CobolxError";
  }
}

export function formatDiagnostic(filePath: string, diagnostic: Diagnostic): string {
  const { line, column } = diagnostic.range.start;
  const label = diagnostic.severity === "warning" ? "Warning" : "Error";
  return `${label}: ${diagnostic.message} at ${filePath}:${line}:${column}`;
}
