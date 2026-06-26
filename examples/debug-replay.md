# Debug Replay

1. Run a project with `cobolx run`
2. COBOL-X writes `dist/debug-timeline.json`
3. Replay history with `cobolx debug --rewind`

This uses the runtime time-travel debugger and recorded state snapshots.
