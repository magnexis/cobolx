import type { MIRInstruction, MIRProgram } from "../mir/types.js";
import { generateJavaScript } from "../codegen/javascript.js";
import type { ProgramNode } from "../ast/types.js";

export interface BackendOutput {
  target: "js-custom-backend";
  code: string;
  instructionCount: number;
}

function instructionCount(program: MIRProgram): number {
  return program.body.length + program.functions.reduce((total, fn) => total + fn.instructions.length, 0);
}

export function emitCustomBackend(program: ProgramNode, mir: MIRProgram, outputFilePath: string, stdlibDir: string): BackendOutput {
  return {
    target: "js-custom-backend",
    code: generateJavaScript(program, outputFilePath, stdlibDir),
    instructionCount: instructionCount(mir)
  };
}
