# COBOL-X Language Specification

## File Format

COBOL-X source files use the `.cbx` extension.

## Program Structure

Every file starts with a `PROGRAM` declaration followed by a `BEGIN`/`END` block.

```cbx
PROGRAM Sample

BEGIN
DISPLAY "Hello"
END
```

## Statements

- `SET name = expression`
- `DISPLAY expression`
- `INPUT name`
- `IF expression THEN ... ELSE ... END-IF`
- `FUNCTION name(param, other) BEGIN ... END-FUNCTION`
- `RETURN expression`

## Expressions

- Numbers: `42`, `3.14`
- Strings: `"hello"`
- Booleans: `TRUE`, `FALSE`
- Variables: `salary`
- Arithmetic: `+`, `-`, `*`, `/`
- Comparison: `=`, `!=`, `<`, `<=`, `>`, `>=`
- Calls: `compute_tax(salary)`

## Semantics

- Variables must be assigned before they are read.
- Functions must be declared before they are called.
- Duplicate function names are rejected.
- Function argument counts are checked.
- Arithmetic diagnostics are emitted when non-numeric values are used in numeric operators.
- Borrow-style alias diagnostics reject passing the same identifier repeatedly to mutating functions.

## Code Generation

The compiler lowers source through HIR and MIR, performs constant folding, and emits JavaScript through the custom backend.
