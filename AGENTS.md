# Graplix Agent Guide

## Scope

- Applies to `/Users/tony/workspaces/daangn/graplix`.
- Yarn workspaces monorepo (`yarn@4.12.0`).
- Primary workspaces:
  - `packages/language`
  - `packages/engine`
  - `packages/codegen`
  - `packages/vscode-extension`

## Rule Files

- `.cursor/rules/`: not found.
- `.cursorrules`: not found.
- `.github/copilot-instructions.md`: not found.
- This file is the repository-level source of truth for agent behavior.

## Core Stack

- TypeScript (strict mode via root `tsconfig.json`).
- Langium (`packages/language`).
- Runtime authorization engine (`packages/engine`).
- TypeScript generator CLI (`packages/codegen`).
- VS Code extension (`packages/vscode-extension`).

## Build, Test, Lint, Format Commands

### Root

- `yarn build`
  - Runs workspace builds (`ultra -r build`).
- `yarn format`
  - Runs Biome formatting/lint autofix (`biome check --fix --unsafe`).

### Language (`@graplix/language`)

- `yarn workspace @graplix/language langium:generate`
  - Regenerates grammar outputs.
- `yarn workspace @graplix/language build`
  - Runs `langium:generate` then `tsdown`.
- `yarn workspace @graplix/language test`
  - Runs `vitest --run --passWithNoTests`.
- Single test examples:
  - `yarn workspace @graplix/language vitest run src/validator.spec.ts`
  - `yarn workspace @graplix/language vitest run src/parse.spec.ts`

### Engine (`@graplix/engine`)

- `yarn workspace @graplix/engine build`
- `yarn workspace @graplix/engine test`
- Single test examples:
  - `yarn workspace @graplix/engine vitest run src/createEngine.spec.ts`
  - `yarn workspace @graplix/engine vitest run src/createEngine.spec.ts -t "explain"`

### Codegen (`@graplix/codegen`)

- `yarn workspace @graplix/codegen build`
- `yarn workspace @graplix/codegen test`
- `yarn workspace @graplix/codegen codegen ./schema.graplix`
- Single test examples:
  - `yarn workspace @graplix/codegen vitest run src/generate.spec.ts`
  - `yarn workspace @graplix/codegen vitest run src/generate.spec.ts -t "mapper"`

### VS Code Extension (`graplix-vscode-extension`)

- `yarn workspace graplix-vscode-extension build`
  - Builds extension bundle and packages VSIX.
- `yarn workspace graplix-vscode-extension watch`
- No workspace `test` script currently defined.

## Recommended Verification Flow

Use the smallest relevant scope first, then expand.

1. Package-level tests for changed package.
2. Package-level build for changed package.
3. If grammar or language services changed:
   - `yarn workspace @graplix/language build`
   - `yarn workspace graplix-vscode-extension build`
4. Final confidence run: `yarn build`.

## Formatting and Lint Rules

From `biome.json`:

- Use spaces, width 2.
- JavaScript/TypeScript strings use double quotes.
- Organize imports is enabled.
- Linter recommended rules are enabled.
- Repository includes all files except `**/__generated__`.

## Import Conventions

- Prefer explicit `import type` for type-only imports.
- Keep import groups stable:
  1) type-only imports
  2) external packages
  3) workspace package imports
  4) relative imports
- Avoid unused imports and side-effect-only imports unless required.

## TypeScript Conventions

- Strict typing is mandatory.
- Avoid `any`, `@ts-ignore`, and `@ts-expect-error`.
- Prefer explicit return types on exported APIs.
- Use `readonly` for immutable fields where practical.
- Keep exported types/interfaces in stable public files (`src/index.ts` exports).

## Naming Conventions

- PascalCase for interfaces/types/classes.
- camelCase for variables/functions.
- Keep file names lowercase; use hyphens when needed.
- Test files should end with `.spec.ts`.

## Error Handling Conventions

- Fail fast with clear error messages.
- Do not swallow errors in empty `catch` blocks.
- Preserve context when rethrowing.
- For schema parsing/validation, include diagnostics text in thrown errors.

## Async and Promise Conventions

- Prefer `async`/`await` over chained `.then`.
- Await promise assertions in tests (`await expect(...).rejects...`).
- Keep async helper functions focused and deterministic.

## Generated and Fixture Files

- Do not manually edit language generated files under:
  - `packages/language/src/__generated__`
  - `packages/language/syntaxes/graplix.tmLanguage.json`
- If grammar changes, run `langium:generate` before tests/build.
- Keep fixtures representative of domain intent (for example GitHub fixtures stay GitHub-only).

## Codegen-Specific Notes

- CLI supports config discovery via `cosmiconfig`.
- Supported config names include `graplix.codegen.*` and `graplix-codegen.config.*`.
- CLI precedence: command-line args override config values.
- Prefer JSON config with `$schema` for editor-validated codegen settings.

## Tech Spec Workflow

- Store feature specs in `.tech-specs/` using:
  - `YYYY-MM-DD-####-name.md`
- For multi-step features, create/update a spec before significant edits.
- Include scope, requirements, implementation plan, and acceptance criteria.

## Practical File Map

- Root: `package.json`, `tsconfig.json`, `biome.json`, `AGENTS.md`.
- Language: `packages/language/src/graplix.langium`, `src/validator.ts`, `src/parse.ts`.
- Engine: `packages/engine/src/createEngine.ts`, `src/private/*`, `src/createEngine.spec.ts`.
- Codegen: `packages/codegen/src/generate.ts`, `src/cli.ts`, `src/config.ts`.
- Extension: `packages/vscode-extension/src/extension.ts`, `src/language-server.ts`.

## Agent Checklist Before Final Response

1. Confirm commands were run for the touched package(s).
2. Confirm no unintended generated-file edits.
3. Confirm style/format consistency.
4. Mention any pre-existing issues discovered during verification.
