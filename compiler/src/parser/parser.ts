import type {
  ArrayLiteralNode,
  AssertStatementNode,
  BinaryExpressionNode,
  BooleanLiteralNode,
  CallExpressionNode,
  ConstDeclarationNode,
  DisplayStatementNode,
  EnumConstructorExpressionNode,
  EnumDeclarationNode,
  EnumVariantNode,
  ExportDeclarationNode,
  ExpressionNode,
  ExpressionStatementNode,
  FunctionDeclarationNode,
  FunctionSignatureNode,
  GenericParam,
  IdentifierNode,
  IdentifierPatternNode,
  IfStatementNode,
  ImplDeclarationNode,
  ImportDeclarationNode,
  InputStatementNode,
  LetStatementNode,
  LiteralPatternNode,
  MacroDeclarationNode,
  MacroInvocationNode,
  MatchArmNode,
  MatchStatementNode,
  MemberExpressionNode,
  ModuleDeclarationNode,
  NumberLiteralNode,
  PatternNode,
  PluginUseNode,
  ProgramNode,
  ReturnStatementNode,
  SetStatementNode,
  SpawnStatementNode,
  StatementNode,
  StringLiteralNode,
  TestDeclarationNode,
  TraitDeclarationNode,
  TryExpressionNode,
  TypedName,
  UnaryExpressionNode,
  UnsafeBlockNode,
  VariantPatternNode,
  WildcardPatternNode
} from "../ast/types.js";
import type { SourceRange } from "../ast/types.js";
import { CobolxError } from "../diagnostics.js";
import type { Token, TokenType } from "../lexer/tokens.js";

export class Parser {
  private index = 0;
  private pendingDocs: string[] = [];

  constructor(private readonly tokens: Token[]) {}

  parseProgram(): ProgramNode {
    this.skipTrivia();
    const programToken = this.consume("PROGRAM", "Expected PROGRAM declaration");
    const name = this.consume("IDENTIFIER", "Expected program name");
    this.skipTrivia();

    const imports: ImportDeclarationNode[] = [];
    const exports: ExportDeclarationNode[] = [];
    const plugins: PluginUseNode[] = [];
    const consts: ConstDeclarationNode[] = [];
    const enums: EnumDeclarationNode[] = [];
    const traits: TraitDeclarationNode[] = [];
    const impls: ImplDeclarationNode[] = [];
    const macros: MacroDeclarationNode[] = [];
    const modules: ModuleDeclarationNode[] = [];
    const functions: FunctionDeclarationNode[] = [];
    const tests: TestDeclarationNode[] = [];

    while (!this.check("BEGIN") && !this.check("EOF")) {
      const docs = this.takeDocs();
      if (this.match("IMPORT")) imports.push(this.parseImport(docs));
      else if (this.match("EXPORT")) exports.push(this.parseExport(docs));
      else if (this.match("PLUGIN")) plugins.push(this.parsePluginUse(docs));
      else if (this.match("CONST")) consts.push(this.parseConstDeclaration(docs));
      else if (this.match("ENUM")) enums.push(this.parseEnumDeclaration(docs));
      else if (this.match("TRAIT")) traits.push(this.parseTraitDeclaration(docs));
      else if (this.match("IMPL")) impls.push(this.parseImplDeclaration(docs));
      else if (this.match("MACRO")) macros.push(this.parseMacroDeclaration(docs));
      else if (this.match("MODULE")) modules.push(this.parseModuleDeclaration(docs));
      else if (this.match("ASYNC", "FUNCTION")) functions.push(this.parseFunctionFromCurrent(docs));
      else if (this.match("TEST")) tests.push(this.parseTestDeclaration(docs));
      else break;
      this.skipTrivia();
    }

    this.consume("BEGIN", "Expected BEGIN");
    this.skipTrivia();
    const body = this.parseStatementsUntil(["END"]);
    const endToken = this.consume("END", "Expected END");
    this.skipTrivia();
    this.consume("EOF", "Expected end of file");

    return {
      kind: "Program",
      name: name.lexeme,
      imports,
      exports,
      plugins,
      consts,
      enums,
      traits,
      impls,
      macros,
      modules,
      functions,
      tests,
      body,
      range: this.mergeRanges(programToken.range, endToken.range)
    };
  }

