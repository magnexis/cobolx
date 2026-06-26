# COBOL-X

[![Build](https://img.shields.io/badge/build-passing-brightgreen)](#development)
[![Version](https://img.shields.io/badge/version-1.0.0-blue)](#release)
[![VS Code Extension](https://img.shields.io/badge/vscode_extension-1.2.0-007acc)](#vs-code-extension)
[![License](https://img.shields.io/badge/license-MIT-black)](./LICENSE)
[![npm](https://img.shields.io/npm/v/cobolx-2)](https://www.npmjs.com/package/cobolx-2)

COBOL-X is a modern COBOL-inspired programming platform for readable business logic, deterministic tooling, and backend-oriented workflows. This repository ships a TypeScript-based compiler toolchain, runtime, package manager layer, editor integration, and release validation flow.

## Features

- Working compiler pipeline with lexer, parser, AST, semantic analysis, HIR, MIR, optimization, and JavaScript backend emission
- CLI workflows for build, run, check, test, bench, debug, dev, docs, code generation, migrations, visualization, deploy, and package management
- CargoX manifest, dependency graph, lockfile, install, update, and local publish support
- Runtime modules for scheduling, actors, events, distributed service discovery, observability, workflows, self-healing, and versioned state
- Time-travel debugging support with trace recording and rewind playback
- LSP and VS Code extension support for `.cbx`, `.cob`, and `.col`

## Installation

```bash
npm install cobolx-2
```

### Build from source

```powershell
npm install
npm run build
npm run validate
```

Helper scripts are available in [install.ps1](/c:/Users/matth/Desktop/temp%20folder/install.ps1) and [install.sh](/c:/Users/matth/Desktop/temp%20folder/install.sh).

## Quick Start

```powershell
node cli/cobolx-cli/dist/index.js new my-service api
cd my-service
node ..\cli\cobolx-cli\dist\index.js add ledger 1.2.3
node ..\cli\cobolx-cli\dist\index.js install
node ..\cli\cobolx-cli\dist\index.js run
node ..\cli\cobolx-cli\dist\index.js debug --rewind
```

## COBOL-X Example

```cbx
PROGRAM Payments

ENUM Result:
OK(value)
ERR(message)
END

FUNCTION add(left, right)
BEGIN
  RETURN left + right
END-FUNCTION

BEGIN
  LET subtotal = add(20, 22)
  DISPLAY subtotal
END
```

## Repository Layout

```text
cobolx/
├── compiler/
├── runtime/
├── stdlib/
├── cli/
├── cargox/
├── lsp/
├── vscode-extension/
├── formatter/
├── linter/
├── debugger/
├── profiler/
├── examples/
├── tests/
├── benchmarks/
├── docs/
├── LICENSE
├── CONTRIBUTING.md
├── CHANGELOG.md
└── .gitignore
```

## CLI

- `cobolx build`
- `cobolx run`
- `cobolx check`
- `cobolx test`
- `cobolx bench`
- `cobolx add <pkg> <version>`
- `cobolx install`
- `cobolx update`
- `cobolx publish`
- `cobolx dev`
- `cobolx doc`
- `cobolx repl`
- `cobolx visualize`
- `cobolx deploy`

## VS Code Extension

The publishable extension lives in [vscode-extension](/c:/Users/matth/Desktop/temp%20folder/vscode-extension:1). It includes language registration, syntax highlighting, snippets, LSP-backed diagnostics/hover/completions, and VS Code commands for run, build, REPL, and debug.

VS Code Marketplace:

- [Marketplace Listing Placeholder](https://marketplace.visualstudio.com/items?itemName=magnificent-language.cobolx)

Packaging flow:

```powershell
cd vscode-extension
npm install -g vsce
npx @vscode/vsce package
vsce login Magnexis
vsce publish
```

## Examples

Runnable example apps live under [examples](/c:/Users/matth/Desktop/temp%20folder/examples:1):

- [examples/api-server](/c:/Users/matth/Desktop/temp%20folder/examples/api-server:1)
- [examples/distributed-system](/c:/Users/matth/Desktop/temp%20folder/examples/distributed-system:1)
- [examples/workflow-engine](/c:/Users/matth/Desktop/temp%20folder/examples/workflow-engine:1)
- [examples/event-system](/c:/Users/matth/Desktop/temp%20folder/examples/event-system:1)
- [examples/parallel-processing](/c:/Users/matth/Desktop/temp%20folder/examples/parallel-processing:1)
- [examples/debugging-demo](/c:/Users/matth/Desktop/temp%20folder/examples/debugging-demo:1)

Screenshots:

- `docs/screenshots/cli-build.png`
- `docs/screenshots/debug-rewind.png`
- `docs/screenshots/vscode-extension.png`

## Development

```powershell
npm install
npm run build
npm run check
npm run test
npm run validate
```

Further reading:

- [docs/architecture.md](/c:/Users/matth/Desktop/temp%20folder/docs/architecture.md)
- [docs/language-spec.md](/c:/Users/matth/Desktop/temp%20folder/docs/language-spec.md)
- [docs/cli.md](/c:/Users/matth/Desktop/temp%20folder/docs/cli.md)
- [docs/runtime.md](/c:/Users/matth/Desktop/temp%20folder/docs/runtime.md)
- [docs/tooling.md](/c:/Users/matth/Desktop/temp%20folder/docs/tooling.md)
- [docs/packages.md](/c:/Users/matth/Desktop/temp%20folder/docs/packages.md)
- [docs/platform-systems.md](/c:/Users/matth/Desktop/temp%20folder/docs/platform-systems.md)
- [docs/vscode-extension.md](/c:/Users/matth/Desktop/temp%20folder/docs/vscode-extension.md)
