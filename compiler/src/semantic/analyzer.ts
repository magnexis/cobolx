import type {
  CallExpressionNode,
  ExpressionNode,
  FunctionDeclarationNode,
  FunctionSignatureNode,
  IdentifierNode,
  MatchStatementNode,
  ProgramNode,
  StatementNode
} from "../ast/types.js";
import type { Diagnostic } from "../diagnostics.js";

interface FunctionInfo {
  params: string[];
  declaration: FunctionDeclarationNode;
}

class Scope {
  private readonly values = new Set<string>();

  constructor(private readonly parent?: Scope) {}

  declare(name: string): void {
    this.values.add(name);
  }

  has(name: string): boolean {
    if (this.values.has(name)) return true;
    return this.parent?.has(name) ?? false;
  }
}

export class SemanticAnalyzer {
  analyze(program: ProgramNode): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const functions = new Map<string, FunctionInfo>();
    const traits = new Map(program.traits.map((trait) => [trait.name, trait]));
    const macros = new Set<string>();

    for (const value of [...program.consts.map((item) => item.name), ...program.enums.map((item) => item.name), ...program.modules.map((item) => item.name)]) {
      if (functions.has(value)) {
        diagnostics.push({ message: `Duplicate top-level symbol '${value}'`, range: program.range, severity: "error" });
      }
    }

    for (const fn of program.functions) {
      const name = fn.signature.name;
      if (functions.has(name)) diagnostics.push({ message: `Function '${name}' is already declared`, range: fn.range, severity: "error" });
      else functions.set(name, { params: fn.signature.params.map((param) => param.name), declaration: fn });
      this.validateLifetimeSignature(fn.signature, diagnostics);
    }

    for (const macro of program.macros) {
      if (macros.has(macro.name)) diagnostics.push({ message: `Macro '${macro.name}' is already declared`, range: macro.range, severity: "error" });
      macros.add(macro.name);
      if (!functions.has(macro.name)) {
        functions.set(macro.name, { params: macro.params, declaration: { kind: "FunctionDeclaration", signature: { kind: "FunctionSignature", name: macro.name, genericParams: [], params: macro.params.map((param) => ({ name: param })), range: macro.range }, body: macro.body, range: macro.range } });
      }
    }

    for (const implNode of program.impls) {
      if (!implNode.traitName) continue;
      const trait = traits.get(implNode.traitName);
      if (!trait) {
        diagnostics.push({ message: `Trait '${implNode.traitName}' is not defined`, range: implNode.range, severity: "error" });
        continue;
      }
      const implemented = new Set(implNode.methods.map((method) => method.signature.name));
      for (const traitMethod of trait.methods) {
        if (!implemented.has(traitMethod.signature.name)) {
          diagnostics.push({
            message: `Impl for '${implNode.targetType}' is missing trait method '${traitMethod.signature.name}'`,
            range: implNode.range,
            severity: "error"
          });
        }
      }
    }

    for (const fn of program.functions) {
      const scope = new Scope();
      for (const constant of program.consts) scope.declare(constant.name);
      for (const param of fn.signature.params) scope.declare(param.name);
      this.analyzeStatements(fn.body, scope, functions, macros, diagnostics, true);
    }

