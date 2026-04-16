# Common Errors and Solutions

## TypeScript Configuration

### Error: Type inference not working / implicit `any` errors

**Symptom:** Types are `any`, no autocomplete, type errors throughout.

**Cause:** TypeScript `strict` mode is not enabled.

**Solution:**
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

Graplix requires TypeScript 5.0+ with `strict: true`.

---

## Schema Errors

### Error: Schema validation fails at `buildEngine()`

**Symptom:** `buildEngine()` rejects with a diagnostic message like `"Unknown type reference: 'nonexistent'"`.

**Cause:** A type referenced in a relation (e.g., `define owner: [nonexistent]`) is not declared in the schema.

**Solution:** Ensure every type used in a `[...]` direct relation is declared as a `type` in the schema.

```graplix
// Wrong — "nonexistent" is not declared
type document
  relations
    define owner: [nonexistent]

// Correct
type user

type document
  relations
    define owner: [user]
```

---

### Error: Schema syntax error / unexpected token

**Symptom:** `buildEngine()` rejects with a parse error mentioning an unexpected token or character.

**Cause:** Malformed `.graplix` syntax.

**Solution:** Validate with `@graplix/language`:

```typescript
import { parse } from "@graplix/language";

const doc = await parse(schemaText);
if ((doc.diagnostics?.length ?? 0) > 0) {
  console.error(doc.diagnostics);
}
```

Common mistakes:
- Missing `relations` keyword before `define`
- Using `:=` instead of `:` in `define`
- Unclosed `[` in direct types

---

## `resolveType` Errors

### Error: `check()` always returns `false` despite correct data

**Symptom:** Permission checks return `false` even when the user clearly has the relation.

**Cause:** `resolveType` returns `null` or the wrong type name for `query.user` or `query.object`.

**Solution:** `resolveType` **must** return the correct type name for the entities passed as `query.user` and `query.object`. `null` is not acceptable for these — unlike relation resolver outputs, there is no schema hint fallback.

```typescript
// Wrong — returns null for users
const resolveType = (value: unknown) => {
  if ("ownerIds" in (value as any)) return "repository";
  return null; // ← null for user causes check() to fail
};

// Correct
const resolveType = (value: unknown) => {
  if (typeof value !== "object" || value === null) return "user";
  if ("ownerIds" in value) return "repository";
  return "user";
};
```

---

### Error: "Entity resolution failed" or unexpected `onError` calls

**Symptom:** `onError` callback fires, or entities are silently skipped.

**Cause:** A relation resolver returns a value that `resolveType` cannot identify and that doesn't match any schema type hint.

**Solution:**
1. Ensure `resolveType` handles all possible return values of every relation resolver.
2. Or ensure the returned entity type matches the schema's allowed target types for that relation.

---

## Resolver Errors

### Error: Relation resolver returning IDs instead of entities

**Symptom:** `check()` always returns `false` for relations that should match.

**Cause:** Relation resolver returns string IDs (e.g., `["user-1", "user-2"]`) instead of loaded entity objects.

**Solution:** Relation resolvers must return **domain entities**, not ID strings. The engine does not call `resolver.load()` on resolver outputs — it uses `resolveType` to type them directly.

```typescript
// Wrong — returns IDs
relations: {
  owner(repo) {
    return repo.ownerIds; // ← string[], not User[]
  },
},

// Correct — returns entities
relations: {
  owner(repo, ctx) {
    return ctx.db.findUsers(repo.ownerIds); // ← User[]
  },
},
```

---

### Error: `resolver.load()` never called / entities not found

**Symptom:** `check()` returns `false` and you expect `load()` to be called.

**Cause:** `load()` is only called when the engine needs to load an entity by its ID (e.g., during a `from` traversal). If your relation resolver already returns the full entity objects, `load()` is not needed for that path.

**Solution:** This is expected behavior. Implement `load()` anyway — it's required by the `Resolver` interface and is called for `from` traversals.

---

### Error: Missing relation resolver causes silent `false`

**Symptom:** `check()` returns `false` for a relation even though the resolver is defined.

**Cause:** The relation name in `resolvers.relations` doesn't match the name in the schema.

**Solution:** Relation keys in `resolver.relations` must exactly match the `define` names in the `.graplix` schema:

```graplix
// Schema
type repository
  relations
    define owner: [user]
```

```typescript
// Wrong — "owners" doesn't match "owner"
relations: {
  owners(repo) { return ...; },
}

// Correct
relations: {
  owner(repo) { return ...; },
}
```

---

## `buildEngine` / Async Errors

### Error: Using `buildEngine` synchronously

**Symptom:** TypeScript error: `Property 'check' does not exist on type 'Promise<GraplixEngine<...>>'`.

**Cause:** `buildEngine` returns a `Promise` — it must be awaited.

**Solution:**

```typescript
// Wrong
const engine = buildEngine({ schema, resolvers, resolveType });
engine.check(...); // TypeError

// Correct
const engine = await buildEngine({ schema, resolvers, resolveType });
await engine.check(...);
```

---

## `explain()` Errors

### Error: `matchedPath` is `null` but `allowed` is `true`

This is not an error — it indicates a bug in the explain implementation. Please open an issue at https://github.com/daangn/graplix/issues.

### Using `EntityRef` from explain results

`CheckEdge.from` and `CheckEdge.to` are `EntityRef` instances (`{ type: string, id: string }`). You can import the type:

```typescript
import type { EntityRef, CheckEdge } from "@graplix/engine";

const result = await engine.explain({ user, object, relation, context });
result.exploredEdges.forEach((edge: CheckEdge) => {
  console.log(`${edge.from.type}:${edge.from.id} --[${edge.relation}]--> ${edge.to.type}:${edge.to.id}`);
});
```

Do **not** pass `EntityRef` instances as `query.user` or `query.object` — those fields accept `TEntityInput` only.

---

## Timeout Errors

### Error: `resolver timed out` / `AbortError`

**Symptom:** `check()` rejects with a timeout error after `resolverTimeoutMs` milliseconds.

**Cause:** A `load()` or relation resolver call exceeded the configured timeout.

**Solution:**
1. Increase `resolverTimeoutMs` if the operation is genuinely slow.
2. Use `info.signal` in resolvers to cancel in-flight work:

```typescript
async load(id, context, info) {
  return context.db.findUser(id, { signal: info.signal });
},
```
