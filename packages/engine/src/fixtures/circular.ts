import { readFile } from "node:fs/promises";
import { EntityRef } from "../private/EntityRef";
import type { Resolvers } from "../Resolvers";
import type { ResolveType } from "../ResolveType";

export const schema = await readFile(
  new URL("./circular.graplix", import.meta.url),
  "utf8",
);

export type Repository = {
  readonly id: string;
};

const repositories: Repository[] = [{ id: "repository-cycle" }];

export const repositoriesById = new Map(
  repositories.map((repository) => [repository.id, repository] as const),
);

export const resolveType: ResolveType = () => null;

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
        return new EntityRef("repository", repositoryValue.id);
      },
      b(repository: unknown) {
        const repositoryValue = repository as Repository;
        return new EntityRef("repository", repositoryValue.id);
      },
      c(repository: unknown) {
        const repositoryValue = repository as Repository;
        return new EntityRef("repository", repositoryValue.id);
      },
    },
  },
};
