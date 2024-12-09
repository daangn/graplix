# graplix

Authorization framework for implementing Relation-based Access Control (ReBAC) with the Resolver (Inspired by [GraphQL](https://graphql.org))

## What is ReBAC?

ReBAC is a method to check whether the current user has permission to a resource by using information about the relationship between the user and the resource. In order to do this, it is necessary to be able to traverse the relationship information between each resource, which is similar to graph traversal. For more information, see [the document](https://en.wikipedia.org/wiki/Relationship-based_access_control).

Once you've completed the setup, checking permissions is very easy. No more cascading `if` statement.

```typescript
/**
 * Do `req.user` and `page` have a `can_edit` relationship?
 */
const isAuthorized = await check({
  user: req.user,
  object: page,
  relation: "can_edit",
  context,
});

if (!isAuthorized) {
  throw new Error("You are not authorized");
}
```

## Getting Started

To configure a simple relationship-based authorization procedure like the above, a schema declaration is required first.

### Writing a schema

```typescript
/**
 * 1. For type autocompletion, you need to pass a type map for the entities currently existing in the system, like this:
 */
type MyTypeMap = {
  User: User,
  Folder: Folder,
  Page: Page,
}

/**
 * 2. And declare what kind of relationships these entities have as follows:
 */
import { GraplixSchema } from "graplix";

const schema: GraplixSchema<MyTypeMap> = {
  User: {},
  Folder: {
    owner: {
      type: "User",
    },
    editor: {
      type: "User",
    },
    viewer: {
      type: "User",
    },
  },
  Page: {
    parent: {
      type: "Folder",
    },
    owner: {
      type: "User",
    },
    editor: {
      type: "User",
    },
    viewer: {
      type: "User",
    },
  },
};

/**
 * 3. If there are other relationships that connect the relationship, add them.
 */
export const schema: GraplixSchema<MyTypeMap> = {
  User: {},
  Folder: {
    owner: {
      type: "User",
    },
    editor: {
      type: "User",
    },
    viewer: {
      type: "User",
    },
  },
  Page: {
    parent: {
      type: "Folder",
    },
    owner: {
      type: "User",
    },
    editor: {
      type: "User",
    },
    viewer: {
      type: "User",
    },
    can_view: [
      { when: "owner" },
      { when: "editor" },
      { when: "viewer" },

      // If you add a `from` clause, graplix will look at the relationship up to the relationship.
      // In this case, Page --parent--> Folder --owner--> User
      { when: "owner", from: "parent" },
      { when: "editor", from: "parent" },
      { when: "viewer", from: "parent" },
    ],
    can_edit: [
      { when: "owner" },
      { when: "editor" },
      { when: "owner", from: "parent" },
      { when: "editor", from: "parent" },
    ],
    can_delete: [
      { when: "owner" },
      { when: "owner", from: "parent" },
    ],
  },
};
```

### Writing a resolvers

Once the schema declaration is complete, we now need to implement how to actually connect the relationships declared in the schema. **The function** that finds and returns the next entity that has a relationship is called a *"resolver"*.

```typescript
import { GraplixResolvers } from "graplix";

/**
 * The type for the global Context required for the function to operate. It may include declarations such as DataLoader to prevent N+1 operation, or DB instances.
 */
type MyContext = {
  // ...
};

/**
 * 1. Implements what relationships each entity has with other entities.
 */
export const resolvers: GraplixResolvers<MyContext, MyTypeMap> = {
  User: {},
  Folder: {
    // ...
  },
  Page: {
    async parent(entity, context) {
      // The Resolver function takes the object and Context as arguments and returns the next object pointed to by the relationship.
      return folder;

      // If there is no corresponding object, it returns null.
      return null;

      // If there are multiple corresponding objects, multiple objects are returned.
      return [
        folder1,
        folder2,
        folder3,
        // ...
      ]
    },
  },
};

/**
 * 2. When an entity comes in, it identifies the entity by returning the entity name and ID it has.
 */
export const identify: GraplixIdentifier<MyTypeMap> = (entity) => {
  // takes an entity object as an argument and returns what entity it is.
  return {
    type: "Page",
    id: "1234",
  };
};
```

> **Important** If multiple small resolvers are executed simultaneously, there is a high possibility that **the N+1 problem** will occur. This problem can be solved by utilizing [DataLoader](https://github.com/graphql/dataloader), a representative library for [GraphQL](https://graphql.org/).

### Get `check()` function

Once everything is ready, you can create the `check()` function using `graplix()`

```typescript
import { graplix } from "graplix";
import { schema } from "./schema";
import { resolvers, identify } from "./resolvers";

export const { check } = graplix({
  schema,
  resolvers,
  identify,
});
```

### Use it!

Write authorization logic using the `check()` function in your endpoint.

```typescript
/**
 * Do `req.user` and `page` have a `can_edit` relationship?
 */
const isAuthorized = await check({
  user: req.user,
  object: page,
  relation: "can_edit",
  context,
}); // boolean

if (!isAuthorized) {
  throw new Error("Not Authorized!");
}
```


## To-do

- [ ] Schema Declaration using `.yaml` file or own DSL


## References

- [OpenFGA](https://openfga.dev/)
- [OpenFGA Playground](https://play.fga.dev/)
- [GraphQL](https://graphql.org/)

