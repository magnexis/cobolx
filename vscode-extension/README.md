# COBOL-X VS Code Extension

COBOL-X language support for Visual Studio Code.

## Features

- Language registration for `.cbx`, `.cob`, and `.col`
- Syntax highlighting for COBOL-X keywords, functions, types, strings, comments, and numbers
- LSP-backed diagnostics, hover information, and keyword completions
- Snippets for common program, function, enum, and match scaffolds
- Commands:
  - `COBOL-X: Run File`
  - `COBOL-X: Build Project`
  - `COBOL-X: Open REPL`
  - `COBOL-X: Debug Current Project`

## Development

```powershell
npm install
npm run build
```

Open the repository in VS Code and launch the extension development host with `F5`.

Command execution uses the local repo CLI when the workspace contains the COBOL-X monorepo. In standalone projects, it falls back to a `cobolx` executable on your `PATH`.

## Packaging

```powershell
npm install -g vsce
cd vscode-extension
npx @vscode/vsce package
```

Install the generated `.vsix` with:

```powershell
code --install-extension cobolx-1.0.0.vsix
```

## Publishing

1. Create a publisher in Azure DevOps.
2. Generate a Personal Access Token with Marketplace permissions.
3. Login with `vsce login Magnexis`
4. Publish with `vsce publish`
