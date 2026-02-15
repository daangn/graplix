# Repository Agent Instructions

## Scope

- This file applies to the whole repository at `/Users/tony/workspaces/daangn/graplix`.
- The repo is a Yarn 4 workspace with package roots:
  - `packages/language`
  - `packages/graplix-vscode-extension`
- Current implementation status is intentionally minimal/bootstrapped Langium + VS Code extension boilerplate.

## Discovery notes

- No existing repository-level instruction files were found:
  - `AGENTS.md`: none
  - `.cursor/rules/`: none
  - `.cursorrules`: none
  - `.github/copilot-instructions.md`: none
- There is a minimal top-level `README.md` only, with no operational guidance.
- `biome.json` is the authoritative formatter/linter source.

## Environment and assumptions

- Working directory: `/Users/tony/workspaces/daangn/graplix`
- Package manager: `yarn` with workspace support (`yarn@4.12.0` in repo root `packageManager`).
- TypeScript is strict and module-oriented.
- Source formatting style is enforced via Biome.

## Tooling inventory

- Build tool: `tsdown`
- Language generation tool: `langium generate`
- Language test runner: `vitest`
- Formatter/linter/fixer: `biome`
- VSIX packaging: `vsce`

## Must-know commands

### Root

- `yarn build`
  - Runs the monorepo build pipeline (`ultra -r build`).
- `yarn format`
  - Runs Biome checks/fixes across applicable files.
  - Equivalent command in root `package.json`:
    - `yarn format`

### Language package (`packages/language`)

- `yarn workspace @graplix/language langium:generate`
  - Re-runs Langium grammar generation from `src/graplix.langium`.
  - Rewrites:
    - `src/__generated__/grammar.ts`
    - `src/__generated__/ast.ts`
    - `src/__generated__/module.ts`
    - `syntaxes/graplix.tmLanguage.json`
- `yarn workspace @graplix/language build`
  - Runs:
    - generation step
    - tsdown build to `packages/language/dist`
- `yarn workspace @graplix/language test`
  - Current behavior: `vitest --run --passWithNoTests`
  - Returns success even when no test files exist.
- `yarn workspace @graplix/language test --run parser.test.ts`
  - Run a single test file path directly if tests are added later.
- `yarn workspace @graplix/language vitest run packages/language/test/parser.test.ts`
  - Explicit one-file run example; useful when scripts are changed.

### VS Code extension package (`packages/graplix-vscode-extension`)

- `yarn workspace graplix-vscode-extension build`
  - Runs `tsdown` and generates `.vsix` via `vsce`.
- `yarn workspace graplix-vscode-extension watch`
  - Optional watch mode for local iterative builds (if requested).
- Manual VSIX install command (after `build`):
  - open VSCode Extensions -> Install from VSIX / path to generated `graplix-vscode-extension-0.0.0.vsix`.

### Repository-wide checks (recommended sequence)

1. `yarn format`
2. `yarn workspace @graplix/language langium:generate`
3. `yarn workspace @graplix/language build`
4. `yarn workspace @graplix/language test`
5. `yarn workspace graplix-vscode-extension build`

## Core code style rules

- Use **double quotes** for JS/TS strings.
- Use **2 spaces** indentation (Biome formatter default).
- Keep semicolons consistent with existing files.
- Prefer `type`-only imports and exports where appropriate.
- Prefer explicit, named imports over namespace imports.
- Use sorted, organized imports.
  - Biome `organizeImports` is enabled, so let it normalize automatically.
- Keep source files UTF-8 and avoid unnecessary non-ASCII characters.

## TypeScript conventions

- `strict: true` is enabled in base tsconfig.
- Prefer explicit interfaces/types for public API shapes.
- Use `readonly` for immutable payloads where practical.
- Keep return types explicit for exported functions.
- Use `as const` where literal inference is beneficial and safe.
- Avoid `any`; do not add:
  - `as any`
  - `// @ts-ignore`
  - `@ts-expect-error`

## Naming conventions

