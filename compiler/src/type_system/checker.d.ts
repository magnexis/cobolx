import type { ProgramNode } from "../ast/types.js";
import type { Diagnostic } from "../diagnostics.js";
import type { CobolxType } from "../hir/types.js";
export declare function inferProgramTypes(program: ProgramNode): {
    symbolTypes: Record<string, CobolxType>;
    diagnostics: Diagnostic[];
};
