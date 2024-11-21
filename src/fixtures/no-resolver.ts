import type { GraphAuthInput } from "../GraphAuthInput";
import type { GraphAuthResolvers } from "../GraphAuthResolvers";
import type { GraphAuthSchema } from "../GraphAuthSchema";

type House = {
  __typename: "House";
  id: string;
  ownerIds: string[];
};

type User = {
  __typename: "User";
  id: string;
};

type ObjectTypeMap = {
  House: House;
  User: User;
};

export const users: User[] = [
  { __typename: "User", id: "0" },
  { __typename: "User", id: "1" },
  { __typename: "User", id: "2" },
  { __typename: "User", id: "3" },
];

export const houses: House[] = [
  {
    __typename: "House",
    id: "0",
    ownerIds: ["0", "1"],
  },
];

type Context = {};

export const context: Context = {};

export const schema: GraphAuthSchema<ObjectTypeMap> = {
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

export const resolvers: GraphAuthResolvers<Context, ObjectTypeMap> = {
  House: {
    resolver_type_not_matched: {
      type: "House",
      async resolve() {
        return null;
      },
    },
  },
  User: {},
};

export const input: GraphAuthInput<Context, ObjectTypeMap> = {
  schema,
  resolvers,
  identifyNode(obj) {
    return {
      type: obj.__typename,
      id: obj.id,
    };
  },
};
