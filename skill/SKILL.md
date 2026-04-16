---
name: graplix
description: >
  Relation-Based Access Control (ReBAC) with the Graplix TypeScript toolkit.
  Use when defining .graplix schemas, building engines, writing resolvers,
  checking permissions, or explaining traversals with buildEngine, check,
  explain, resolveType, and the Resolver interface.
license: MIT
metadata:
  author: daangn
  version: "1.0"
  repository: https://github.com/daangn/graplix
---

# Graplix ReBAC Guide

Build relation-based access control with Graplix. This skill teaches you how to find current documentation and write correct Graplix code.

## Critical: Do not trust internal knowledge

Everything you know about Graplix is likely outdated or wrong. Never rely on memory. Your training data may contain obsolete APIs. Always verify against the documentation referenced in this skill.

## Prerequisites

Before writing code, verify package installation:

```bash
ls node_modules/@graplix/engine/
```

- **Package exists:** Use embedded docs (most reliable, matches exact installed version)
- **No package:** Install first using `references/quick-start.md`

## Available Files Reference

| Question | Resource | Purpose |
|----------|----------|---------|
| Project setup / installation | `references/quick-start.md` | Installation and first permission check guide |
| Schema syntax / keywords | `references/schema-syntax.md` | `.graplix` file syntax and relation expressions |
| API usage / type signatures | `references/embedded-docs.md` | Look up via installed package docs and type declarations |
| Error resolution | `references/common-errors.md` | Troubleshooting solutions |

## Priority: Documentation Lookup Order

1. **Embedded docs** (if `@graplix/engine` is installed)
   - Most reliable, matches exact installed version
   - Read Markdown docs: `node_modules/@graplix/engine/dist/docs/*.md`
   - Read type declarations: `node_modules/@graplix/engine/dist/index.d.mts`

2. **Source code** (if packages installed)
   - Ultimate truth source when docs are unclear
   - Read: `node_modules/@graplix/engine/dist/index.mjs`

## Core Architecture

Graplix has two runtime components:

```
.graplix schema  →  buildEngine()  →  engine.check() / engine.explain()
(relation model)    (async factory)    (permission evaluation)
```

**Data flow for a permission check:**

```
engine.check({ user, object, relation, context })
  → resolveType(user)  → EntityRef
  → resolveType(object) → EntityRef
  → evaluate relation graph (resolver.relations callbacks)
  → resolver.load() for any entity IDs encountered
  → true | false
```

## Schema Syntax

Graplix schemas are `.graplix` text files. See `references/schema-syntax.md` for the full reference.

```graplix
type user

type repository
  relations
    define owner: [user]
    define member: [user]
    define admin: owner or member
    define can_delete: owner from organization
```

**Key rules:**
- Types use `snake_case`
- `[TypeA, TypeB]` — direct relation (user must be one of these types)
- `relation from source` — transitive via another relation on `source`
- `term or term` — union of multiple terms
- No `define` = type with no relations (still valid)

## Complete Example

```typescript
import { buildEngine } from "@graplix/engine";

// 1. Define your entity types
type User = { id: string };
type Repository = { id: string; ownerIds: string[] };

// 2. Set up data (replace with your real data source)
const users = new Map<string, User>([
  ["user-1", { id: "user-1" }],
  ["user-2", { id: "user-2" }],
]);
const repos = new Map<string, Repository>([
  ["repo-1", { id: "repo-1", ownerIds: ["user-1"] }],
]);

// 3. Write your schema
const schema = `
  type user

  type repository
    relations
      define owner: [user]
      define can_delete: owner
`;

// 4. Build the engine (async — validates schema eagerly)
const engine = await buildEngine<object, User | Repository>({
  schema,

  resolveType: (value) => {
    if (typeof value !== "object" || value === null) return null;
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
        // Return domain entities directly — NOT IDs or EntityRefs
        owner(repo: Repository) {
          return repo.ownerIds
            .map((id) => users.get(id))
            .filter((u): u is User => u !== undefined);
        },
      },
    },
  },
});

// 5. Check permissions
await engine.check({
  user: users.get("user-1")!,
  object: repos.get("repo-1")!,
  relation: "owner",
  context: {},
}); // → true

// 6. Explain traversal (for debugging)
const result = await engine.explain({
  user: users.get("user-2")!,
  object: repos.get("repo-1")!,
  relation: "can_delete",
  context: {},
});
result.allowed;       // false
result.exploredEdges; // CheckEdge[] — all traversed edges
result.matchedPath;   // CheckEdge[] | null — first matching path
```

## `buildEngine` Options

