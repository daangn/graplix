# Engine Resolve Type Hook

## Scope

- Package: `packages/engine`
- Revert `TypeResolver` from `toRef(...)` back to `id(...)`.
- Introduce central optional `__resolveType(...)` hook for object-to-type resolution.

## Requirements

1. `TypeResolver` exposes `id(entity)` and `load(id, context)`.
2. `GraplixOptions` supports optional `__resolveType(value, context)`.
3. `toEntityRef` resolves values in this order:
   - parse `"type:id"` string,
   - accept `{ type, id }`,
   - use `__resolveType` when present,
   - fallback to legacy resolver scan for backward compatibility.
4. Existing fixtures compile with `id(...)` and continue existing behavior.

## Implementation Plan

1. Add `ResolveType` type in `src/ResolveType.ts`.
2. Update `GraplixOptions` and `createEngine`/`InternalState` to carry `__resolveType`.
3. Rework `toEntityRef` to use `__resolveType` before legacy scan.
4. Revert fixture resolvers from `toRef` to `id`.
5. Validate via package test/build.

## Acceptance Criteria

- `@graplix/engine` tests pass.
- `@graplix/engine` build passes.
- Object-based resolver inference works through `__resolveType` when provided.
