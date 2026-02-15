# Engine TypeResolver toRef Refactor

## Scope

- Package: `packages/engine`
- Refactor resolver interface to replace `id(...)` inference with `toRef(...)`.
- Keep runtime behavior stable for relation evaluation while making type discrimination explicit.

## Requirements

1. `TypeResolver` must expose `toRef(value, context)` that returns `EntityRef | null` (sync or async).
2. Existing `id(...)` API must be removed from engine internals and fixtures.
3. `toEntityRef` must use:
   - direct parse for `"type:id"` strings,
   - direct pass-through for `{ type, id }`,
   - resolver `toRef(...)` fallback for other object values.
4. The resolver fallback must validate `toRef` output shape and non-empty `type/id` strings.
5. Tests and fixtures must be updated to compile and preserve current check semantics.

## Implementation Plan

1. Update `TypeResolver` interface to use `toRef(...)` and import `EntityRef` type.
2. Rewrite `private/toEntityRef.ts` to call `resolver.toRef(value, state.context)` instead of `resolver.id(...)`.
3. Add a private helper in `toEntityRef.ts` to validate resolver-returned refs.
4. Migrate resolver fixtures (`github.ts`, `circular.ts`) from `id(...)` to `toRef(...)`.
5. Run engine tests/build and address any type/runtime regressions.

## Acceptance Criteria

- `packages/engine` compiles without `id(...)` in resolver API.
- `yarn workspace @graplix/engine test` passes.
- `yarn workspace @graplix/engine build` passes.
- Existing relation checks continue to return expected results.