  private parseImport(docs?: string[]): ImportDeclarationNode {
    const start = this.previous().range;
    const importedName = this.consume("IDENTIFIER", "Expected import name");
    let alias: string | undefined;
    if (this.match("AS")) alias = this.consume("IDENTIFIER", "Expected alias").lexeme;
    this.consume("FROM", "Expected FROM in import");
    const modulePath = this.consume("STRING", "Expected string path after FROM");
    return { kind: "ImportDeclaration", importedName: importedName.lexeme, alias, modulePath: modulePath.lexeme, docs, range: this.mergeRanges(start, modulePath.range) };
  }

  private parseExport(docs?: string[]): ExportDeclarationNode {
    const start = this.previous().range;
    const name = this.consume("IDENTIFIER", "Expected export name");
    return { kind: "ExportDeclaration", name: name.lexeme, docs, range: this.mergeRanges(start, name.range) };
  }

  private parsePluginUse(docs?: string[]): PluginUseNode {
    const start = this.previous().range;
    const pluginPath = this.consume("STRING", "Expected plugin path");
    return { kind: "PluginUse", pluginPath: pluginPath.lexeme, docs, range: this.mergeRanges(start, pluginPath.range) };
  }

  private parseConstDeclaration(docs?: string[]): ConstDeclarationNode {
    const start = this.previous().range;
    const name = this.consume("IDENTIFIER", "Expected const name");
    this.consume("ASSIGN", "Expected = in const declaration");
    const expression = this.parseExpression();
    return { kind: "ConstDeclaration", name: name.lexeme, expression, docs, range: this.mergeRanges(start, expression.range) };
  }

  private parseEnumDeclaration(docs?: string[]): EnumDeclarationNode {
    const start = this.previous().range;
    const name = this.consume("IDENTIFIER", "Expected enum name");
    if (this.match("COLON")) this.skipTrivia();
    const variants: EnumVariantNode[] = [];
    while (!this.check("END") && !this.check("EOF")) {
      if (this.match("NEWLINE")) continue;
      const variantName = this.consume("IDENTIFIER", "Expected enum variant name");
      const fields: TypedName[] = [];
      if (this.match("LPAREN")) {
        if (!this.check("RPAREN")) {
          do fields.push(this.parseTypedName());
          while (this.match("COMMA"));
        }
        this.consume("RPAREN", "Expected ) after variant fields");
      }
      variants.push({ kind: "EnumVariant", name: variantName.lexeme, fields, range: this.mergeRanges(variantName.range, this.previous().range) });
      this.skipTrivia();
    }
    const endToken = this.consume("END", "Expected END after enum");
    return { kind: "EnumDeclaration", name: name.lexeme, variants, docs, range: this.mergeRanges(start, endToken.range) };
  }

  private parseTraitDeclaration(docs?: string[]): TraitDeclarationNode {
    const start = this.previous().range;
    const name = this.consume("IDENTIFIER", "Expected trait name");
    const composedTraits: string[] = [];
    if (this.match("COLON")) {
      do composedTraits.push(this.consume("IDENTIFIER", "Expected composed trait name").lexeme);
      while (this.match("COMMA"));
    }
    this.skipTrivia();
    const methods: FunctionDeclarationNode[] = [];
    while (!this.check("END-TRAIT") && !this.check("EOF")) {
      if (this.match("NEWLINE")) continue;
      const docsForMethod = this.takeDocs();
      this.match("ASYNC");
      this.consume("FUNCTION", "Expected FUNCTION inside trait");
      methods.push(this.parseFunctionFromCurrent(docsForMethod));
      this.skipTrivia();
    }
    const endToken = this.consume("END-TRAIT", "Expected END-TRAIT");
    return { kind: "TraitDeclaration", name: name.lexeme, composedTraits, methods, docs, range: this.mergeRanges(start, endToken.range) };
  }

