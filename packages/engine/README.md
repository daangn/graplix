# @graplix/engine

Runtime relation evaluator for Graplix schemas.

## Installation

```bash
yarn add @graplix/engine @graplix/language
```

---

## Quick Start

```ts
import { buildEngine } from "@graplix/engine";

// --- 1. Define your entity types ---

type User = { id: string };
type Repository = { id: string; ownerIds: string[] };

// --- 2. Set up mock data (replace with your real data source) ---

const users = new Map<string, User>([
  ["user-1", { id: "user-1" }],
  ["user-2", { id: "user-2" }],
]);

const repos = new Map<string, Repository>([
  ["repo-1", { id: "repo-1", ownerIds: ["user-1"] }],
]);

// --- 3. Write your Graplix schema ---

const schema = `
  type user

  type repository
    relations
      define owner: [user]
`;

// --- 4. Build the engine (async — validates schema eagerly) ---

const engine = await buildEngine<object, User | Repository>({
  schema,

  // resolveType: maps any entity to its Graplix type name
  resolveType: (value) => {
    if (typeof value !== "object" || value === null) return "user";
    if ("ownerIds" in value) return "repository";
    return "user";
  },

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
        // Relation resolvers return domain entities directly
        owner(repo: Repository) {
          return repo.ownerIds
            .map((id) => users.get(id))
            .filter((u): u is User => u !== undefined);
        },
      },
    },
  },
});

// --- 5. Check permissions ---

const allowed = await engine.check({
  user: users.get("user-1")!,
  object: repos.get("repo-1")!,
  relation: "owner",
  context: {},
});
// → true

const denied = await engine.check({
  user: users.get("user-2")!,
  object: repos.get("repo-1")!,
  relation: "owner",
  context: {},
});
// → false
```

---

## Core Concepts

### `resolveType`

`resolveType` is the single mechanism the engine uses to determine an entity's
Graplix type. It is called for every entity value the engine encounters —
including values returned by relation resolvers.

```ts
resolveType: (value: unknown, context: TContext) => string
```

**It must return the correct type name for every entity.** Use structural
discrimination (checking unique fields) or `instanceof` checks:

```ts
// ✅ Structural discrimination — unique fields per type
resolveType: (value) => {
  if (typeof value !== "object" || value === null) return "user";
  if ("adminIds" in value) return "organization";
  if ("ownerIds" in value && "organizationId" in value) return "repository";
  if ("ownerIds" in value && "triagerIds" in value) return "team";
  return "user";
},

// ✅ instanceof checks (works well with class-based domain models)
resolveType: (value) => {
  if (value instanceof Organization) return "organization";
  if (value instanceof Repository) return "repository";
  if (value instanceof User) return "user";
  throw new Error(`Unknown entity type: ${value}`);
},
```

> **Tip:** Use codegen (`@graplix/codegen`) to generate a fully typed
> `resolveType` signature so TypeScript enforces exhaustiveness.

### `context`

`context` is passed to every `check()` and `explain()` call and forwarded to
all resolver functions. Use it for **request-scoped data** that resolvers need:
database connections, authentication info, tenant IDs, feature flags, etc.

```ts
type MyContext = {
  db: DatabaseConnection;
  currentUserId: string;
  locale: string;
};

const engine = await buildEngine<MyContext, User | Repository>({
  schema,
  resolveType: (value, context) => {
    // context is also available in resolveType if needed
    if (value instanceof Repository) return "repository";
    return "user";
  },
  resolvers: {
    repository: {
      id: (repo: Repository) => repo.id,
      async load(id, context) {
        // Use context.db for the actual query
        return context.db.findRepository(id);
      },
      relations: {
        async owner(repo, context) {
          // context is available here too
          return context.db.findUsers(repo.ownerIds);
        },
      },
    },
    // ...
  },
});

// context is required on every check/explain call
const allowed = await engine.check({
  user: currentUser,
  object: targetRepo,
  relation: "owner",
  context: { db, currentUserId: "user-1", locale: "ko" },
});
```

If your resolvers don't need any context, use `object` as `TContext` and pass
`{}`:

```ts
const engine = await buildEngine<object, User | Repository>({
  // ...
  resolveType: (value) => { /* ... */ },
  resolvers: { /* ... */ },
});

await engine.check({ user, object: repo, relation: "owner", context: {} });
```

