# @graplix/codegen

Generates TypeScript helpers from Graplix schema files.

## CLI

```bash
yarn workspace @graplix/codegen build
yarn workspace @graplix/codegen codegen ./schema.graplix
```

With mapper overrides:

```bash
yarn workspace @graplix/codegen codegen ./schema.graplix ./schema.generated.ts --mapper user=./models#User --mapper repository=./models#Repository
```

Config files are also supported (`cosmiconfig`):

- `graplix.codegen.json|yaml|yml|js|cjs|mjs|ts|cts|mts`
- `graplix-codegen.config.json|yaml|yml|js|cjs|mjs|ts|cts|mts`
- `package.json` with `"graplix-codegen"` key

Example (`graplix.codegen.json`):

```json
{
  "schema": "./schema.graplix",
  "output": "./schema.generated.ts",
  "mappers": {
    "user": "./models#User"
  }
}
```

CLI args override config values.

Typed config helper:

```ts
import { defineConfig } from "@graplix/codegen";

export default defineConfig({
  schema: "./schema.graplix",
  output: "./schema.generated.ts",
  mappers: {
    user: "./models#User",
  },
});
```

## Programmatic API

```ts
import { generateTypeScript, generateTypeScriptFromFile } from "@graplix/codegen";
```
