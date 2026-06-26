import type { ExpressionNode, ProgramNode, StatementNode } from "../ast/types.js";

export type CobolxType = "number" | "string" | "boolean" | "unknown" | "void" | "enum" | "array";

export interface HIRExpression {
  expression: ExpressionNode;
  inferredType: CobolxType;
}

export interface HIRStatement {
  statement: StatementNode;
}

export interface HIRFunction {
  name: string;
  params: string[];
  mutatedParams: string[];
  body: HIRStatement[];
}

export interface HIRProgram {
  program: ProgramNode;
  functions: HIRFunction[];
  body: HIRStatement[];
  symbolTypes: Record<string, CobolxType>;
}
