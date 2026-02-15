import { readFile } from "node:fs/promises";
import type { Resolvers } from "../createEngine";

export const schema = await readFile(
  new URL("./circular.graplix", import.meta.url),
  "utf8",
);

type Repository = {
  readonly id: string;
};

const repositories: Repository[] = [{ id: "repository-cycle" }];

const repositoriesById = new Map(
  repositories.map((repository) => [repository.id, repository] as const),
);

export const resolvers: Resolvers = {
  repository: {
    id(value: Repository): string {
      return value.id;
    },
    async load(id: string) {
      return repositoriesById.get(id) ?? null;
    },
    relations: {
      a(repository: unknown) {
        const repositoryValue = repository as Repository;
        return { type: "repository", id: repositoryValue.id };
      },
      b(repository: unknown) {
        const repositoryValue = repository as Repository;
        return { type: "repository", id: repositoryValue.id };
      },
      c(repository: unknown) {
        const repositoryValue = repository as Repository;
        return { type: "repository", id: repositoryValue.id };
      },
    },
  },
};
