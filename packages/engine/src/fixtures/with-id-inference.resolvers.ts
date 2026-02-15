import type { Resolvers } from "../createEngine";

type User = {
  readonly entityId: string;
};

type Repository = {
  readonly id: string;
  readonly ownerId: string;
};

const users: User[] = [{ entityId: "user-1" }];

const repositories: Repository[] = [
  {
    id: "repository-1",
    ownerId: "user-1",
  },
];

const usersById = new Map(users.map((user) => [user.entityId, user] as const));
const repositoriesById = new Map(
  repositories.map((repository) => [repository.id, repository] as const),
);

export const withIdInferenceResolvers: Resolvers = {
  user: {
    id(value: User): string {
      return value.entityId;
    },
    async load(id: string) {
      return usersById.get(id) ?? null;
    },
  },
  repository: {
    id(value: Repository): string {
      return value.id;
    },
    async load(id: string) {
      return repositoriesById.get(id) ?? null;
    },
    relations: {
      owner(repository: unknown) {
        const repositoryValue = repository as Repository;
        return { entityId: repositoryValue.ownerId };
      },
    },
  },
};
