import type { HIRProgram } from "../hir/types.js";
import type { MIRProgram } from "./types.js";

export function lowerToMIR(hir: HIRProgram): MIRProgram {
  return {
    functions: hir.functions.map((fn) => ({
      name: fn.name,
      instructions: fn.body.map(({ statement }) => ({ op: "statement", statement }))
    })),
    body: hir.body.map(({ statement }) => ({ op: "statement", statement }))
  };
}
