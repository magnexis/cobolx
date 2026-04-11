export class CobolxError extends Error {
    diagnostic;
    constructor(diagnostic) {
        super(diagnostic.message);
        this.diagnostic = diagnostic;
        this.name = "CobolxError";
    }
}
export function formatDiagnostic(filePath, diagnostic) {
    const { line, column } = diagnostic.range.start;
    const label = diagnostic.severity === "warning" ? "Warning" : "Error";
    return `${label}: ${diagnostic.message} at ${filePath}:${line}:${column}`;
}
//# sourceMappingURL=diagnostics.js.map