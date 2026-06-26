# COBOL-X Architecture

## Compiler

- `lexer`: tokenization and source ranges
- `parser`: AST construction
- `semantic`: name and control-flow oriented validation
- `type_system`: basic type inference for literals and arithmetic expressions
- `hir`: semantic lowering stage
- `borrow_checker`: mutating alias checks across calls
- `mir`: instruction-oriented lowering stage
- `optimizer`: constant folding
- `backend`: custom JavaScript backend

## Toolchain

- `cargox`: manifest parsing, lockfile generation, dependency graph resolution, local registry publishing
- `cli/cobolx-cli`: user-facing command surface
- `formatter`, `linter`, `debugger`, `profiler`: standalone toolchain packages integrated into the CLI

## Runtime and Stdlib

- `runtime`: ARC-style references, futures, scheduling, and audit hooks
- `stdlib`: IO, filesystem, network, HTTP, JSON, crypto, datetime, and business modules

## Editor Support

- `lsp/server`: diagnostics, hover, and completion
- `vscode-extension`: syntax grammar, snippets, and LSP client wiring
