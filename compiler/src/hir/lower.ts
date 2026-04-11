import type { ProgramNode, StatementNode } from "../ast/types.js";
import type { Diagnostic } from "../diagnostics.js";
import type { HIRFunction, HIRProgram } from "./types.js";
import { inferProgramTypes } from "../type_system/checker.js";

function collectMutatedParams(params: string[], statements: StatementNode[]): string[] {
  const mutated = new Set<string>();
  for (const statement of statements) {
    switch (statement.kind) {
      case "LetStatement":
        break;
      case "SetStatement":
      case "InputStatement":
        if (params.includes(statement.name)) {
          mutated.add(statement.name);
        }
        break;
      case "IfStatement":
        for (const name of collectMutatedParams(params, statement.thenBranch)) {
          mutated.add(name);
        }
        for (const name of collectMutatedParams(params, statement.elseBranch)) {
          mutated.add(name);
        }
        break;
      case "MatchStatement":
        for (const arm of statement.arms) {
          for (const name of collectMutatedParams(params, arm.body)) mutated.add(name);
        }
        break;
      case "UnsafeBlock":
      case "BlockStatement":
        for (const name of collectMutatedParams(params, statement.body)) mutated.add(name);
        break;
    }
  }
  return [...mutated];
}

function lowerFunction(program: ProgramNode): HIRFunction[] {
  return program.functions.map((fn) => ({
    name: fn.signature.name,
    params: fn.signature.params.map((param) => param.name),
    mutatedParams: collectMutatedParams(fn.signature.params.map((param) => param.name), fn.body),
    body: fn.body.map((statement) => ({ statement }))
  }));
}

export function lowerToHIR(program: ProgramNode): { hir: HIRProgram; diagnostics: Diagnostic[] } {
  const typeInfo = inferProgramTypes(program);
  return {
    diagnostics: typeInfo.diagnostics,
    hir: {
      program,
      functions: lowerFunction(program),
      body: program.body.map((statement) => ({ statement })),
      symbolTypes: typeInfo.symbolTypes
    }
  };
}
