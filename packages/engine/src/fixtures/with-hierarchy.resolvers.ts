import type { Resolvers } from "../createEngine";

type User = {
  readonly id: string;
};

type House = {
  readonly id: string;
  readonly ownerIds: readonly string[];
  readonly memberIds: readonly string[];
};

const users: User[] = [
  { id: "user-0" },
  { id: "user-1" },
  { id: "user-2" },
  { id: "user-3" },
];

const houses: House[] = [
  {
    id: "house-1",
    ownerIds: ["user-0", "user-1"],
    memberIds: ["user-2"],
  },
];

const usersById = new Map(users.map((user) => [user.id, user] as const));
const housesById = new Map(houses.map((house) => [house.id, house] as const));

export const withHierarchyResolvers: Resolvers = {
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
      member(house: unknown) {
        const houseValue = house as House;
        return houseValue.memberIds.map((id) => ({ type: "user", id }));
      },
    },
  },
};
