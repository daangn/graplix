import DataLoader from "dataloader";
import type { GraplixInput } from "../GraplixInput";
import type { GraplixResolvers } from "../GraplixResolvers";
import type { GraplixSchema } from "../GraplixSchema";
import { filterNonError } from "../utils";

type Repository = {
  $type: "Repository";
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
  $type: "Organization";
  id: string;
  memberIds: string[];
};

type User = {
  $type: "User";
  id: string;
};

type ObjectTypeMap = {
  Repository: Repository;
  Organization: Organization;
  User: User;
};

export const repositories: Repository[] = [
  {
    $type: "Repository",
    id: "0",
    owner: {
      type: "Organization",
      id: "0",
    },
  },
];

export const organizations: Organization[] = [
  {
    $type: "Organization",
    id: "0",
    memberIds: ["0"],
  },
];

export const users: User[] = [
  {
    $type: "User",
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

export const schema: GraplixSchema<ObjectTypeMap> = {
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

export const resolvers: GraplixResolvers<Context, ObjectTypeMap> = {
  Repository: {
    identify: (entity) => entity.id,
    relations: {
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
  },
  Organization: {
    identify: (entity) => entity.id,
    relations: {
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
  },
  User: {
    identify: (entity) => entity.id,
  },
};

export const input: GraplixInput<
  Context,
  {
    Repository: Repository;
    Organization: Organization;
    User: User;
  }
> = {
  schema,
  resolvers,
};
