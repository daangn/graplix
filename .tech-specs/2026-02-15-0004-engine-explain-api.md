# Engine Explain API

## Scope

- Package: `packages/engine`
- Add an explain capability that returns traversal/connection data for a check query.
- Keep `check()` behavior unchanged (`Promise<boolean>`).

## Requirements

1. `GraplixEngine` must expose `explain(query)` in addition to `check(query)`.
2. `check(query)` still returns only `boolean` and remains backward compatible.
3. `explain(query)` returns:
   - `allowed`: boolean result equivalent to `check(query)`
   - `matchedPath`: edges that satisfy the relation when allowed, else `null`
   - `exploredEdges`: all explored relation edges during traversal
4. Trace collection must not alter existing recursion guards (`visited`) or caches.

## Implementation Plan

1. Add public types for explain output (`CheckEdge`, `CheckExplainResult`).
2. Extend `GraplixEngine` and root exports for explain API.
3. Add optional internal trace state and wire it through relation evaluation.
4. Implement `createEngine.explain` by reusing existing evaluation flow with trace enabled.
5. Add tests for allowed and denied explain cases.

## Acceptance Criteria

- Existing `check()` tests keep passing.
- New explain tests pass and demonstrate trace output.
- `yarn workspace @graplix/engine build` succeeds.
