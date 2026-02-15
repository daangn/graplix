# @graplix/language

Langium-based parser and language services for Graplix.

## Installation

```bash
yarn add @graplix/language
```

## Quick Start

```ts
import { parse } from "@graplix/language";

const document = await parse(`
  type user

  type repository
    relations
      define owner: [user]
`);

if ((document.diagnostics?.length ?? 0) > 0) {
  console.error(document.diagnostics);
}
```

## Exports

- AST types from `src/__generated__/ast`
- `parse(text, options)` for in-memory parsing and validation
- `createGraplixServices(context)` for language server integration

## Development

From repository root:

```bash
yarn workspace @graplix/language langium:generate
yarn workspace @graplix/language test
yarn workspace @graplix/language build
```

When grammar changes, run `langium:generate` before build/test.
