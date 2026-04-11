# Release Validation

The repository includes a scripted validation pass in [tests/validate-release.mjs](/c:/Users/matth/Desktop/temp%20folder/tests/validate-release.mjs:1).

It verifies:

- workspace build
- compiler-backed tests
- benchmark execution
- project scaffolding
- package add/install/update
- docs generation
- migrations
- visualization
- deploy metadata
- debug trace rewind

Run it with:

```powershell
npm run validate
```
