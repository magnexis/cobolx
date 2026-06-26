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
  docs?: string[];
}

export interface ProgramNode extends BaseNode {
  kind: "Program";
  name: string;
  imports: ImportDeclarationNode[];
  exports: ExportDeclarationNode[];
  plugins: PluginUseNode[];
  consts: ConstDeclarationNode[];
  enums: EnumDeclarationNode[];
  traits: TraitDeclarationNode[];
  impls: ImplDeclarationNode[];
  macros: MacroDeclarationNode[];
  modules: ModuleDeclarationNode[];
  functions: FunctionDeclarationNode[];
  tests: TestDeclarationNode[];
  body: StatementNode[];
}

export interface GenericParam {
  name: string;
  bound?: string;
  lifetime?: string;
}

export interface TypedName {
  name: string;
  typeName?: string;
  lifetime?: string;
  mutable?: boolean;
}

export interface ImportDeclarationNode extends BaseNode {
  kind: "ImportDeclaration";
  modulePath: string;
  importedName: string;
  alias?: string;
}

export interface ExportDeclarationNode extends BaseNode {
  kind: "ExportDeclaration";
  name: string;
}

export interface PluginUseNode extends BaseNode {
  kind: "PluginUse";
  pluginPath: string;
}

export interface ConstDeclarationNode extends BaseNode {
  kind: "ConstDeclaration";
  name: string;
  expression: ExpressionNode;
}

export interface EnumVariantNode extends BaseNode {
  kind: "EnumVariant";
  name: string;
  fields: TypedName[];
}

export interface EnumDeclarationNode extends BaseNode {
  kind: "EnumDeclaration";
  name: string;
  variants: EnumVariantNode[];
}

export interface FunctionSignatureNode extends BaseNode {
  kind: "FunctionSignature";
  name: string;
  genericParams: GenericParam[];
  params: TypedName[];
  returnType?: string;
  returnLifetime?: string;
  isAsync?: boolean;
  isConst?: boolean;
  traitBound?: string;
}

export interface FunctionDeclarationNode extends BaseNode {
  kind: "FunctionDeclaration";
  signature: FunctionSignatureNode;
  body: StatementNode[];
}

export interface TraitDeclarationNode extends BaseNode {
  kind: "TraitDeclaration";
  name: string;
  composedTraits: string[];
  methods: FunctionDeclarationNode[];
}

export interface ImplDeclarationNode extends BaseNode {
  kind: "ImplDeclaration";
  traitName?: string;
  targetType: string;
  methods: FunctionDeclarationNode[];
}

export interface MacroDeclarationNode extends BaseNode {
  kind: "MacroDeclaration";
  name: string;
  params: string[];
  body: StatementNode[];
}

export interface ModuleDeclarationNode extends BaseNode {
  kind: "ModuleDeclaration";
  name: string;
  exports: ExportDeclarationNode[];
  consts: ConstDeclarationNode[];
  enums: EnumDeclarationNode[];
  traits: TraitDeclarationNode[];
  impls: ImplDeclarationNode[];
  macros: MacroDeclarationNode[];
  functions: FunctionDeclarationNode[];
}

export interface TestDeclarationNode extends BaseNode {
  kind: "TestDeclaration";
  name: string;
  body: StatementNode[];
}

export type StatementNode =
  | SetStatementNode
  | LetStatementNode
  | DisplayStatementNode
  | InputStatementNode
  | IfStatementNode
  | MatchStatementNode
  | ForStatementNode
  | ReturnStatementNode
  | ExpressionStatementNode
  | UnsafeBlockNode
  | AssertStatementNode
  | SpawnStatementNode
  | BlockStatementNode;

export interface LetStatementNode extends BaseNode {
  kind: "LetStatement";
  binding: TypedName;
  expression: ExpressionNode;
  isMutable: boolean;
}

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

export interface MatchArmNode extends BaseNode {
  kind: "MatchArm";
  pattern: PatternNode;
  body: StatementNode[];
}

export interface MatchStatementNode extends BaseNode {
  kind: "MatchStatement";
  expression: ExpressionNode;
  arms: MatchArmNode[];
}

export interface UnsafeBlockNode extends BaseNode {
  kind: "UnsafeBlock";
  body: StatementNode[];
}

export interface AssertStatementNode extends BaseNode {
  kind: "AssertStatement";
  expression: ExpressionNode;
}

export interface SpawnStatementNode extends BaseNode {
  kind: "SpawnStatement";
  expression: ExpressionNode;
}

export interface BlockStatementNode extends BaseNode {
  kind: "BlockStatement";
  body: StatementNode[];
}

export interface ForStatementNode extends BaseNode {
  kind: "ForStatement";
  variable: string;
  from: ExpressionNode;
  to: ExpressionNode;
  step: ExpressionNode;
  body: StatementNode[];
}

export interface ReturnStatementNode extends BaseNode {
  kind: "ReturnStatement";
  expression: ExpressionNode;
}

export interface ExpressionStatementNode extends BaseNode {
  kind: "ExpressionStatement";
  expression: ExpressionNode;
}

export type PatternNode = WildcardPatternNode | IdentifierPatternNode | VariantPatternNode | LiteralPatternNode;

export interface WildcardPatternNode extends BaseNode {
  kind: "WildcardPattern";
}

export interface IdentifierPatternNode extends BaseNode {
  kind: "IdentifierPattern";
  name: string;
}

export interface VariantPatternNode extends BaseNode {
  kind: "VariantPattern";
  variantName: string;
  bindings: string[];
}

export interface LiteralPatternNode extends BaseNode {
  kind: "LiteralPattern";
  expression: ExpressionNode;
}

export type ExpressionNode =
  | NumberLiteralNode
  | StringLiteralNode
  | StringInterpolationNode
  | BooleanLiteralNode
  | IdentifierNode
  | BinaryExpressionNode
  | UnaryExpressionNode
  | CallExpressionNode
  | MacroInvocationNode
  | TryExpressionNode
  | MemberExpressionNode
  | EnumConstructorExpressionNode
  | ArrayLiteralNode;

export interface NumberLiteralNode extends BaseNode {
  kind: "NumberLiteral";
  value: number;
}

export interface StringLiteralNode extends BaseNode {
  kind: "StringLiteral";
  value: string;
}

export interface StringInterpolationNode extends BaseNode {
  kind: "StringInterpolation";
  quasis: string[];
  expressions: ExpressionNode[];
}

export interface BooleanLiteralNode extends BaseNode {
  kind: "BooleanLiteral";
  value: boolean;
}

export interface IdentifierNode extends BaseNode {
  kind: "Identifier";
  name: string;
}

export interface ArrayLiteralNode extends BaseNode {
  kind: "ArrayLiteral";
  items: ExpressionNode[];
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
  callee: ExpressionNode;
  args: ExpressionNode[];
}

export interface MacroInvocationNode extends BaseNode {
  kind: "MacroInvocation";
  name: string;
  args: ExpressionNode[];
}

export interface TryExpressionNode extends BaseNode {
  kind: "TryExpression";
  expression: ExpressionNode;
}

export interface MemberExpressionNode extends BaseNode {
  kind: "MemberExpression";
  object: ExpressionNode;
  property: string;
}

export interface EnumConstructorExpressionNode extends BaseNode {
  kind: "EnumConstructorExpression";
  enumName?: string;
  variantName: string;
  fields: ExpressionNode[];
}
