# Embedded Documentation

Use this when `@graplix/engine` is installed locally. Embedded docs match the exact installed version — they are the most reliable source of truth.

## Verify Installation

```bash
ls node_modules/@graplix/engine/
```

If `@graplix/engine` is installed, proceed with the strategies below. If not, see `references/quick-start.md`.

## Documentation Files

`@graplix/engine` ships Markdown documentation inside the package at `node_modules/@graplix/engine/dist/docs/`. These are generated from the official package READMEs.

### How to Read

```bash
cat node_modules/@graplix/engine/dist/docs/engine.md
```

### File Map

| File | Topic | Use When |
|------|-------|----------|
| `dist/docs/engine.md` | Engine API — `buildEngine`, `check`, `explain`, resolver interface, options | Writing resolvers, checking permissions, debugging |
| `dist/docs/language.md` | Language package — `parse`, diagnostics, language services | Parsing schemas programmatically |
| `dist/docs/codegen.md` | Codegen CLI and generated API | Generating typed wrappers from `.graplix` schemas |

### Search Across Docs

```bash
grep -r "resolveType" node_modules/@graplix/engine/dist/docs/
```

```bash
grep -rl "explain" node_modules/@graplix/engine/dist/docs/
```

## Type Declaration Files (Supplementary)

For precise API signatures and type definitions, read the type declaration files:

| File | Contents |
|------|----------|
| `dist/index.d.mts` | All public exports — functions and types |

```bash
cat node_modules/@graplix/engine/dist/index.d.mts
```

These contain TSDoc comments and full type signatures.

## Priority

1. **dist/docs/*.md** — Human-readable documentation with examples and explanations
2. **dist/index.d.mts** — Precise type signatures for API details
3. **This skill's SKILL.md** — Contains core patterns and rules that are always available
