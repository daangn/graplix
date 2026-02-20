# @graplix/engine

Runtime relation evaluator for Graplix schemas.

## Installation

```bash
yarn add @graplix/engine @graplix/language
```

## Quick Start

```ts
import { buildEngine } from "@graplix/engine";

type User = { id: string };
type Repository = { id: string; ownerIds: string[] };

const users = new Map([["user-1", { id: "user-1" }]]);
const repos = new Map([
  ["repo-1", { id: "repo-1", ownerIds: ["user-1"] }],
]);

const schema = `
  type user

  type repository
    relations
      define owner: [user]
`;

const engine = await buildEngine<object, User | Repository>({
  schema,
  resolveType: () => null,
  resolvers: {
    user: {
      id: (user: User) => user.id,
      async load(id) {
        return users.get(id) ?? null;
      },
    },
    repository: {
      id: (repo: Repository) => repo.id,
      async load(id) {
        return repos.get(id) ?? null;
      },
      relations: {
        owner(repo: Repository) {
          return repo.ownerIds
            .map((id) => users.get(id))
            .filter((u): u is User => u !== undefined);
        },
      },
    },
  },
});

const allowed = await engine.check({
  user: { id: "user-1" },
  object: { id: "repo-1" },
  relation: "owner",
  context: {},
});

const explained = await engine.explain({
  user: { id: "user-1" },
  object: { id: "repo-1" },
  relation: "owner",
  context: {},
});
```

## API

### `buildEngine(options)`

Async factory function. Parses and validates the schema eagerly — rejects on
invalid schema.

```ts
const engine = await buildEngine<TContext, TEntityInput>(options);
```

**Options (`BuildEngineOptions<TContext>`):**

| Option | Type | Description |
|---|---|---|
| `schema` | `string` | Raw Graplix schema text |
| `resolvers` | `Resolvers<TContext>` | Data resolvers keyed by type name |
| `resolveType` | `ResolveType<TContext>` | Maps a runtime value to its Graplix type name. Return `null` to fall back to resolver scanning |
| `resolverTimeoutMs?` | `number` | Per-call timeout for `load` and relation resolvers. Omit to disable |
| `maxCacheSize?` | `number` | Max entries per per-request LRU cache. Default: `500` |

### `Resolver<TEntity, TContext>`

```ts
interface Resolver<TEntity, TContext> {
  id(entity: TEntity): string;
  load(id: string, context: TContext, info: ResolverInfo): Promise<TEntity | null>;
  relations?: {
    [relation: string]: (
      entity: TEntity,
      context: TContext,
      info: ResolverInfo,
    ) => TEntity | TEntity[] | null | Promise<...>;
  };
}
```

Relation resolvers return domain entity objects (or arrays/null). The engine
resolves their types and IDs automatically via `resolveType` or resolver
scanning.

### `ResolverInfo`

Passed as the third argument to every `load` and relation resolver call.

```ts
interface ResolverInfo {
  signal: AbortSignal; // aborted when resolverTimeoutMs fires
}
```

### `engine.check(query)`

Returns `Promise<boolean>`.

```ts
await engine.check({
  user: myUser,       // TEntityInput
  object: myRepo,     // TEntityInput
  relation: "owner",
  context: myContext, // TContext
});
```

### `engine.explain(query)`

Returns `Promise<CheckExplainResult>` with full traversal details.

```ts
interface CheckExplainResult {
  allowed: boolean;
  matchedPath: CheckEdge[] | null; // first path that satisfied the query
  exploredEdges: CheckEdge[];      // all traversed edges
}

interface CheckEdge {
  from: EntityRef;   // { type: string; id: string }
  relation: string;
  to: EntityRef;
}
```

## Development

From repository root:

```bash
yarn workspace @graplix/engine test
yarn workspace @graplix/engine build
```