  private parseImplDeclaration(docs?: string[]): ImplDeclarationNode {
    const start = this.previous().range;
    const first = this.consume("IDENTIFIER", "Expected trait or type name");
    let traitName: string | undefined;
    let targetType = first.lexeme;
    if (this.match("FOR")) {
      traitName = first.lexeme;
      targetType = this.consume("IDENTIFIER", "Expected impl target type").lexeme;
    }
    if (this.match("COLON")) this.skipTrivia();
    const methods: FunctionDeclarationNode[] = [];
    while (!this.check("END-IMPL") && !this.check("EOF")) {
      if (this.match("NEWLINE")) continue;
      const docsForMethod = this.takeDocs();
      this.match("ASYNC");
      this.consume("FUNCTION", "Expected FUNCTION inside impl");
      methods.push(this.parseFunctionFromCurrent(docsForMethod));
      this.skipTrivia();
    }
    const endToken = this.consume("END-IMPL", "Expected END-IMPL");
    return { kind: "ImplDeclaration", traitName, targetType, methods, docs, range: this.mergeRanges(start, endToken.range) };
  }

  private parseMacroDeclaration(docs?: string[]): MacroDeclarationNode {
    const start = this.previous().range;
    const name = this.consume("IDENTIFIER", "Expected macro name");
    const params = this.parseIdentifierList();
    this.skipTrivia();
    this.consume("BEGIN", "Expected BEGIN in macro");
    this.skipTrivia();
    const body = this.parseStatementsUntil(["END-MACRO"]);
    const endToken = this.consume("END-MACRO", "Expected END-MACRO");
    return { kind: "MacroDeclaration", name: name.lexeme, params, body, docs, range: this.mergeRanges(start, endToken.range) };
  }

  private parseModuleDeclaration(docs?: string[]): ModuleDeclarationNode {
    const start = this.previous().range;
    const name = this.consume("IDENTIFIER", "Expected module name");
    this.skipTrivia();
    this.consume("BEGIN", "Expected BEGIN in module");
    this.skipTrivia();

    const exports: ExportDeclarationNode[] = [];
    const consts: ConstDeclarationNode[] = [];
    const enums: EnumDeclarationNode[] = [];
    const traits: TraitDeclarationNode[] = [];
    const impls: ImplDeclarationNode[] = [];
    const macros: MacroDeclarationNode[] = [];
    const functions: FunctionDeclarationNode[] = [];

    while (!this.check("END-MODULE") && !this.check("EOF")) {
      const docsForMember = this.takeDocs();
      if (this.match("EXPORT")) exports.push(this.parseExport(docsForMember));
      else if (this.match("CONST")) consts.push(this.parseConstDeclaration(docsForMember));
      else if (this.match("ENUM")) enums.push(this.parseEnumDeclaration(docsForMember));
      else if (this.match("TRAIT")) traits.push(this.parseTraitDeclaration(docsForMember));
      else if (this.match("IMPL")) impls.push(this.parseImplDeclaration(docsForMember));
      else if (this.match("MACRO")) macros.push(this.parseMacroDeclaration(docsForMember));
      else if (this.match("ASYNC", "FUNCTION")) functions.push(this.parseFunctionFromCurrent(docsForMember));
      else this.skipTrivia();
      this.skipTrivia();
    }

    const endToken = this.consume("END-MODULE", "Expected END-MODULE");
    return { kind: "ModuleDeclaration", name: name.lexeme, exports, consts, enums, traits, impls, macros, functions, docs, range: this.mergeRanges(start, endToken.range) };
  }

  private parseFunctionFromCurrent(docs?: string[]): FunctionDeclarationNode {
    const functionToken = this.previous();
    const isAsync = functionToken.type === "ASYNC";
    if (functionToken.type !== "FUNCTION") this.consume("FUNCTION", "Expected FUNCTION");
    const name = this.consume("IDENTIFIER", "Expected function name");
    const genericParams = this.parseGenericParams();
    const params = this.parseTypedNameList();
    let returnType: string | undefined;
    let returnLifetime: string | undefined;
    if (this.match("ARROW")) {
      const typeRef = this.parseTypeReference();
      returnType = typeRef.typeName;
      returnLifetime = typeRef.lifetime;
    }
    this.skipTrivia();
    this.consume("BEGIN", "Expected BEGIN after function signature");
    this.skipTrivia();
    const body = this.parseStatementsUntil(["END-FUNCTION"]);
    const endToken = this.consume("END-FUNCTION", "Expected END-FUNCTION");
    const signature: FunctionSignatureNode = {
      kind: "FunctionSignature",
      name: name.lexeme,
      genericParams,
      params,
      returnType,
      returnLifetime,
      isAsync,
      range: this.mergeRanges(name.range, endToken.range)
    };
    return { kind: "FunctionDeclaration", signature, body, docs, range: this.mergeRanges(functionToken.range, endToken.range) };
  }

