import DataLoader from "dataloader";
import type { GraplixInput } from "../GraplixInput";
import type { GraplixResolvers } from "../GraplixResolvers";
import type { GraplixSchema } from "../GraplixSchema";
import { filterNonError } from "../utils";

type House = {
  $type: "House";
  id: string;
  ownerIds: string[];
  memberIds: string[];
};

type User = {
  $type: "User";
  id: string;
};

type ObjectTypeMap = {
  House: House;
  User: User;
};

export const users: User[] = [
  { $type: "User", id: "0" },
  { $type: "User", id: "1" },
  { $type: "User", id: "2" },
  { $type: "User", id: "3" },
];

export const houses: House[] = [
  {
    $type: "House",
    id: "0",
    ownerIds: ["0", "1"],
    memberIds: ["2", "3"],
  },
];

type Context = {
  loaders: {
    house: DataLoader<string, House>;
    user: DataLoader<string, User>;
  };
};

export const context: Context = {
  loaders: {
    house: new DataLoader<string, House>(async (ids) => {
      return houses.filter((a) => ids.includes(a.id));
    }),
    user: new DataLoader<string, User>(async (ids) => {
      return users.filter((a) => ids.includes(a.id));
    }),
  },
};

export const schema: GraplixSchema<ObjectTypeMap> = {
  House: {
    owner: {
      type: "User",
    },
    member: [
      {
        when: "owner",
      },
      {
        type: "User",
      },
    ],
    can_enter: {
      when: "member",
    },
  },
  User: {},
};

export const resolvers: GraplixResolvers<Context, ObjectTypeMap> = {
  House: {
    identify: (entity) => entity.id,
    relations: {
      owner: {
        type: "User",
        async resolve(obj, ctx) {
          const users = ctx.loaders.user
            .loadMany(obj.ownerIds)
            .then(filterNonError);

          return users;
        },
      },
      member: {
        type: "User",
        async resolve(obj, ctx) {
          const users = ctx.loaders.user
            .loadMany(obj.memberIds)
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

export const input: GraplixInput<Context, ObjectTypeMap> = {
  schema,
  resolvers,
};
