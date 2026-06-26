# Parallel Processing

COBOL-X currently exposes explicit async spawn and iterator pipelines:

- `spawn(() => work())`
- `iter(values).map(...).filter(...).collect()`

Compiler-level auto-parallel analysis is staged on top of these runtime primitives.