  private parseTestDeclaration(docs?: string[]): TestDeclarationNode {
    const start = this.previous().range;
    const name = this.consume("STRING", "Expected test name");
    this.skipTrivia();
    this.consume("BEGIN", "Expected BEGIN in test");
    this.skipTrivia();
    const body = this.parseStatementsUntil(["END-TEST"]);
    const endToken = this.consume("END-TEST", "Expected END-TEST");
    return { kind: "TestDeclaration", name: name.lexeme, body, docs, range: this.mergeRanges(start, endToken.range) };
  }

  private parseStatementsUntil(stopTokens: TokenType[]): StatementNode[] {
    const statements: StatementNode[] = [];
    while (!this.checkAny(stopTokens) && !this.check("EOF")) {
      this.skipTrivia();
      if (this.checkAny(stopTokens) || this.check("EOF")) break;
      statements.push(this.parseStatement());
      this.skipTrivia();
    }
    return statements;
  }

  private parseStatement(): StatementNode {
    if (this.match("LET")) return this.parseLetStatement();
    if (this.match("SET")) return this.parseSetStatement();
    if (this.match("DISPLAY")) return this.parseDisplayStatement();
    if (this.match("INPUT")) return this.parseInputStatement();
    if (this.match("IF")) return this.parseIfStatement();
    if (this.match("MATCH")) return this.parseMatchStatement();
    if (this.match("RETURN")) return this.parseReturnStatement();
    if (this.match("UNSAFE")) return this.parseUnsafeBlock();
    if (this.match("ASSERT")) return this.parseAssertStatement();
    if (this.match("SPAWN")) return this.parseSpawnStatement();
    const expression = this.parseExpression();
    return { kind: "ExpressionStatement", expression, range: expression.range } satisfies ExpressionStatementNode;
  }

  private parseLetStatement(): LetStatementNode {
    const start = this.previous().range;
    const isMutable = this.match("MUT");
    const binding = this.parseTypedName();
    this.consume("ASSIGN", "Expected = in let statement");
    const expression = this.parseExpression();
    return { kind: "LetStatement", binding, expression, isMutable, range: this.mergeRanges(start, expression.range) };
  }

  private parseSetStatement(): SetStatementNode {
    const start = this.previous().range;
    const name = this.consume("IDENTIFIER", "Expected variable name after SET");
    this.consume("ASSIGN", "Expected = in SET statement");
    const expression = this.parseExpression();
    return { kind: "SetStatement", name: name.lexeme, expression, range: this.mergeRanges(start, expression.range) };
  }

  private parseDisplayStatement(): DisplayStatementNode {
    const start = this.previous().range;
    const expression = this.parseExpression();
    return { kind: "DisplayStatement", expression, range: this.mergeRanges(start, expression.range) };
  }

  private parseInputStatement(): InputStatementNode {
    const start = this.previous().range;
    const name = this.consume("IDENTIFIER", "Expected variable name after INPUT");
    let prompt: ExpressionNode | undefined;
    if (!this.check("NEWLINE") && !this.check("EOF")) prompt = this.parseExpression();
    return { kind: "InputStatement", name: name.lexeme, prompt, range: this.mergeRanges(start, prompt?.range ?? name.range) };
  }

  private parseIfStatement(): IfStatementNode {
    const start = this.previous().range;
    const condition = this.parseExpression();
    this.consume("THEN", "Expected THEN after IF condition");
    this.skipTrivia();
    const thenBranch = this.parseStatementsUntil(["ELSE", "END-IF"]);
    let elseBranch: StatementNode[] = [];
    if (this.match("ELSE")) {
      this.skipTrivia();
      elseBranch = this.parseStatementsUntil(["END-IF"]);
    }
    const endToken = this.consume("END-IF", "Expected END-IF");
    return { kind: "IfStatement", condition, thenBranch, elseBranch, range: this.mergeRanges(start, endToken.range) };
  }

