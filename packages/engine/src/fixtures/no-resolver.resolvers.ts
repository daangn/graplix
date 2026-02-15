import type { Resolvers } from "../createEngine";

type User = {
  readonly id: string;
};

type House = {
  readonly id: string;
};

const users: User[] = [{ id: "user-0" }];

const houses: House[] = [
  {
    id: "house-0",
  },
];

const usersById = new Map(users.map((user) => [user.id, user] as const));
const housesById = new Map(houses.map((house) => [house.id, house] as const));

export const noResolverResolvers: Resolvers = {
  user: {
    id(value: User): string {
      return value.id;
    },
    async load(id: string) {
      return usersById.get(id) ?? null;
    },
  },
  house: {
    id(value: House): string {
      return value.id;
    },
    async load(id: string) {
      return housesById.get(id) ?? null;
    },
    relations: {
      resolver_type_not_matched(house: unknown) {
        const houseValue = house as House;
        return houseValue;
      },
    },
  },
};
