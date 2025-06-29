---
"graplix": major
---

## Major Changes

### Monorepo Migration & Project Structure

- Migrated to a monorepo structure using Yarn workspaces. The codebase is now split into `packages/graplix` (core library) and `playground` (web-based DSL playground).
- Updated root and package-level `package.json` files, scripts, and configuration files for workspace compatibility.
- Moved all core source files from `src/` to `packages/graplix/src/`.

### DSL Parser & Playground
- Implemented a parser for the OpenFGA-inspired DSL, converting schemas into Graplix's internal format.
- Added a web-based playground for experimenting with the DSL: supports code editing, JSON output, and Mermaid diagram visualization.
- Enhanced user experience with theme switching, layout persistence, and clipboard features.

### BREAKING CHANGE: Resolver & Identify Refactor
- The `identify` function is now part of each entity’s resolver definition instead of a global input property.
- Resolver structure now uses a `relations` object for clarity and extensibility.

### Validation & Error Handling Improvements
- Added validation for parsed DSL models. Unsupported features (AND, BUT NOT, type restrictions, wildcards, conditions, mixed ‘or’ usage) now throw explicit errors.
- Improved error reporting with `MultipleUnimplementedError` and detailed test coverage for error scenarios.

### Other Improvements
- Cleaned up imports/exports, and removed obsolete dependencies.
- Updated project configuration (`yarn.lock`, `tsconfig`, etc.) for consistency and maintainability.

> [!IMPORTANT] 
> This release introduces breaking changes and a major project structure overhaul. 
