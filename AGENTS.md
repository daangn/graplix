# Graplix Repository Agent Instructions

## Scope

- Applies to `/Users/tony/workspaces/daangn/graplix`.
- Workspaces:
  - `packages/language`
  - `packages/graplix-vscode-extension`
- Tech stack: TypeScript, Langium, VS Code extension APIs, Yarn workspaces.

## Existing Repo Instructions

- `AGENTS.md`: this file is the repo source-of-truth.
- `.cursor/rules/` not found.
- `.cursorrules` not found.
- `.github/copilot-instructions.md` not found.

## Environment / Compiler

- Yarn 4 workspace (`yarn@4.12.0`).
- Root package is private workspace with `ultra` runner (`yarn build`).
- TypeScript is strict (`strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `erasableSyntaxOnly`).
- Repo uses ESM packages by default and UTF-8 text.

## Primary Commands

### Root

- `yarn build`
  - Runs workspace build pipeline (`ultra -r build`).
- `yarn format`
  - Runs `biome check --fix --unsafe`.
- No root `lint` script is currently defined.
- `yarn changeset:publish`, `yarn changeset:version`
  - Release workflow only.

### `packages/language`

- `yarn workspace @graplix/language langium:generate`
  - Regenerates parser artifacts and TextMate grammar.
- `yarn workspace @graplix/language build`
  - Runs `langium:generate` then `tsdown`.
- `yarn workspace @graplix/language test`
  - Runs `vitest --run --passWithNoTests`.
  - No package-level `lint` script is defined.

Single-test options:

- From repository root:
  - `yarn workspace @graplix/language vitest run src/validator.spec.ts`
  - `yarn workspace @graplix/language vitest run src/validator.spec.ts --runInBand`
- From `packages/language` directory:
  - `yarn vitest run src/validator.spec.ts`
- Via the existing test script:
  - `yarn workspace @graplix/language test --run src/validator.spec.ts`

### `packages/graplix-vscode-extension`

- `yarn workspace graplix-vscode-extension build`
  - Builds `dist` and creates VSIX via `vsce package --no-dependencies`.
- `yarn workspace graplix-vscode-extension watch`
  - Rebuilds extension continuously.
- No package-level `lint` or `test` script is defined.

Recommended full verification for language changes:

1. `yarn workspace @graplix/language test`
2. `yarn workspace @graplix/language build`
3. `yarn workspace graplix-vscode-extension build`
4. `yarn build`

## Formatting and Linting

- Controlled by `biome.json`.
- Use 2-space indentation and double quotes for strings.
- Keep imports organized; run Biome organize/import fix from root when needed.
- Avoid touching generated files manually.

## Import Conventions

- Group imports in stable order:
  1) `import type` statements (type-only)
  2) external deps
  3) workspace/package imports
  4) relative imports
- Keep type-only imports explicit.
- Prefer named imports over namespace imports when possible.
- Keep each import group separated for readability.

Example:

```ts
import type { ValidationAcceptor, ValidationChecks } from "langium";

import { NodeFileSystem } from "langium/node";

import type { GraplixServices } from "./services";
import { createGraplixServices } from "./services";
```

## Naming Conventions

- `Graplix*` prefix for language core APIs:
  - `GraplixValidator`
  - `GraplixModule`
  - `GraplixServices`
  - `createGraplixServices`
- PascalCase for classes/types.
- camelCase for functions/variables/constants.
- File names in `src/` should stay lowercase with hyphen separators when needed.
- Prefer `.spec.ts` for test filenames.

## Error Handling

- Do not use empty catch blocks.
- Preserve error context; avoid swallowing or suppressing stack traces.
- Prefer typed checks (`unknown` narrowing) over broad casts.
- Never add `as any`, `@ts-ignore`, or `@ts-expect-error`.
- For startup paths, fail fast with meaningful logs instead of silent termination.

## Async / Promise Usage

- Use `async`/`await` for asynchronous flows.
- Keep async helper functions narrow and testable (`loadFixture`, parser helpers).
- If the function does async work, mark it `async` and await it at call site.

## Type Rules

- Prefer explicit return types on exported/public functions.
- Prefer `type` declarations for strict utility aliases.
- Use `readonly` for immutable model data where practical.
- Avoid implicit `any`, including helper arguments.
- Use `noUncheckedSideEffectImports` conventions by keeping imports used and valid.

## Langium / Grammar Conventions

- Grammar source: `packages/language/src/graplix.langium`.
- Generated outputs in `packages/language/src/__generated__` and `packages/language/syntaxes` are derived.
- On grammar change, regenerate before validation/build.
- Validation logic goes in `validator.ts`; register checks via `registerValidationChecks`.
- Keep diagnostics concise and contextual (`Type ... not declared`, `Relation ... not declared`).
- Test both success and failure paths in fixtures.

## VS Code Extension Conventions

- Language ID: `graplix`, scope: `source.graplix`, extension: `.graplix`.
- Keep `contributes.grammars` and `contributes.languages` coherent with server startup options.
- Ensure syntax files stay aligned with generated grammar updates.
- Extension packaging should include `syntaxes`, `dist`, `language-configuration.json`.

## Test / Fixture Practices

- Keep grammar fixtures in `packages/language/src/fixtures/*`.
- Read fixtures via `readFile(new URL(...), "utf8")` to keep test portability.
- Use fixture-based fixtures for parser and validator behavior:
  - one valid fixture
  - focused negative fixtures for each validation error class

## Common Goto List

- Root: `package.json`, `tsconfig.json`, `biome.json`
- Language: `packages/language/package.json`, `packages/language/src/validator.ts`, `packages/language/src/fixtures`
- Extension: `packages/graplix-vscode-extension/package.json`, `src/extension.ts`, `src/language-server.ts`
