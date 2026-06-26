export interface SourceLocation {
    line: number;
    column: number;
    offset: number;
}
export interface SourceRange {
    start: SourceLocation;
    end: SourceLocation;
}
export interface BaseNode {
    kind: string;
    range: SourceRange;
}
export interface ProgramNode extends BaseNode {
    kind: "Program";
    name: string;
    functions: FunctionDeclarationNode[];
    body: StatementNode[];
}
export interface FunctionDeclarationNode extends BaseNode {
    kind: "FunctionDeclaration";
    name: string;
    params: string[];
    body: StatementNode[];
}
export type StatementNode = SetStatementNode | DisplayStatementNode | InputStatementNode | IfStatementNode | ReturnStatementNode | ExpressionStatementNode;
export interface SetStatementNode extends BaseNode {
    kind: "SetStatement";
    name: string;
    expression: ExpressionNode;
}
export interface DisplayStatementNode extends BaseNode {
    kind: "DisplayStatement";
    expression: ExpressionNode;
}
export interface InputStatementNode extends BaseNode {
    kind: "InputStatement";
    name: string;
    prompt?: ExpressionNode;
}
export interface IfStatementNode extends BaseNode {
    kind: "IfStatement";
    condition: ExpressionNode;
    thenBranch: StatementNode[];
    elseBranch: StatementNode[];
}
export interface ReturnStatementNode extends BaseNode {
    kind: "ReturnStatement";
    expression: ExpressionNode;
}
export interface ExpressionStatementNode extends BaseNode {
    kind: "ExpressionStatement";
    expression: ExpressionNode;
}
export type ExpressionNode = NumberLiteralNode | StringLiteralNode | BooleanLiteralNode | IdentifierNode | BinaryExpressionNode | UnaryExpressionNode | CallExpressionNode;
export interface NumberLiteralNode extends BaseNode {
    kind: "NumberLiteral";
    value: number;
}
export interface StringLiteralNode extends BaseNode {
    kind: "StringLiteral";
    value: string;
}
export interface BooleanLiteralNode extends BaseNode {
    kind: "BooleanLiteral";
    value: boolean;
}
export interface IdentifierNode extends BaseNode {
    kind: "Identifier";
    name: string;
}
export interface BinaryExpressionNode extends BaseNode {
    kind: "BinaryExpression";
    operator: string;
    left: ExpressionNode;
    right: ExpressionNode;
}
export interface UnaryExpressionNode extends BaseNode {
    kind: "UnaryExpression";
    operator: string;
    operand: ExpressionNode;
}
export interface CallExpressionNode extends BaseNode {
    kind: "CallExpression";
    callee: string;
    args: ExpressionNode[];
}
