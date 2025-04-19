import type { GraplixInput } from "../GraplixInput";
import type { GraplixResolvers } from "../GraplixResolvers";
import type { GraplixSchema } from "../GraplixSchema";

type House = {
  id: string;
  type: "House";
  ownerIds: string[];
};

type User = {
  type: "User";
  id: string;
};

type ObjectTypeMap = {
  House: House;
  User: User;
};

export const users: User[] = [
  { type: "User", id: "0" },
  { type: "User", id: "1" },
  { type: "User", id: "2" },
  { type: "User", id: "3" },
];

export const houses: House[] = [
  {
    type: "House",
    id: "0",
    ownerIds: ["0", "1"],
  },
];

type Context = {};

export const context: Context = {};

export const schema: GraplixSchema<ObjectTypeMap> = {
  House: {
    resolver_type_not_matched: {
      type: "User",
    },
    resolver_not_found: {
      type: "User",
    },
  },
  User: {},
};

export const resolvers: GraplixResolvers<Context, ObjectTypeMap> = {
  House: {
    identify: (entity) => entity.id,
    relations: {
      resolver_type_not_matched: {
        type: "House",
        async resolve() {
          return null;
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
