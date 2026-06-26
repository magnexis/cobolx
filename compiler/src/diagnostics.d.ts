import type { SourceRange } from "./ast/types.js";
export interface Diagnostic {
    message: string;
    range: SourceRange;
    severity: "error" | "warning";
}
export declare class CobolxError extends Error {
    readonly diagnostic: Diagnostic;
    constructor(diagnostic: Diagnostic);
}
export declare function formatDiagnostic(filePath: string, diagnostic: Diagnostic): string;
