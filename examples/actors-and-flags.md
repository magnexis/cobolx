# Actors And Flags

This example is represented at the platform/runtime layer:

- Use `createActor("payments", handler)` from `@cobolx/runtime`
- Use `setFeatureFlag("new_checkout", true)` and `featureEnabled("new_checkout")`
- Use `log()`, `incrementMetric()`, and `trace()` for observability
- Use `registerService()` and `discoverService()` for distributed service lookup
