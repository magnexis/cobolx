import { exec } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import * as vscode from "vscode";

const execAsync = promisify(exec);
const COBOLX_SELECTOR: vscode.DocumentSelector = [{ scheme: "file", language: "cobolx" }];
const KEYWORDS = [
  "PROGRAM",
  "BEGIN",
  "END",
  "SET",
  "LET",
  "MUT",
  "DISPLAY",
  "INPUT",
  "IF",
  "THEN",
  "ELSE",
  "END-IF",
  "FUNCTION",
  "RETURN",
  "END-FUNCTION",
  "CONST",
  "ENUM",
  "MATCH",
  "END-MATCH",
  "MACRO",
  "END-MACRO",
  "ASYNC",
  "SPAWN",
  "ASSERT",
  "UNSAFE",
  "END-UNSAFE",
  "TRUE",
  "FALSE"
];

const KEYWORD_DOCS: Record<string, string> = {
  PROGRAM: "Declares the program name.",
  BEGIN: "Starts an executable block.",
  END: "Closes the program or enum block.",
  SET: "Assigns a mutable variable.",
  LET: "Introduces a local binding.",
  MUT: "Marks a `LET` binding as mutable.",
  DISPLAY: "Writes a value to standard output.",
  INPUT: "Reads a value from standard input.",
  IF: "Begins a conditional block.",
  THEN: "Separates an IF condition from its body.",
  ELSE: "Begins the fallback branch of an IF block.",
  "END-IF": "Closes a conditional block.",
  FUNCTION: "Declares a reusable function.",
  RETURN: "Returns from a function.",
  "END-FUNCTION": "Closes a function declaration.",
  CONST: "Declares a compile-time constant.",
  ENUM: "Declares tagged variants.",
  MATCH: "Pattern matches over a value.",
  "END-MATCH": "Closes a match block.",
  MACRO: "Declares a compile-time macro.",
  "END-MACRO": "Closes a macro declaration.",
  ASYNC: "Marks a function as asynchronous.",
  SPAWN: "Schedules a background task.",
  ASSERT: "Checks a condition at runtime.",
  UNSAFE: "Enters an explicitly unsafe block.",
  "END-UNSAFE": "Closes an unsafe block.",
  TRUE: "Boolean true literal.",
  FALSE: "Boolean false literal."
};

let terminal: vscode.Terminal | undefined;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const diagnostics = vscode.languages.createDiagnosticCollection("cobolx");
  context.subscriptions.push(
    diagnostics,
    registerDiagnostics(diagnostics),
    registerCompletionProvider(),
    registerHoverProvider(),
    registerCommands()
  );
}

export function deactivate(): void {
  terminal?.dispose();
}

function registerDiagnostics(collection: vscode.DiagnosticCollection): vscode.Disposable {
  const refresh = (document: vscode.TextDocument): void => {
    if (document.languageId !== "cobolx") return;
    collection.set(document.uri, computeDiagnostics(document));
  };

  vscode.workspace.textDocuments.forEach(refresh);

  return vscode.Disposable.from(
    vscode.workspace.onDidOpenTextDocument(refresh),
    vscode.workspace.onDidChangeTextDocument((event) => refresh(event.document)),
    vscode.workspace.onDidCloseTextDocument((document) => collection.delete(document.uri))
  );
}

function computeDiagnostics(document: vscode.TextDocument): vscode.Diagnostic[] {
  const diagnostics: vscode.Diagnostic[] = [];
  const lines = document.getText().split(/\r?\n/);
  const joined = lines.join("\n");

  if (!/\bPROGRAM\b/.test(joined)) {
    diagnostics.push(new vscode.Diagnostic(new vscode.Range(0, 0, 0, 1), "A COBOL-X file should start with a PROGRAM declaration.", vscode.DiagnosticSeverity.Error));
  }

  const beginCount = countToken(lines, "BEGIN");
  const endCount = countToken(lines, "END");
  if (beginCount > endCount) {
    const line = Math.max(lines.length - 1, 0);
    diagnostics.push(new vscode.Diagnostic(new vscode.Range(line, 0, line, Math.max(lines[line]?.length ?? 1, 1)), "Missing END for a BEGIN block.", vscode.DiagnosticSeverity.Error));
  }

  const ifCount = countToken(lines, "IF");
  const endIfCount = countToken(lines, "END-IF");
  if (ifCount > endIfCount) {
    diagnostics.push(new vscode.Diagnostic(findTokenRange(lines, "IF"), "Missing END-IF for conditional block.", vscode.DiagnosticSeverity.Warning));
  }

  const matchCount = countToken(lines, "MATCH");
  const endMatchCount = countToken(lines, "END-MATCH");
  if (matchCount > endMatchCount) {
    diagnostics.push(new vscode.Diagnostic(findTokenRange(lines, "MATCH"), "Missing END-MATCH for match block.", vscode.DiagnosticSeverity.Warning));
  }

  return diagnostics;
}

function countToken(lines: string[], token: string): number {
  const pattern = new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");
  return lines.reduce((total, line) => total + (line.match(pattern)?.length ?? 0), 0);
}

