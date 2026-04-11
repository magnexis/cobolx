# VS Code Extension

The COBOL-X VS Code extension lives in [vscode-extension](/c:/Users/matth/Desktop/temp%20folder/vscode-extension:1).

## Included Features

- Language registration for `cobolx`
- File associations for `.cbx`, `.cob`, and `.col`
- TextMate grammar for syntax highlighting
- Snippets for programs, functions, enums, and match blocks
- Language client integration with the local COBOL-X language server
- Commands for build, run, REPL, and basic debug launch

Command routing:

- In the COBOL-X monorepo, the extension uses the local `cli/cobolx-cli/dist/index.js`
- In standalone projects, it falls back to `cobolx` on the system `PATH`

## Local Testing

1. Run `npm install`
2. Run `npm run build`
3. Open the repo in VS Code
4. Press `F5` to launch an Extension Development Host
5. Open a `.cbx` file and confirm syntax coloring, hover text, diagnostics, and command palette entries

## Marketplace Packaging

```powershell
cd vscode-extension
npm install -g vsce
npx @vscode/vsce package
```

## Publishing

```powershell
vsce login Magnexis
vsce publish
```
