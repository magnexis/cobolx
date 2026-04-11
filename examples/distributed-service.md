# Distributed Service

Use the runtime distributed registry:

```ts
import { registerService, discoverService } from "@cobolx/runtime";

registerService("payments", "node://payments");
console.log(discoverService("payments"));
```

The CLI `cobolx deploy` writes deployment metadata and service discovery output.