- Language identifier: `graplix`.
- Service factory naming convention: `createGraplixServices`.
- Service module naming convention: `GraplixModule`, `GraplixGeneratedModule`.
- Language file extension: `.graplix`.
- AST node interfaces/types follow PascalCase (for generated and manual files).
- Constants use camelCase for in-file constants and `UPPER_CASE` for true enums only when semantically required.

## File-level conventions

- Files under `src/__generated__/` are generated.
  - Do not hand-edit generated outputs.
  - Re-run generator when grammar changes.
- Keep runtime extensions and entry points minimal until DSL features are defined.
- Source code should live in `src/`.
- Do not keep stale artifacts committed unless intentionally vendored.

## Error handling conventions

- Never leave empty `catch` blocks.
- On error:
  - preserve original error object for context,
  - wrap with actionable message where needed,
  - avoid swallowing stack traces.
- Prefer typed error handling (`unknown` + narrowing) over stringly-typed assumptions.

## Dependency and import hygiene

- Prefer workspace packages via package names rather than deep relative cross-package paths.
- Keep external dependency additions minimal in this minimal-boilerplate phase.
- If adding new dependencies, update only package-level `package.json` and workspace lock artifacts accordingly.

## Langium-specific conventions

- Language grammar lives in `packages/language/src/graplix.langium`.
- Regenerated grammar outputs include:
  - `src/__generated__/grammar.ts`
  - `src/__generated__/ast.ts`
  - `src/__generated__/module.ts`
  - `src/syntaxes/graplix.tmLanguage.json`
- Keep syntax IDs, scope names, file extension, and metadata aligned:
  - Language ID: `graplix`
  - Scope: `source.graplix`
  - Extension: `.graplix`
- If you introduce new custom services (validator/resolver/parser/printer/etc.):
  - create dedicated modules,
  - wire in `GraplixModule` in `services.ts`,
  - update tests accordingly.

## VS Code extension conventions

- Activate command IDs and names should stay consistent:
  - client id: `graplixLanguageServer`
  - server/client display: `Graplix Language Server`
- Language contribution block should point to:
  - `./syntaxes/graplix.tmLanguage.json`
  - file extension `.graplix`
- `packages/graplix-vscode-extension/package.json` `files` list must include runtime and syntax assets used by VSCE packaging.

## Verification expectations for agentic edits

- For changed code files, run relevant build commands.
- If modifying generated grammar or extension config:
  - run `yarn workspace @graplix/language build`
  - and `yarn workspace graplix-vscode-extension build`
- For test impact, run `yarn workspace @graplix/language test` (or targeted vitest run).
- Keep git status clean by design at handoff unless intentional incremental work is requested.

## Common gotchas

- `langium generate` will rewrite `*.tmLanguage.json`; if custom grammar-highlighting is needed, keep a source-of-truth convention and regenerate intentionally.
- VSIX packaging includes `syntaxes` from package `files`, so ensure `syntaxes/` exists and contains final TextMate grammar JSON.
- Do not commit generated `.vsix` artifacts unless explicitly requested.
- Current repo has minimal/empty tests, so `--passWithNoTests` is intentionally used to avoid false-negative CI failures.

## Suggested onboarding checklist for new DSL tasks

- Add/update grammar in `packages/language/src/graplix.langium`.
- Run `yarn workspace @graplix/language langium:generate`.
- Update extension syntax mapping if token scopes changed.
- Add/update tests in `packages/language/test`.
- Re-run sequence: generate -> language build -> language test -> extension build.
- Validate `.graplix` files open in extension with proper language registration.

## Single command cheat sheet

- Generate + build language in one pass: `yarn workspace @graplix/language build`
- Run language tests: `yarn workspace @graplix/language test`
- Build extension package: `yarn workspace graplix-vscode-extension build`
- Run formatter: `yarn format`

## Versioning / release notes (context)

- `changeset` directory exists for versioning workflow.
- Version bump/release steps are not part of day-to-day language iteration unless release is requested.

## Ownership and scope reminders

- This file is intended for coding agents and automation.
- Keep it authoritative and source-of-truth for command and style expectations.
