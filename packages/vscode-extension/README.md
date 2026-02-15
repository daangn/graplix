# graplix-vscode-extension

VS Code extension package that provides Graplix syntax highlighting and language-server features.

## What It Includes

- `.graplix` language registration
- TextMate grammar (`syntaxes/graplix.tmLanguage.json`)
- Language Server client bootstrap (`src/extension.ts`)
- Node language server entry (`src/language-server.ts`)

## Development

From repository root:

```bash
yarn workspace graplix-vscode-extension build
yarn workspace graplix-vscode-extension watch
```

Build produces:

- `dist/*.cjs` runtime bundles
- `graplix-vscode-extension-<version>.vsix` package artifact

## Notes

- Keep this package aligned with `@graplix/language` grammar outputs.
- If grammar changes, regenerate language artifacts in `packages/language` first.
