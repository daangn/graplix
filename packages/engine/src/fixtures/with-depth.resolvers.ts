import type { Resolvers } from "../createEngine";

type User = {
  readonly id: string;
};

type Organization = {
  readonly id: string;
  readonly memberIds: readonly string[];
};

type Repository = {
  readonly id: string;
  readonly ownerOrganizationId: string;
};

const users: User[] = [{ id: "user-0" }, { id: "user-1" }, { id: "user-2" }];

const organizations: Organization[] = [
  {
    id: "organization-0",
    memberIds: ["user-0", "user-1"],
  },
];

const repositories: Repository[] = [
  {
    id: "repository-0",
    ownerOrganizationId: "organization-0",
  },
];

const usersById = new Map(users.map((user) => [user.id, user] as const));
const organizationsById = new Map(
  organizations.map((organization) => [organization.id, organization] as const),
);
const repositoriesById = new Map(
  repositories.map((repository) => [repository.id, repository] as const),
);

export const withDepthResolvers: Resolvers = {
  user: {
    id(value: User): string {
      return value.id;
    },
    async load(id: string) {
      return usersById.get(id) ?? null;
    },
  },
  organization: {
    id(value: Organization): string {
      return value.id;
    },
    async load(id: string) {
      return organizationsById.get(id) ?? null;
    },
    relations: {
      member(organization: unknown) {
        const organizationValue = organization as Organization;
        return organizationValue.memberIds.map((id) => ({ type: "user", id }));
      },
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
        return {
          type: "organization",
          id: repositoryValue.ownerOrganizationId,
        };
      },
    },
  },
};