  private parseMatchStatement(): MatchStatementNode {
    const start = this.previous().range;
    const expression = this.parseExpression();
    this.consume("COLON", "Expected : after MATCH expression");
    this.skipTrivia();
    const arms: MatchArmNode[] = [];
    while (!this.check("END-MATCH") && !this.check("EOF")) {
      if (this.match("NEWLINE")) continue;
      const pattern = this.parsePattern();
      this.consume("COLON", "Expected : after match pattern");
      this.skipTrivia();
      const body: StatementNode[] = [];
      while (!this.check("END-MATCH") && !this.check("EOF") && !this.isPatternArmBoundary()) {
        body.push(this.parseStatement());
        this.skipTrivia();
      }
      arms.push({ kind: "MatchArm", pattern, body, range: this.mergeRanges(pattern.range, body.at(-1)?.range ?? pattern.range) });
      this.skipTrivia();
      if (!this.check("END-MATCH") && this.isPatternArmBoundary()) continue;
    }
    const endToken = this.consume("END-MATCH", "Expected END-MATCH");
    return { kind: "MatchStatement", expression, arms, range: this.mergeRanges(start, endToken.range) };
  }

  private parseReturnStatement(): ReturnStatementNode {
    const start = this.previous().range;
    const expression = this.parseExpression();
    return { kind: "ReturnStatement", expression, range: this.mergeRanges(start, expression.range) };
  }

  private parseUnsafeBlock(): UnsafeBlockNode {
    const start = this.previous().range;
    this.skipTrivia();
    this.consume("BEGIN", "Expected BEGIN after UNSAFE");
    this.skipTrivia();
    const body = this.parseStatementsUntil(["END-UNSAFE"]);
    const endToken = this.consume("END-UNSAFE", "Expected END-UNSAFE");
    return { kind: "UnsafeBlock", body, range: this.mergeRanges(start, endToken.range) };
  }

  private parseAssertStatement(): AssertStatementNode {
    const start = this.previous().range;
    const expression = this.parseExpression();
    return { kind: "AssertStatement", expression, range: this.mergeRanges(start, expression.range) };
  }

  private parseSpawnStatement(): SpawnStatementNode {
    const start = this.previous().range;
    const expression = this.parseExpression();
    return { kind: "SpawnStatement", expression, range: this.mergeRanges(start, expression.range) };
  }

  private parsePattern(): PatternNode {
    if (this.match("IDENTIFIER")) {
      const token = this.previous();
      if (token.lexeme === "_") return { kind: "WildcardPattern", range: token.range } satisfies WildcardPatternNode;
      if (this.match("LPAREN")) {
        const bindings: string[] = [];
        if (!this.check("RPAREN")) {
          do bindings.push(this.consume("IDENTIFIER", "Expected pattern binding").lexeme);
          while (this.match("COMMA"));
        }
        const close = this.consume("RPAREN", "Expected ) after pattern");
        return { kind: "VariantPattern", variantName: token.lexeme, bindings, range: this.mergeRanges(token.range, close.range) } satisfies VariantPatternNode;
      }
      return { kind: "IdentifierPattern", name: token.lexeme, range: token.range } satisfies IdentifierPatternNode;
    }
    if (this.match("NUMBER", "STRING", "TRUE", "FALSE")) {
      const expression = this.literalFromToken(this.previous());
      return { kind: "LiteralPattern", expression, range: expression.range } satisfies LiteralPatternNode;
    }
    throw new CobolxError({ message: "Expected match pattern", range: this.peek().range, severity: "error" });
  }

  private parseExpression(): ExpressionNode {
    return this.parseComparison();
  }

  private parseComparison(): ExpressionNode {
    let expression = this.parseTerm();
    while (this.match("LESS", "LESS_EQUAL", "GREATER", "GREATER_EQUAL", "NOT_EQUAL", "ASSIGN")) {
      const operator = this.previous();
      const mappedOperator = operator.type === "ASSIGN" ? "==" : operator.lexeme;
      const right = this.parseTerm();
      expression = this.binaryNode(expression, mappedOperator, right);
    }
    return expression;
  }

  private parseTerm(): ExpressionNode {
    let expression = this.parseFactor();
    while (this.match("PLUS", "MINUS")) {
      const operator = this.previous();
      const right = this.parseFactor();
      expression = this.binaryNode(expression, operator.lexeme, right);
    }
    return expression;
  }

