import type { Diagnostic } from "../diagnostics.js";
import type { HIRProgram } from "../hir/types.js";
export declare function runBorrowChecker(hir: HIRProgram): Diagnostic[];
