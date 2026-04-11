import type { Diagnostic } from "../diagnostics.js";
import type { ProgramNode } from "../ast/types.js";

export interface CompilerPlugin {
  name: string;
  transformProgram?(program: ProgramNode): ProgramNode | Promise<ProgramNode>;
  lintProgram?(program: ProgramNode): Diagnostic[] | Promise<Diagnostic[]>;
}