    const rootScope = new Scope();
    for (const constant of program.consts) rootScope.declare(constant.name);
    for (const importDecl of program.imports) rootScope.declare(importDecl.alias ?? importDecl.importedName);
    this.analyzeStatements(program.body, rootScope, functions, macros, diagnostics, false);
    return diagnostics;
  }

  private validateLifetimeSignature(signature: FunctionSignatureNode, diagnostics: Diagnostic[]): void {
    if (!signature.returnLifetime) return;
    const knownLifetimes = new Set(signature.params.map((param) => param.lifetime).filter(Boolean));
    const declaredLifetimes = new Set(signature.genericParams.map((param) => param.lifetime).filter(Boolean));
    if (!knownLifetimes.has(signature.returnLifetime) && !declaredLifetimes.has(signature.returnLifetime)) {
      diagnostics.push({
        message: `Unknown lifetime '${signature.returnLifetime}' in return type of '${signature.name}'`,
        range: signature.range,
        severity: "error"
      });
    }
  }

  private analyzeStatements(
    statements: StatementNode[],
    scope: Scope,
    functions: Map<string, FunctionInfo>,
    macros: Set<string>,
    diagnostics: Diagnostic[],
    insideFunction: boolean
  ): void {
    for (const statement of statements) {
      switch (statement.kind) {
        case "LetStatement":
          this.analyzeExpression(statement.expression, scope, functions, macros, diagnostics);
          scope.declare(statement.binding.name);
          break;
        case "SetStatement":
          this.analyzeExpression(statement.expression, scope, functions, macros, diagnostics);
          scope.declare(statement.name);
          break;
        case "DisplayStatement":
        case "AssertStatement":
        case "SpawnStatement":
        case "ExpressionStatement":
          this.analyzeExpression(statement.expression, scope, functions, macros, diagnostics);
          break;
        case "InputStatement":
          if (statement.prompt) this.analyzeExpression(statement.prompt, scope, functions, macros, diagnostics);
          scope.declare(statement.name);
          break;
        case "IfStatement":
          this.analyzeExpression(statement.condition, scope, functions, macros, diagnostics);
          this.analyzeStatements(statement.thenBranch, new Scope(scope), functions, macros, diagnostics, insideFunction);
          this.analyzeStatements(statement.elseBranch, new Scope(scope), functions, macros, diagnostics, insideFunction);
          break;
        case "MatchStatement":
          this.analyzeMatchStatement(statement, scope, functions, macros, diagnostics, insideFunction);
          break;
        case "ReturnStatement":
          if (!insideFunction) diagnostics.push({ message: "RETURN can only be used inside a FUNCTION", range: statement.range, severity: "error" });
          this.analyzeExpression(statement.expression, scope, functions, macros, diagnostics);
          break;
        case "UnsafeBlock":
        case "BlockStatement":
          this.analyzeStatements(statement.body, new Scope(scope), functions, macros, diagnostics, insideFunction);
          break;
      }
    }
  }

  private analyzeMatchStatement(
    statement: MatchStatementNode,
    scope: Scope,
    functions: Map<string, FunctionInfo>,
    macros: Set<string>,
    diagnostics: Diagnostic[],
    insideFunction: boolean
  ): void {
    this.analyzeExpression(statement.expression, scope, functions, macros, diagnostics);
    const variantPatterns = new Set<string>();
    for (const arm of statement.arms) {
      if (arm.pattern.kind === "VariantPattern") variantPatterns.add(arm.pattern.variantName);
      const armScope = new Scope(scope);
      if (arm.pattern.kind === "IdentifierPattern") armScope.declare(arm.pattern.name);
      if (arm.pattern.kind === "VariantPattern") for (const binding of arm.pattern.bindings) armScope.declare(binding);
      this.analyzeStatements(arm.body, armScope, functions, macros, diagnostics, insideFunction);
    }
    if (statement.arms.length === 0) diagnostics.push({ message: "MATCH must contain at least one arm", range: statement.range, severity: "error" });
    const hasWildcard = statement.arms.some((arm) => arm.pattern.kind === "WildcardPattern" || arm.pattern.kind === "IdentifierPattern");
    if (!hasWildcard && variantPatterns.size < 2) {
      diagnostics.push({ message: "MATCH should include exhaustive patterns or a wildcard arm", range: statement.range, severity: "warning" });
    }
  }

  private analyzeExpression(
    expression: ExpressionNode,
    scope: Scope,
    functions: Map<string, FunctionInfo>,
    macros: Set<string>,
    diagnostics: Diagnostic[]
  ): void {
    switch (expression.kind) {
      case "Identifier":
        this.analyzeIdentifier(expression, scope, diagnostics);
        break;
      case "BinaryExpression":
        this.analyzeExpression(expression.left, scope, functions, macros, diagnostics);
        this.analyzeExpression(expression.right, scope, functions, macros, diagnostics);
        break;
      case "UnaryExpression":
        this.analyzeExpression(expression.operand, scope, functions, macros, diagnostics);
        break;
      case "TryExpression":
        this.analyzeExpression(expression.expression, scope, functions, macros, diagnostics);
        break;
      case "CallExpression":
        this.analyzeCallExpression(expression, scope, functions, macros, diagnostics);
        break;
      case "MacroInvocation":
        if (!macros.has(expression.name)) diagnostics.push({ message: `Macro '${expression.name}' is not defined`, range: expression.range, severity: "error" });
        for (const arg of expression.args) this.analyzeExpression(arg, scope, functions, macros, diagnostics);
        break;
      case "MemberExpression":
        this.analyzeExpression(expression.object, scope, functions, macros, diagnostics);
        break;
      case "EnumConstructorExpression":
        for (const field of expression.fields) this.analyzeExpression(field, scope, functions, macros, diagnostics);
        break;
      case "ArrayLiteral":
        for (const item of expression.items) this.analyzeExpression(item, scope, functions, macros, diagnostics);
        break;
      case "NumberLiteral":
      case "StringLiteral":
      case "BooleanLiteral":
        break;
    }
  }

  private analyzeIdentifier(expression: IdentifierNode, scope: Scope, diagnostics: Diagnostic[]): void {
    if (!scope.has(expression.name) && !this.isBuiltinSymbol(expression.name)) {
      diagnostics.push({ message: `Variable '${expression.name}' is not defined`, range: expression.range, severity: "error" });
    }
  }

  private analyzeCallExpression(
    expression: CallExpressionNode,
    scope: Scope,
    functions: Map<string, FunctionInfo>,
    macros: Set<string>,
    diagnostics: Diagnostic[]
  ): void {
    if (expression.callee.kind !== "Identifier") this.analyzeExpression(expression.callee, scope, functions, macros, diagnostics);
    for (const arg of expression.args) this.analyzeExpression(arg, scope, functions, macros, diagnostics);

    if (expression.callee.kind !== "Identifier") return;
    const callee = expression.callee.name;
    if (this.isBuiltinCall(callee)) return;
    const fn = functions.get(callee);
    if (!fn) {
      diagnostics.push({ message: `Function '${callee}' is not defined`, range: expression.range, severity: "error" });
      return;
    }
    if (fn.params.length !== expression.args.length) {
      diagnostics.push({
        message: `Function '${callee}' expects ${fn.params.length} argument(s) but received ${expression.args.length}`,
        range: expression.range,
        severity: "error"
      });
    }
  }

  private isBuiltinSymbol(name: string): boolean {
    return ["math", "strings", "iter", "Result", "Option"].includes(name);
  }

  private isBuiltinCall(name: string): boolean {
    return [
      "display",
      "input",
      "OK",
      "ERR",
      "SOME",
      "NONE",
      "spawn",
      "channel",
      "iter",
      "collect",
      "map",
      "filter",
      "reduce"
    ].includes(name);
  }
}
