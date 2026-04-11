import type { Diagnostic } from "@cobolx/compiler";
import { analyzeSource } from "@cobolx/compiler";

export function lintSource(source: string): Diagnostic[] {
  const diagnostics = [...analyzeSource(source).diagnostics];
  for (const [index, line] of source.split(/\r?\n/).entries()) {
    if (/^\s*(program|begin|end|set|display|input|if|then|else|function|return)\b/.test(line)) {
      diagnostics.push({
        message: "Prefer uppercase COBOL-X keywords for consistency",
        severity: "warning",
        range: {
          start: { line: index + 1, column: 1, offset: 0 },
          end: { line: index + 1, column: line.length + 1, offset: 0 }
        }
      });
    }
  }
  return diagnostics;
}
