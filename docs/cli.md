# COBOL-X CLI

## Commands

- `cobolx new my-project`
- `cobolx build`
- `cobolx run`
- `cobolx check`
- `cobolx test`
- `cobolx bench`
- `cobolx add dependency 1.0.0`
- `cobolx install`
- `cobolx update`
- `cobolx publish`
- `cobolx fmt`
- `cobolx lint`
- `cobolx debug`
- `cobolx profile`
- `cobolx dev`
- `cobolx doc`
- `cobolx repl`
- `cobolx visualize`
- `cobolx deploy`

## Project Layout

```text
my-project/
├── src/
│   └── main.cbx
├── cobolx.toml
└── README.md
```

## Config

`cobolx.toml` uses a package/dependency layout:

```toml
[package]
name = "my-project"
version = "0.1.0"
entry = "src/main.cbx"

[dependencies]
```

Build output is written to `dist/main.mjs`.

## Validation Flow

Typical release validation:

```powershell
npm run build
npm run test
npm run validate
```
