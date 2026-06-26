# Contributing

## Setup

```powershell
npm install
npm run build
npm run validate
```

## Standards

- Keep workspace packages building with `npm run build`
- Prefer small, testable compiler/runtime changes
- Add or update examples when changing user-facing behavior
- Document new CLI commands and manifest fields

## Pull Requests

1. Run `npm run build`
2. Run `npm run test`
3. Run `npm run validate`
4. Summarize behavioral changes and any known limitations
