import type { MIRProgram } from "../mir/types.js";
import type { ProgramNode } from "../ast/types.js";
export interface BackendOutput {
    target: "js-custom-backend";
    code: string;
    instructionCount: number;
}
export declare function emitCustomBackend(program: ProgramNode, mir: MIRProgram, outputFilePath: string, stdlibDir: string): BackendOutput;
