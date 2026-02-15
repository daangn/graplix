# @graplix/engine

Runtime relation evaluator for Graplix schemas.

## Installation

```bash
yarn add @graplix/engine @graplix/language
```

## Quick Start

```ts
import { createEngine } from "@graplix/engine";

const schema = `
type user

type repository
  relation owner: user
`;

const engine = createEngine({
  schema,
  resolveType: () => null,
  resolvers: {
    user: {
      id(user: { id: string }) {
        return user.id;
      },
      async load(id: string) {
        return { id };
      },
    },
    repository: {
      id(repository: { id: string }) {
        return repository.id;
      },
      async load(id: string) {
        return { id };
      },
      relations: {
        owner() {
          return { type: "user", id: "user-1" };
        },
      },
    },
  },
});

const allowed = await engine.check({
  user: "user:user-1",
  object: "repository:repo-1",
  relation: "owner",
});

const explained = await engine.explain({
  user: "user:user-1",
  object: "repository:repo-1",
  relation: "owner",
});
```

## API

- `createEngine(options)`
  - `schema`: Graplix schema text
  - `resolvers`: runtime data resolvers keyed by type name
  - `resolveType`: resolves runtime object to a Graplix type name
- `engine.check(query)` returns `Promise<boolean>`
- `engine.explain(query)` returns `Promise<CheckExplainResult>` with trace edges

## Development

From repository root:

```bash
yarn workspace @graplix/engine test
yarn workspace @graplix/engine build
```
