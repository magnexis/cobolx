import {
  CompletionItemKind,
  createConnection,
  DiagnosticSeverity,
  Hover,
  InitializeParams,
  ProposedFeatures,
  TextDocuments,
  TextDocumentSyncKind
} from "vscode-languageserver/node.js";
import { TextDocument } from "vscode-languageserver-textdocument";
import { analyzeSource, CobolxError } from "@cobolx/compiler";

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

const KEYWORD_COMPLETIONS = [
  "PROGRAM",
  "BEGIN",
  "END",
  "SET",
  "DISPLAY",
  "INPUT",
  "IF",
  "THEN",
  "ELSE",
  "END-IF",
  "FUNCTION",
  "RETURN",
  "END-FUNCTION",
  "TRUE",
  "FALSE"
];

connection.onInitialize((_params: InitializeParams) => ({
  capabilities: {
    textDocumentSync: TextDocumentSyncKind.Incremental,
    completionProvider: {},
    hoverProvider: true
  }
}));

documents.onDidChangeContent(({ document }) => {
  validateDocument(document);
});

documents.onDidOpen(({ document }) => {
  validateDocument(document);
});

connection.onCompletion(() =>
  KEYWORD_COMPLETIONS.map((label) => ({
    label,
    kind: CompletionItemKind.Keyword
  }))
);

connection.onHover(({ textDocument, position }): Hover | null => {
  const document = documents.get(textDocument.uri);
  if (!document) {
    return null;
  }

  const word = getWordAt(document, position.line, position.character);
  if (!word) {
    return null;
  }

  const keywordDocs: Record<string, string> = {
    PROGRAM: "Declares the program name.",
    BEGIN: "Starts the executable body.",
    END: "Ends the program body.",
    SET: "Assigns a variable from an expression.",
    DISPLAY: "Prints a value to standard output.",
    INPUT: "Reads a value from standard input.",
    IF: "Starts a conditional block.",
    THEN: "Separates an IF condition from its body.",
    ELSE: "Starts the fallback branch of an IF block.",
    "END-IF": "Closes an IF block.",
    FUNCTION: "Declares a reusable function.",
    RETURN: "Returns a value from a function.",
    "END-FUNCTION": "Closes a function block."
  };

  const uppercase = word.toUpperCase();
  if (keywordDocs[uppercase]) {
    return {
      contents: {
        kind: "markdown",
        value: `**${uppercase}**\n\n${keywordDocs[uppercase]}`
      }
    };
  }

  return {
    contents: {
      kind: "markdown",
      value: `Identifier \`${word}\``
    }
  };
});

async function validateDocument(document: TextDocument): Promise<void> {
  try {
    const result = analyzeSource(document.getText());
    connection.sendDiagnostics({
      uri: document.uri,
      diagnostics: result.diagnostics.map((diagnostic) => ({
        severity: diagnostic.severity === "warning" ? DiagnosticSeverity.Warning : DiagnosticSeverity.Error,
        range: {
          start: {
            line: diagnostic.range.start.line - 1,
            character: diagnostic.range.start.column - 1
          },
          end: {
            line: diagnostic.range.end.line - 1,
            character: diagnostic.range.end.column - 1
          }
        },
        message: diagnostic.message,
        source: "cobolx"
      }))
    });
  } catch (error) {
    if (error instanceof CobolxError) {
      connection.sendDiagnostics({
        uri: document.uri,
        diagnostics: [
          {
            severity: DiagnosticSeverity.Error,
            range: {
              start: {
                line: error.diagnostic.range.start.line - 1,
                character: error.diagnostic.range.start.column - 1
              },
              end: {
                line: error.diagnostic.range.end.line - 1,
                character: error.diagnostic.range.end.column - 1
              }
            },
            message: error.diagnostic.message,
            source: "cobolx"
          }
        ]
      });
    } else {
      connection.console.error(String(error));
    }
  }
}

function getWordAt(document: TextDocument, line: number, character: number): string | null {
  const text = document.getText();
  const lines = text.split(/\r?\n/);
  const current = lines[line] ?? "";
  const matches = current.matchAll(/[A-Za-z_-][A-Za-z0-9_-]*/g);
  for (const match of matches) {
    const start = match.index ?? 0;
    const end = start + match[0].length;
    if (character >= start && character <= end) {
      return match[0];
    }
  }
  return null;
}

documents.listen(connection);
connection.listen();