  private parseFactor(): ExpressionNode {
    let expression = this.parseUnary();
    while (this.match("STAR", "SLASH", "PERCENT")) {
      const operator = this.previous();
      const right = this.parseUnary();
      expression = this.binaryNode(expression, operator.lexeme, right);
    }
    return expression;
  }

  private parseUnary(): ExpressionNode {
    if (this.match("MINUS", "BANG", "AMPERSAND")) {
      const operator = this.previous();
      const operand = this.parseUnary();
      return { kind: "UnaryExpression", operator: operator.lexeme, operand, range: this.mergeRanges(operator.range, operand.range) } satisfies UnaryExpressionNode;
    }
    return this.parsePostfix();
  }

  private parsePostfix(): ExpressionNode {
    let expression = this.parsePrimary();
    while (true) {
      if (this.match("BANG")) {
        if (expression.kind !== "Identifier") throw new CobolxError({ message: "Macros must be invoked by name", range: expression.range, severity: "error" });
        const args = this.parseCallArguments();
        expression = { kind: "MacroInvocation", name: expression.name, args, range: this.mergeRanges(expression.range, this.previous().range) } satisfies MacroInvocationNode;
        continue;
      }
      if (this.check("LPAREN")) {
        const start = expression.range;
        const args = this.parseCallArguments();
        expression = { kind: "CallExpression", callee: expression, args, range: this.mergeRanges(start, this.previous().range) } satisfies CallExpressionNode;
        continue;
      }
      if (this.match("DOT")) {
        const property = this.consume("IDENTIFIER", "Expected property name after .");
        expression = { kind: "MemberExpression", object: expression, property: property.lexeme, range: this.mergeRanges(expression.range, property.range) } satisfies MemberExpressionNode;
        continue;
      }
      if (this.match("QUESTION")) {
        expression = { kind: "TryExpression", expression, range: this.mergeRanges(expression.range, this.previous().range) } satisfies TryExpressionNode;
        continue;
      }
      break;
    }
    return expression;
  }

  private parsePrimary(): ExpressionNode {
    if (this.match("NUMBER", "STRING", "TRUE", "FALSE")) return this.literalFromToken(this.previous());
    if (this.match("IDENTIFIER")) {
      const token = this.previous();
      if (this.check("LPAREN") && /^[A-Z]/.test(token.lexeme)) {
        const args = this.parseCallArguments();
        return { kind: "EnumConstructorExpression", variantName: token.lexeme, fields: args, range: this.mergeRanges(token.range, this.previous().range) } satisfies EnumConstructorExpressionNode;
      }
      return { kind: "Identifier", name: token.lexeme, range: token.range } satisfies IdentifierNode;
    }
    if (this.match("LBRACKET")) {
      const start = this.previous().range;
      const items: ExpressionNode[] = [];
      if (!this.check("RBRACKET")) {
        do items.push(this.parseExpression());
        while (this.match("COMMA"));
      }
      const close = this.consume("RBRACKET", "Expected ] after array literal");
      return { kind: "ArrayLiteral", items, range: this.mergeRanges(start, close.range) } satisfies ArrayLiteralNode;
    }
    if (this.match("LPAREN")) {
      const expression = this.parseExpression();
      this.consume("RPAREN", "Expected ) after expression");
      return expression;
    }
    throw new CobolxError({ message: `Unexpected token ${this.peek().type}`, range: this.peek().range, severity: "error" });
  }

  private literalFromToken(token: Token): ExpressionNode {
    if (token.type === "NUMBER") return { kind: "NumberLiteral", value: Number(token.lexeme), range: token.range } satisfies NumberLiteralNode;
    if (token.type === "STRING") return { kind: "StringLiteral", value: token.lexeme, range: token.range } satisfies StringLiteralNode;
    return { kind: "BooleanLiteral", value: token.type === "TRUE", range: token.range } satisfies BooleanLiteralNode;
  }

  private parseTypedName(): TypedName {
    let lifetime: string | undefined;
    if (this.match("AMPERSAND")) lifetime = this.consume("IDENTIFIER", "Expected lifetime").lexeme;
    const name = this.consume("IDENTIFIER", "Expected name");
    let typeName: string | undefined;
    if (this.match("COLON")) {
      const type = this.parseTypeReference();
      typeName = type.typeName;
      lifetime = lifetime ?? type.lifetime;
    }
    return { name: name.lexeme, typeName, lifetime };
  }

