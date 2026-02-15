# Codegen Package and Mappers

## Scope

- Add a new workspace package: `packages/codegen` (`@graplix/codegen`).
- Accept Graplix schema input and generate TypeScript source.
- Support mapper configuration similar to GraphQL Codegen mappers.

## Requirements

1. Package build uses `tsdown` with ESM/CJS+dts outputs.
2. Package tests use `vitest`.
3. Provide API to generate TS from schema text.
4. Provide API to generate TS from `.graplix` file path.
5. Mappers option supports external type mapping per Graplix type.

## Implementation Plan

1. Scaffold package files (`package.json`, `tsconfig.json`, `tsdown.config.ts`, `src/index.ts`).
2. Implement parser-backed schema model extraction with `@graplix/language`.
3. Implement TypeScript code emitter with mapper-aware type aliases/imports.
4. Add tests for default generation, mapper imports, and file-based generation.

## Acceptance Criteria

- `yarn workspace @graplix/codegen test` passes.
- `yarn workspace @graplix/codegen build` passes.
- Generated output includes schema literal, type names, mapped entity types, and resolver helper types.
