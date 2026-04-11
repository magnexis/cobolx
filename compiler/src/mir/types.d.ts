import type { StatementNode } from "../ast/types.js";
export interface MIRInstruction {
    op: "statement";
    statement: StatementNode;
}
export interface MIRFunction {
    name: string;
    instructions: MIRInstruction[];
}
export interface MIRProgram {
    functions: MIRFunction[];
    body: MIRInstruction[];
}
