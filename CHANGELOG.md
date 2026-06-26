# Changelog

## 1.3.0 - 2026-06-14

### Added
- FOR loop construct: `FOR var FROM start TO end [STEP step] ... END-FOR` compiles to JavaScript `for` loop
- String interpolation: strings containing `{expr}` now compile to JavaScript template literals
- `math.modulo(a, b)` — proper integer modulo via `Math.floor(a % b)`
- `math.randomInt(min, max)` — random integer in range `[min, max]`
- `math.truncate(n)` — `Math.trunc(n)`
- `strings.capitalize(s)` — capitalize first character
- `strings.repeat(s, n)` — repeat string n times
- `strings.trim(s)` — trim whitespace
- `strings.split(s, sep)` — split string by separator
- `strings.join(arr, sep)` — join array with separator
- `strings.indexOf(s, sub)` — find substring index
- `strings.padLeft(s, len, ch)` — left-pad string
- `strings.padRight(s, len, ch)` — right-pad string

### Changed
- Replaced all PowerShell-only build/clean scripts with cross-platform `node -e` equivalents

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
