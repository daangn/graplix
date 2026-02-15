# Graplix Schema Design

This document defines the **Graplix schema declaration language**.
Query API, client interfaces, and implementation details are defined in separate documents.

## 1. Language Profile

- Inspired by OpenFGA-style relation modeling.
- No model header such as `model schema 1.1`.
- No userset notation (`type#relation`).
- A relation subject can be either:
  - a direct type reference (`[user]`, `[user, organization]`), or
  - a surrounding relation reference (`owner`, `member from owner`).

- Line comments using `//` are supported and are ignored by parser and validation.

## 2. Schema Declaration

Schema files are composed of type declarations only.

```graplix
type user

type organization
  relations
    define owner: [user]
    define admin: [user] or owner
    define member: [user] or admin

type team
  relations
    define org: [organization]
    define member: [user] or member from org

type repository
  relations
    define owner: [organization]
    define admin: [user] or admin from owner
    define maintainer: [user] or admin
    define writer: [user] or maintainer or writer from owner
    define reader: [user] or writer

type document
  relations
    define repo: [repository]
    define owner: [user] or owner from repo
    define editor: [user] or owner or writer from repo
    define viewer: [user] or editor
```

## 3. Type Definition

```graplix
type <TypeName>
  relations
    define <relation>: <relation_expression>
```

- `type` block may be declared without `relations` if no relations are needed.

## 4. Relation Expressions

### 4.1 Direct Relation

```graplix
define <relation>: [<type1>, <type2>]
```

### 4.2 Computed Relation

```graplix
define <relation>: <left_relation> or <right_relation> [or ...]
```

- `<left>` and `<right>` can reference relation identifiers.

### 4.3 Surrounding Relation Reference

```graplix
define <relation>: <relation_name> from <local_relation>
```

- The `from` form means:
  - resolve `<source_relation>` of the current object,
  - then take the referenced relation from the resolved objects.

## 5. Formal Grammar

```ebnf
schema           ::= { type_decl }

type_decl        ::= "type" identifier [relations_block]
relations_block  ::= "relations" { relation_def }
relation_def     ::= "define" identifier ":" relation_expr

relation_expr    ::= relation_union
relation_union   ::= relation_primary { "or" relation_primary }
relation_primary ::= direct_types | relation_ref ["from" identifier]

direct_types     ::= "[" identifier { "," identifier } "]"
relation_ref     ::= identifier

identifier       ::= [a-zA-Z_][a-zA-Z0-9_]*
```

## 6. Constraints

- Userset (`type#relation`) is **not supported**.
- Relation references are **only identifiers**; tuple-to-userset style referencing is unsupported.
- The language does not currently include model-level headers or section directives.

## 7. Comments

```graplix
// This is a full-line comment and is ignored.
type user

type repository
  relations
    define owner: [user] // Inline comment after valid syntax
```

- Use `//` for full-line or inline comments.
- Comments are not part of the syntax graph and do not affect validation.
