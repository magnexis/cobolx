# CargoX Packages

Implemented CargoX features in this repository:

- Manifest parsing from `cobolx.toml`
- Dependency graph resolution
- Lockfile writing to `CargoX.lock`
- Install materialization into `.cargox/packages/`
- Dependency update flow with manifest rewrite + lockfile refresh
- Local package publishing to `.cargox-registry/`

The current implementation is intentionally local-first and workspace-friendly.

Core commands:

- `cobolx add ledger 1.2.3`
- `cobolx install`
- `cobolx update`
- `cobolx publish`
