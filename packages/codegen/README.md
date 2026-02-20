# @graplix/codegen

Generates TypeScript helpers from Graplix schema files.

## CLI

```bash
npx @graplix/codegen ./schema.graplix
```

With mapper overrides:

```bash
npx @graplix/codegen ./schema.graplix ./schema.generated.ts --mapper user=./models#User --mapper repository=./models#Repository
```

Config files are also supported (`cosmiconfig`):

- `graplix.codegen.json|yaml|yml|js|cjs|mjs|ts|cts|mts`
- `graplix-codegen.config.json|yaml|yml|js|cjs|mjs|ts|cts|mts`
- `package.json` with `"graplix-codegen"` key

JSON Schema for editor auto-complete/validation:

- `https://unpkg.com/@graplix/codegen@latest/schema.json`

Example (`graplix.codegen.json`):

```json
{
  "$schema": "https://unpkg.com/@graplix/codegen@latest/schema.json",
  "schema": "./schema.graplix",
  "output": "./schema.generated.ts",
  "mappers": {
    "user": "./models#User"
  }
}
```

CLI args override config values.

## Generated API

The generated file exports a `buildEngine` async factory function bound to
your schema:

```ts
import { buildEngine } from "./schema.generated";

const engine = await buildEngine({
  resolvers: { ... },  // typed per your schema + mappers
  resolveType: (value, context) => { ... },
});

const allowed = await engine.check({
  user: myUser,
  object: myRepo,
  relation: "owner",
  context: {},
});
```

## Programmatic API

```ts
import { generateTypeScript, generateTypeScriptFromFile } from "@graplix/codegen";
```
