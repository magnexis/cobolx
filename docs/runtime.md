# COBOL-X Runtime

The runtime package provides:

- `ArcBox<T>` for deterministic shared ownership semantics
- `TaskScheduler` for cooperative async execution
- `futureOf()` for future-style wrappers
- `audit()` and `getAuditTrail()` for enterprise audit hooks

These modules are intentionally small and composable so services can build deterministic infrastructure behavior on top of them.