function findTokenRange(lines: string[], token: string): vscode.Range {
  const pattern = new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
  for (let index = 0; index < lines.length; index += 1) {
    const match = pattern.exec(lines[index] ?? "");
    if (match?.index !== undefined) {
      return new vscode.Range(index, match.index, index, match.index + token.length);
    }
  }
  return new vscode.Range(0, 0, 0, 1);
}

function registerCompletionProvider(): vscode.Disposable {
  return vscode.languages.registerCompletionItemProvider(
    COBOLX_SELECTOR,
    {
      provideCompletionItems(): vscode.CompletionItem[] {
        return KEYWORDS.map((keyword) => {
          const item = new vscode.CompletionItem(keyword, vscode.CompletionItemKind.Keyword);
          item.detail = "COBOL-X keyword";
          item.documentation = new vscode.MarkdownString(KEYWORD_DOCS[keyword] ?? "COBOL-X keyword");
          return item;
        });
      }
    }
  );
}

function registerHoverProvider(): vscode.Disposable {
  return vscode.languages.registerHoverProvider(COBOLX_SELECTOR, {
    provideHover(document, position) {
      const range = document.getWordRangeAtPosition(position, /[A-Za-z_-][A-Za-z0-9_-]*/);
      if (!range) return undefined;
      const word = document.getText(range).toUpperCase();
      const docs = KEYWORD_DOCS[word];
      if (!docs) return undefined;
      return new vscode.Hover(new vscode.MarkdownString(`**${word}**\n\n${docs}`), range);
    }
  });
}

function registerCommands(): vscode.Disposable {
  return vscode.Disposable.from(
    vscode.commands.registerCommand("cobolx.runFile", async () => {
      const projectDir = await getProjectRoot();
      if (!projectDir) return;
      runInTerminal(projectDir, `${await resolveCobolxCommand(projectDir)} run`);
    }),
    vscode.commands.registerCommand("cobolx.buildProject", async () => {
      const projectDir = await getProjectRoot();
      if (!projectDir) return;
      runInTerminal(projectDir, `${await resolveCobolxCommand(projectDir)} build`);
    }),
    vscode.commands.registerCommand("cobolx.openRepl", async () => {
      const projectDir = await getProjectRoot();
      if (!projectDir) return;
      runInTerminal(projectDir, `${await resolveCobolxCommand(projectDir)} repl`);
    }),
    vscode.commands.registerCommand("cobolx.debugFile", async () => {
      const projectDir = await getProjectRoot();
      if (!projectDir) return;
      const cobolxCommand = await resolveCobolxCommand(projectDir);

      try {
        await vscode.window.withProgress(
          { location: vscode.ProgressLocation.Notification, title: "Building COBOL-X project for debugging" },
          async () => {
            await execAsync(`${cobolxCommand} build`, {
              cwd: projectDir,
              shell: process.platform === "win32" ? (process.env.ComSpec ?? "cmd.exe") : "/bin/sh"
            });
          }
        );
      } catch (error) {
        void vscode.window.showErrorMessage(`COBOL-X build failed: ${String(error)}`);
        return;
      }

      await vscode.debug.startDebugging(vscode.workspace.getWorkspaceFolder(vscode.Uri.file(projectDir)), {
        type: "pwa-node",
        request: "launch",
        name: "Debug COBOL-X Project",
        cwd: projectDir,
        program: path.join(projectDir, "dist", "main.mjs"),
        env: {
          COBOLX_DEBUG_TRACE_FILE: path.join(projectDir, "dist", "debug-timeline.json")
        }
      });
    })
  );
}

async function getProjectRoot(): Promise<string | undefined> {
  const activeUri = vscode.window.activeTextEditor?.document.uri;
  const candidates = [
    activeUri ? vscode.workspace.getWorkspaceFolder(activeUri)?.uri.fsPath : undefined,
    vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    const found = await findUp(candidate, "cobolx.toml");
    if (found) return found;
  }

  void vscode.window.showErrorMessage("COBOL-X project root not found. Open a folder containing cobolx.toml.");
  return undefined;
}

function runInTerminal(projectDir: string, command: string): void {
  if (!terminal || terminal.exitStatus) {
    terminal = vscode.window.createTerminal({
      name: "COBOL-X",
      cwd: projectDir
    });
  }
  terminal.show(true);
  terminal.sendText(command, true);
}

async function resolveCobolxCommand(projectDir: string): Promise<string> {
  const localRepoRoot = await findUp(projectDir, "package.json");
  if (localRepoRoot) {
    const localCli = path.join(localRepoRoot, "cli", "cobolx-cli", "dist", "index.js");
    try {
      await vscode.workspace.fs.stat(vscode.Uri.file(localCli));
      return `node "${localCli}"`;
    } catch {
      // Fall through to the globally installed CLI.
    }
  }
  return "cobolx";
}

async function findUp(startDir: string, marker: string): Promise<string | undefined> {
  let current = startDir;
  while (true) {
    const candidate = path.join(current, marker);
    try {
      await vscode.workspace.fs.stat(vscode.Uri.file(candidate));
      return current;
    } catch {
      const parent = path.dirname(current);
      if (parent === current) return undefined;
      current = parent;
    }
  }
}