### Relation Resolvers

Relation resolvers return **domain entities** (or arrays, or `null`). The
engine uses `resolveType` to determine their type:

```ts
relations: {
  // Return a single entity
  organization(repo: Repository, context: MyContext) {
    return context.db.findOrganization(repo.organizationId);
    // → Organization | null
  },

  // Return an array of entities
  members(org: Organization, context: MyContext) {
    return context.db.findUsers(org.memberIds);
    // → User[]
  },

  // Async is fine
  async owner(repo: Repository, context: MyContext) {
    return context.db.findUsers(repo.ownerIds);
    // → Promise<User[]>
  },
},
```

### `ResolverInfo`

Every `load` and relation resolver receives a `ResolverInfo` object as the
third argument. Use `info.signal` to cancel in-flight work when a timeout
fires:

```ts
async load(id, context, info) {
  return context.db.findUser(id, { signal: info.signal });
},
```

---

## API Reference

### `buildEngine(options)`

Async factory. Parses and validates the schema eagerly — **rejects immediately
on invalid schema**.

```ts
const engine = await buildEngine<TContext, TEntityInput>(options);
```

#### Options

| Option | Type | Required | Description |
|---|---|---|---|
| `schema` | `string` | ✅ | Raw Graplix schema text |
| `resolvers` | `Resolvers<TContext>` | ✅ | Data resolvers keyed by type name |
| `resolveType` | `ResolveType<TContext>` | ✅ | Maps any entity value to its type name |
| `resolverTimeoutMs` | `number` | — | Timeout (ms) for `load` and relation resolvers. Rejects with a timeout error on breach |
| `maxCacheSize` | `number` | — | Max entries per per-request LRU cache. Default: `500` |
| `onError` | `(error: unknown) => void` | — | Called when a relation value can't be resolved and is silently skipped. Throw to escalate the error |

#### Generics

```ts
buildEngine<TContext, TEntityInput>
```

- `TContext` — shape of the context object passed to every `check`/`explain` call.
- `TEntityInput` — union of entity types accepted by `check`/`explain`. With
  codegen this is the generated `GraplixEntityInput`. Without codegen, specify
  the union of all your entity types.

### `Resolver<TEntity, TContext>`

```ts
interface Resolver<TEntity, TContext> {
  // Returns the stable ID for a loaded entity
  id(entity: TEntity): string;

  // Loads an entity by ID. Return null if not found.
  load(
    id: string,
    context: TContext,
    info: ResolverInfo,
  ): Promise<TEntity | null>;

  // Optional relation resolvers keyed by relation name in the schema
  relations?: {
    [relation: string]: (
      entity: TEntity,
      context: TContext,
      info: ResolverInfo,
    ) => TEntity | TEntity[] | null | Promise<TEntity | TEntity[] | null>;
  };
}
```

### `engine.check(query)`

Returns `Promise<boolean>`.

```ts
await engine.check({
  user: userEntity,      // TEntityInput
  object: targetEntity,  // TEntityInput
  relation: "owner",
  context: myContext,    // TContext (required)
});
```

### `engine.explain(query)`

Returns `Promise<CheckExplainResult>` with full traversal details for
debugging.

```ts
const result = await engine.explain({
  user: userEntity,
  object: targetEntity,
  relation: "owner",
  context: myContext,
});

result.allowed        // boolean
result.matchedPath    // CheckEdge[] | null — edges of the first matching path
result.exploredEdges  // CheckEdge[] — all traversed edges

// CheckEdge shape:
// { from: EntityRef, relation: string, to: EntityRef }
// EntityRef: { type: string, id: string }
```

### `onError` — observing silent failures

When a relation resolver returns an entity that `resolveType` or a resolver
can't handle, the entity is silently skipped. Use `onError` to observe these
failures:

```ts
const engine = await buildEngine({
  // ...
  onError: (error) => {
    // Log, track metrics, or re-throw to turn it into a hard failure
    logger.warn("Entity resolution failed — check your resolveType:", error);
  },
});
```

---

## Development

From repository root:

```bash
yarn workspace @graplix/engine test
yarn workspace @graplix/engine build
```
