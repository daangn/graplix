import type { ResolverContext, Resolvers } from "../createEngine";

type Repository = {
  readonly id: string;
};

type User = {
  readonly id: string;
};

export interface WithContextContext extends ResolverContext {
  readonly shouldReadOwner?: boolean;
}

const users: User[] = [{ id: "user-default" }];

const repositories: Repository[] = [
  {
    id: "repo-4",
  },
];

const usersById = new Map(users.map((user) => [user.id, user] as const));
const repositoriesById = new Map(
  repositories.map((repository) => [repository.id, repository] as const),
);

export const withContextResolvers: Resolvers<WithContextContext> = {
  user: {
    id(value: User): string {
      return value.id;
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
      owner(_repository: unknown, context: WithContextContext) {
        if (context.shouldReadOwner === false) {
          return [];
        }

        return [{ type: "user", id: "user-default" }];
      },
    },
  },
};