  private parseTypeReference(): { typeName: string; lifetime?: string } {
    let lifetime: string | undefined;
    if (this.match("AMPERSAND")) lifetime = this.consume("IDENTIFIER", "Expected lifetime").lexeme;
    const typeName = this.consume("IDENTIFIER", "Expected type name").lexeme;
    return { typeName, lifetime };
  }

  private parseGenericParams(): GenericParam[] {
    const params: GenericParam[] = [];
    if (!this.match("LESS")) return params;
    do {
      let lifetime: string | undefined;
      if (this.match("AMPERSAND")) lifetime = this.consume("IDENTIFIER", "Expected lifetime").lexeme;
      const name = this.consume("IDENTIFIER", "Expected generic parameter").lexeme;
      let bound: string | undefined;
      if (this.match("COLON")) bound = this.consume("IDENTIFIER", "Expected generic bound").lexeme;
      params.push({ name, bound, lifetime });
    } while (this.match("COMMA"));
    this.consume("GREATER", "Expected > after generic parameters");
    return params;
  }

  private parseTypedNameList(): TypedName[] {
    this.consume("LPAREN", "Expected (");
    const params: TypedName[] = [];
    if (!this.check("RPAREN")) {
      do params.push(this.parseTypedName());
      while (this.match("COMMA"));
    }
    this.consume("RPAREN", "Expected )");
    return params;
  }

  private parseIdentifierList(): string[] {
    this.consume("LPAREN", "Expected (");
    const ids: string[] = [];
    if (!this.check("RPAREN")) {
      do ids.push(this.consume("IDENTIFIER", "Expected identifier").lexeme);
      while (this.match("COMMA"));
    }
    this.consume("RPAREN", "Expected )");
    return ids;
  }

  private parseCallArguments(): ExpressionNode[] {
    this.consume("LPAREN", "Expected (");
    const args: ExpressionNode[] = [];
    if (!this.check("RPAREN")) {
      do args.push(this.parseExpression());
      while (this.match("COMMA"));
    }
    this.consume("RPAREN", "Expected )");
    return args;
  }

  private looksLikePatternStart(): boolean {
    return this.check("IDENTIFIER") || this.check("NUMBER") || this.check("STRING") || this.check("TRUE") || this.check("FALSE");
  }

  private isPatternArmBoundary(): boolean {
    if (!this.looksLikePatternStart()) return false;
    if (this.peek().type !== "IDENTIFIER") return this.tokens[this.index + 1]?.type === "COLON";
    const next = this.tokens[this.index + 1];
    if (!next) return false;
    if (next.type === "COLON") return true;
    if (next.type !== "LPAREN") return false;
    let cursor = this.index + 2;
    let depth = 1;
    while (cursor < this.tokens.length && depth > 0) {
      const token = this.tokens[cursor];
      if (token.type === "LPAREN") depth += 1;
      if (token.type === "RPAREN") depth -= 1;
      cursor += 1;
    }
    return this.tokens[cursor]?.type === "COLON";
  }

  private skipTrivia(): void {
    while (true) {
      if (this.match("NEWLINE")) continue;
      if (this.match("DOC_COMMENT")) {
        this.pendingDocs.push(this.previous().lexeme);
        continue;
      }
      break;
    }
  }

  private takeDocs(): string[] | undefined {
    if (this.pendingDocs.length === 0) return undefined;
    const docs = [...this.pendingDocs];
    this.pendingDocs = [];
    return docs;
  }

  private binaryNode(left: ExpressionNode, operator: string, right: ExpressionNode): BinaryExpressionNode {
    return { kind: "BinaryExpression", operator, left, right, range: this.mergeRanges(left.range, right.range) };
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw new CobolxError({ message, range: this.peek().range, severity: "error" });
  }

  private check(type: TokenType): boolean {
    return this.peek().type === type;
  }

  private checkAny(types: TokenType[]): boolean {
    return types.some((type) => this.check(type));
  }

  private advance(): Token {
    if (this.index < this.tokens.length) this.index += 1;
    return this.previous();
  }

  private peek(): Token {
    return this.tokens[this.index];
  }

  private previous(): Token {
    return this.tokens[this.index - 1];
  }

  private mergeRanges(start: SourceRange, end: SourceRange): SourceRange {
    return { start: start.start, end: end.end };
  }
}
