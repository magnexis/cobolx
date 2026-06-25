# Changelog

## 1.2.3 - 2026-06-13

### Fixed
- Fixed divide-by-zero producing `NaN` instead of a runtime error in DIVIDE and arithmetic operations
- Division operations now correctly validate the divisor before evaluation

## 1.0.0 - 2026-04-11

- Finalized the TypeScript COBOL-X workspace into a GitHub-ready release candidate
- Added CLI package-manager flows for `install` and `update`
- Improved test and benchmark execution to compile and run each `.cbx` file independently
- Added runnable example projects for API, distributed deployment, workflows, events, parallel processing, and debugging
- Hardened time-travel debugging with generated trace instrumentation and rewind playback
- Added release validation automation, root repository files, and a stronger `.gitignore`
