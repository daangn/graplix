import type { Resolvers } from "../createEngine";

type Repository = {
  readonly id: string;
};

const repositories: Repository[] = [
  {
    id: "repository-cycle",
  },
];

const repositoriesById = new Map(
  repositories.map((repository) => [repository.id, repository] as const),
);

export const withCircularDependencyResolvers: Resolvers = {
  repository: {
    id(value: Repository): string {
      return value.id;
    },
    async load(id: string) {
      return repositoriesById.get(id) ?? null;
    },
  },
};
