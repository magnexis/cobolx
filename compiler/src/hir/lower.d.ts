import type { ProgramNode } from "../ast/types.js";
import type { Diagnostic } from "../diagnostics.js";
import type { HIRProgram } from "./types.js";
export declare function lowerToHIR(program: ProgramNode): {
    hir: HIRProgram;
    diagnostics: Diagnostic[];
};
