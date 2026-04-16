# Quick Start

Set up Graplix and run your first permission check.

## Installation

### 1. Install packages

```bash
npm install @graplix/engine @graplix/language
```

`@graplix/language` is a peer dependency of `@graplix/engine` — install both.

### 2. TypeScript configuration

Graplix requires TypeScript 5.0+ with `strict: true`:

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

## Write Your First Permission Check

### Step 1: Write a Schema

Create `schema.graplix`:

```graplix
type user

type document
  relations
    define owner: [user]
    define editor: [user]
    define viewer: [user]
    define can_edit: owner or editor
    define can_view: can_edit or viewer
```

### Step 2: Define Entity Types

```typescript
// types.ts
export type User = { id: string };
export type Document = {
  id: string;
  ownerIds: string[];
  editorIds: string[];
  viewerIds: string[];
};
```

### Step 3: Set Up Resolvers

```typescript
// resolvers.ts
import type { Resolvers } from "@graplix/engine";
import type { User, Document } from "./types";

const users = new Map<string, User>([
  ["user-alice", { id: "user-alice" }],
  ["user-bob", { id: "user-bob" }],
  ["user-charlie", { id: "user-charlie" }],
]);

const documents = new Map<string, Document>([
  [
    "doc-1",
    {
      id: "doc-1",
      ownerIds: ["user-alice"],
      editorIds: ["user-bob"],
      viewerIds: [],
    },
  ],
]);

export const resolvers: Resolvers<object> = {
  user: {
    id: (user: User) => user.id,
    async load(id) {
      return users.get(id) ?? null;
    },
  },
  document: {
    id: (doc: Document) => doc.id,
    async load(id) {
      return documents.get(id) ?? null;
    },
    relations: {
      // Return domain entities directly — NOT IDs
      owner(doc: Document) {
        return doc.ownerIds
          .map((id) => users.get(id))
          .filter((u): u is User => u !== undefined);
      },
      editor(doc: Document) {
        return doc.editorIds
          .map((id) => users.get(id))
          .filter((u): u is User => u !== undefined);
      },
      viewer(doc: Document) {
        return doc.viewerIds
          .map((id) => users.get(id))
          .filter((u): u is User => u !== undefined);
      },
    },
  },
};

export { users, documents };
```

### Step 4: Build the Engine

```typescript
// engine.ts
import { readFile } from "node:fs/promises";
import { buildEngine } from "@graplix/engine";
import type { ResolveType } from "@graplix/engine";
import type { User, Document } from "./types";
import { resolvers } from "./resolvers";

const schema = await readFile("schema.graplix", "utf8");

// resolveType maps any value to its Graplix type name
const resolveType: ResolveType<object> = (value) => {
  if (typeof value !== "object" || value === null) return null;
  if ("ownerIds" in value) return "document";
  return "user";
};

export const engine = await buildEngine<object, User | Document>({
  schema,
  resolvers,
  resolveType,
});
```

### Step 5: Check Permissions

```typescript
// main.ts
import { engine } from "./engine";
import { users, documents } from "./resolvers";

const alice = users.get("user-alice")!;
const bob = users.get("user-bob")!;
const charlie = users.get("user-charlie")!;
const doc = documents.get("doc-1")!;

// Alice is owner → can_edit = true
console.log(await engine.check({ user: alice, object: doc, relation: "can_edit", context: {} }));
// → true

// Bob is editor → can_edit = true
console.log(await engine.check({ user: bob, object: doc, relation: "can_edit", context: {} }));
// → true

// Charlie has no relation → can_view = false
console.log(await engine.check({ user: charlie, object: doc, relation: "can_view", context: {} }));
// → false
```

## Using Codegen (Optional but Recommended)

`@graplix/codegen` generates a typed `buildEngine` wrapper so TypeScript enforces all resolver types and relation names:

```bash
npx @graplix/codegen ./schema.graplix --output ./schema.generated.ts
```

With mapper config (`graplix.codegen.json`):

```json
{
  "$schema": "https://unpkg.com/@graplix/codegen@latest/schema.json",
  "schema": "./schema.graplix",
  "output": "./schema.generated.ts",
  "mappers": {
    "user": "./types#User",
    "document": "./types#Document"
  }
}
```

Then use the generated file:

```typescript
import { buildEngine } from "./schema.generated";

const engine = await buildEngine({
  resolvers: { ... },  // fully typed, TypeScript enforces all relations
  resolveType: (value) => { ... },
});
```

## What Happens Under the Hood

1. `buildEngine()` parses and validates the schema eagerly — bad schemas fail at construction time
2. `engine.check()` converts `user` and `object` to internal `EntityRef` via `resolveType`
3. The engine traverses the relation graph, calling `resolver.relations.*` to fetch related entities
4. When an entity ID is needed, `resolver.load()` is called (results are cached per request)
5. Returns `true` if a path from `user` to `object` via `relation` exists, `false` otherwise

## Next Steps

- **Schema syntax:** See `references/schema-syntax.md` for the full `.graplix` language reference
- **Embedded docs:** See `references/embedded-docs.md` for how to read installed package docs
- **Troubleshooting:** See `references/common-errors.md` for common errors and fixes
