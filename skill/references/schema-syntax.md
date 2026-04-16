# Schema Syntax

Reference for the `.graplix` schema language.

## File Structure

A `.graplix` file is a plain text file containing zero or more type declarations:

```graplix
type <TypeName>
  relations
    define <relation_name>: <expression>
    define <relation_name>: <expression>
    ...

type <TypeName>
  ...
```

Types with no relations are valid (used as leaf nodes):

```graplix
type user
type service_account
```

## Type Declarations

```graplix
type <name>
```

- `<name>` must match `/[a-zA-Z_][a-zA-Z0-9_]*/`
- Convention: `snake_case` (e.g., `pull_request`, `service_account`)
- Order of type declarations does not matter

## Relation Definitions

```graplix
type <TypeName>
  relations
    define <name>: <expression>
```

- `<name>` follows the same identifier rules as type names
- Convention: `snake_case` verbs/nouns (e.g., `owner`, `can_edit`, `member`)
- A type may have any number of `define` statements

## Relation Expressions

### Direct — `[TypeA, TypeB, ...]`

The user must be directly assigned as one of the listed types:

```graplix
type document
  relations
    define owner: [user]
    define editor: [user, service_account]
```

- The list may contain one or more type names
- Types in the list must be declared in the same schema
- Resolver must implement `relations.owner` (or the engine won't find any users)

### From — `relation from source`

Transitive via another relation defined on a related entity:

```graplix
type organization
  relations
    define admin: [user]

type repository
  relations
    define organization: [organization]
    define can_admin: admin from organization
    //                ^^^^^ relation on organization type
    //                      ^^^^^^^^^^^^ relation on repository that holds the organization
```

`admin from organization` means: "the user is `admin` of the entity that is in my `organization` relation."

### Or — `term or term`

Union of multiple terms — user satisfies any one of them:

```graplix
type document
  relations
    define owner: [user]
    define editor: [user]
    define can_edit: owner or editor
    define can_view: can_edit or viewer
```

`or` can chain any mix of `direct` and `from` terms:

```graplix
define write: owner or maintainer from team
```

## Comments

Line comments only, starting with `//`:

```graplix
// This is a comment
type user  // inline comment
```

## Complete Example

A GitHub-like permission model:

```graplix
type user

type organization
  relations
    define admin: [user]
    define member: [user]

type team
  relations
    define owner: [user]
    define maintainer: [user]
    define member: [user]

type repository
  relations
    define owner: [user]
    define team: [team]
    define organization: [organization]
    define member: [user]
    define write: owner or maintainer from team
    define admin: write or admin from organization
    define can_delete: admin

type issue
  relations
    define reporter: [user]
    define assignee: [user]
    define repository: [repository]
    define can_edit: assignee or admin from repository
    define can_close: can_edit or reporter
```

## Resolvers Must Match Schema

Every type with relations needs a resolver entry, and every direct relation (`[TypeA]`) needs a corresponding `relations` function in the resolver:

```typescript
// Schema:
//   type repository
//     relations
//       define owner: [user]
//       define team: [team]

resolvers: {
  repository: {
    id: (repo) => repo.id,
    async load(id, ctx) { return ctx.db.findRepo(id); },
    relations: {
      owner(repo, ctx) { return ctx.db.findUsers(repo.ownerIds); },
      team(repo, ctx) { return ctx.db.findTeam(repo.teamId); },
    },
  },
}
```

**If a relation resolver is missing**, the engine treats that relation as empty (no entities). This is not an error but will cause `check` to return `false` for that relation path.

## Schema Validation

`buildEngine()` validates the schema at construction time:

- Unknown type references (e.g., `define owner: [nonexistent]`) → immediate rejection
- Syntax errors → immediate rejection with diagnostic messages
- Circular `from` chains → detected at evaluation time (cycle guard, not schema validation)

## Parsing via `@graplix/language`

```typescript
import { parse } from "@graplix/language";

const doc = await parse(`
  type user

  type repository
    relations
      define owner: [user]
`);

if ((doc.diagnostics?.length ?? 0) > 0) {
  console.error(doc.diagnostics);
}
```