```typescript
const engine = await buildEngine<TContext, TEntityInput>({
  schema,          // string — raw .graplix schema text (required)
  resolvers,       // Resolvers<TContext> — keyed by type name (required)
  resolveType,     // ResolveType<TContext> — entity type discriminator (required)

  resolverTimeoutMs: 3000,   // timeout (ms) for load and relation resolvers
  maxCacheSize: 1000,        // per-request LRU cache size (default: 500)
  onError: (err) => {        // called when entity resolution silently fails
    console.error(err);      // throw here to escalate to a hard failure
  },
});
```

`buildEngine` is **async**. Schema validation happens at construction time — an invalid schema rejects immediately.

## `resolveType`

```typescript
type ResolveType<TContext> = (value: unknown, context: TContext) => string | null;
```

- **Synchronous** and **required**
- Returns the Graplix type name for any entity value, or `null` if unknown
- Called for `query.user` and `query.object` — **must return the correct type**
- For relation resolver outputs, `null` is acceptable (engine uses schema hints)

```typescript
// ✅ Structural field discrimination
const resolveType: ResolveType<MyContext> = (value) => {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  if ("adminIds" in v) return "organization";
  if ("ownerIds" in v && "organizationId" in v) return "repository";
  if ("ownerIds" in v) return "team";
  return "user";
};

// ✅ instanceof checks (class-based models)
const resolveType: ResolveType<MyContext> = (value) => {
  if (value instanceof Organization) return "organization";
  if (value instanceof Repository) return "repository";
  if (value instanceof User) return "user";
  return null;
};
```

## `Resolver` Interface

```typescript
interface Resolver<TEntity, TContext> {
  id(entity: TEntity): string;

  load(
    id: string,
    context: TContext,
    info: ResolverInfo,  // info.signal for timeout cancellation
  ): Promise<TEntity | null>;

  relations?: {
    [relation: string]: (
      entity: TEntity,
      context: TContext,
      info: ResolverInfo,
    ) => TEntity | TEntity[] | null | Promise<TEntity | TEntity[] | null>;
  };
}
```

## `context`

Passed to every `check`/`explain` call and forwarded to all resolver functions. Use for request-scoped data: database connections, auth info, tenant IDs, etc.

```typescript
type MyContext = { db: DB; userId: string };

const engine = await buildEngine<MyContext, User | Repo>({ ... });

await engine.check({
  user: currentUser,
  object: targetRepo,
  relation: "owner",
  context: { db, userId: "user-1" },  // required on every call
});
```

If resolvers need no context, use `object` and pass `{}`.

## Using Codegen (Optional)

`@graplix/codegen` generates a fully-typed `buildEngine` wrapper from your schema:

```bash
npx @graplix/codegen ./schema.graplix
```

The generated file provides typed `GraplixResolvers<TContext>` and `GraplixEntityInput` so TypeScript enforces exhaustiveness:

```typescript
import { buildEngine } from "./schema.generated";

const engine = await buildEngine({
  resolvers: { ... },  // typed per schema + mappers
  resolveType: (value) => { ... },
});
```

## Critical Rules

### EntityRef
- **Never pass `EntityRef` directly to `check`/`explain`**. `query.user` and `query.object` accept `TEntityInput` (your domain types) only.
- Import `EntityRef` as a type only when working with `CheckEdge.from`/`to` in explain results.

### Relation Resolvers
- Return **domain entities** (or arrays, or `null`) — not IDs, not `EntityRef` instances.
- The engine calls `resolveType` (or uses schema hints) to determine the returned entity's type.
- `resolver.load()` is **never called inside `toEntityRef`** — it is only called when an entity needs to be loaded by ID.

### `resolveType` Precedence
1. `resolveType(value)` is always tried first.
2. If it returns `null`, schema type hints (from relation definitions) are used as fallback.
3. For `query.user` and `query.object`, `resolveType` **must** return the correct type — no fallback.

### Caching
- Both entity cache and relation values cache are **per-request** (not shared across calls).
- Cache size is controlled by `maxCacheSize` (default: 500).

## Import Reference

```typescript
// Runtime engine
import { buildEngine } from "@graplix/engine";
import type {
  BuildEngineOptions,
  GraplixEngine,
  Query,
  Resolver,
  Resolvers,
  ResolverInfo,
  ResolveType,
  CheckEdge,
  CheckExplainResult,
  EntityRef,  // for CheckEdge.from/to type annotations
} from "@graplix/engine";

// Schema parsing (lower-level)
import { parse } from "@graplix/language";

// Codegen (CLI or programmatic)
import { generateTypeScript } from "@graplix/codegen";
```

## Error Handling

Type errors often signal outdated knowledge. Common indicators: "Property X does not exist," module not found, incorrect generic parameters.

**Response approach:**
1. Check `references/common-errors.md`
2. Verify current API in embedded docs (`node_modules/@graplix/engine/dist/docs/`)
3. Recognize errors may reflect knowledge gaps, not user mistakes
