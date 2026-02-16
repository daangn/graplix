# Graplix

Graplix is a TypeScript-first toolkit for modeling and evaluating ReBAC (Relation-Based Access Control).

- Define authorization relationships with `.graplix` schema files.
- Parse and validate schemas with language tooling.
- Evaluate permissions at runtime with resolver-driven engine APIs.
- Generate typed helpers and runtime wrappers with codegen.
- Use VS Code language support for authoring and navigation.

## Packages

### `@graplix/language`

Langium-based parser and language services for Graplix schemas.

- Parses `.graplix` documents and returns diagnostics.
- Exposes language services used by runtime/codegen/extension.
- README: [`packages/language/README.md`](packages/language/README.md)

### `@graplix/engine`

Runtime evaluator for schema-defined relations.

- `check(query)` for boolean authorization checks.
- `explain(query)` for traversed relation edges and matched path.
- README: [`packages/engine/README.md`](packages/engine/README.md)

### `@graplix/codegen`

TypeScript generator for Graplix schemas.

- Generates typed helpers from `.graplix` input.
- Run from npm with `npx @graplix/codegen`.
- Supports mapper configuration and config-file discovery.
- README: [`packages/codegen/README.md`](packages/codegen/README.md)

### `graplix-vscode-extension`

VS Code extension package for Graplix language support.

- Syntax highlighting and language registration.
- Language server client/server bootstrap.
- README: [`packages/vscode-extension/README.md`](packages/vscode-extension/README.md)

## Monorepo Commands

From the repository root:

```bash
yarn build
yarn format
```

Package-level commands are documented in each package README.

## Repository Layout

- `packages/language`
- `packages/engine`
- `packages/codegen`
- `packages/vscode-extension`
- `.tech-specs` (implementation specs and plans)
