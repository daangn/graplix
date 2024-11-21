import DataLoader from "dataloader";

import type { GraphAuthInput } from "../GraphAuthInput";
import type { GraphAuthResolvers } from "../GraphAuthResolvers";
import type { GraphAuthSchema } from "../GraphAuthSchema";
import { filterNonError } from "../utils";

type Repository = {
  __typename: "Repository";
  id: string;
  owner:
    | {
        type: "Organization";
        id: string;
      }
    | {
        type: "User";
        id: string;
      };
};

type Organization = {
  __typename: "Organization";
  id: string;
  memberIds: string[];
};

type User = {
  __typename: "User";
  id: string;
};

type ObjectTypeMap = {
  Repository: Repository;
  Organization: Organization;
  User: User;
};

export const repositories: Repository[] = [
  {
    __typename: "Repository",
    id: "0",
    owner: {
      type: "Organization",
      id: "0",
    },
  },
];

export const organizations: Organization[] = [
  {
    __typename: "Organization",
    id: "0",
    memberIds: ["0"],
  },
];

export const users: User[] = [
  {
    __typename: "User",
    id: "0",
  },
];

type Context = {
  loaders: {
    repository: DataLoader<string, Repository>;
    organization: DataLoader<string, Organization>;
    user: DataLoader<string, User>;
  };
};

export const context: Context = {
  loaders: {
    repository: new DataLoader<string, Repository>(async (ids) => {
      return repositories.filter((a) => ids.includes(a.id));
    }),
    organization: new DataLoader<string, Organization>(async (ids) => {
      return organizations.filter((a) => ids.includes(a.id));
    }),
    user: new DataLoader<string, User>(async (ids) => {
      return users.filter((a) => ids.includes(a.id));
    }),
  },
};

export const schema: GraphAuthSchema<ObjectTypeMap> = {
  Repository: {
    own: { type: "Organization" },
    can_delete: {
      when: "member",
      from: "own",
    },
  },
  Organization: {
    member: {
      type: "User",
    },
  },
  User: {},
};

export const resolvers: GraphAuthResolvers<Context, ObjectTypeMap> = {
  Repository: {
    own: {
      type: "Organization",
      async resolve(obj, ctx) {
        if (obj.owner.type !== "Organization") {
          return null;
        }
        return ctx.loaders.organization.load(obj.owner.id);
      },
    },
  },
  Organization: {
    member: {
      type: "User",
      async resolve(organization, ctx) {
        const users = ctx.loaders.user
          .loadMany(organization.memberIds)
          .then(filterNonError);

        return users;
      },
    },
  },
  User: {},
};

export const input: GraphAuthInput<
  Context,
  {
    Repository: Repository;
    Organization: Organization;
    User: User;
  }
> = {
  schema,
  resolvers,
  identifyNode(obj) {
    return {
      type: obj.__typename,
      id: obj.id,
    };
  },
};
