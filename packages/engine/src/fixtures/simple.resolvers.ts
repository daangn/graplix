import type { Resolvers } from "../createEngine";

type User = {
  readonly id: string;
};

type House = {
  readonly id: string;
  readonly ownerIds: readonly string[];
};

const users: User[] = [{ id: "user-0" }, { id: "user-1" }, { id: "user-2" }];

const houses: House[] = [
  {
    id: "house-0",
    ownerIds: ["user-0", "user-1"],
  },
];

const usersById = new Map(users.map((user) => [user.id, user] as const));
const housesById = new Map(houses.map((house) => [house.id, house] as const));

export const simpleResolvers: Resolvers = {
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
      owner(house: unknown) {
        const houseValue = house as House;
        return houseValue.ownerIds.map((id) => ({ type: "user", id }));
      },
    },
  },
};
