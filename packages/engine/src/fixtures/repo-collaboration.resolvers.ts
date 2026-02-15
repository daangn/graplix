import type { Resolvers } from "../createEngine";

type User = {
  readonly id: string;
};

type Organization = {
  readonly id: string;
  readonly adminIds: readonly string[];
};

type Team = {
  readonly id: string;
  readonly maintainerIds: readonly string[];
};

type Repository = {
  readonly id: string;
  readonly ownerIds: readonly string[];
  readonly teamIds: readonly string[];
  readonly organizationId: string;
};

const users: User[] = [
  { id: "u-cto" },
  { id: "u-platform-maintainer" },
  { id: "u-platform-owner" },
  { id: "u-security-lead" },
  { id: "u-ops" },
];

const organizations: Organization[] = [
  { id: "org-acme", adminIds: ["u-cto"] },
  { id: "org-security", adminIds: ["u-security-lead"] },
];

const teams: Team[] = [
  {
    id: "team-platform",
    maintainerIds: ["u-platform-maintainer", "u-platform-owner"],
  },
  { id: "team-security", maintainerIds: ["u-security-lead"] },
];

const repositories: Repository[] = [
  {
    id: "repo-api",
    ownerIds: ["u-platform-owner"],
    teamIds: ["team-platform"],
    organizationId: "org-acme",
  },
  {
    id: "repo-infra",
    ownerIds: ["u-ops"],
    teamIds: ["team-security"],
    organizationId: "org-security",
  },
];

const usersById = new Map(users.map((user) => [user.id, user] as const));
const organizationsById = new Map(
  organizations.map((organization) => [organization.id, organization] as const),
);
const teamsById = new Map(teams.map((team) => [team.id, team] as const));
const repositoriesById = new Map(
  repositories.map((repository) => [repository.id, repository] as const),
);

export const repoCollaborationResolvers: Resolvers = {
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
      admin(org: unknown) {
        const organization = org as Organization;
        return organization.adminIds.map((id: string) => ({
          type: "user",
          id,
        }));
      },
    },
  },
  team: {
    id(value: Team): string {
      return value.id;
    },
    async load(id: string) {
      return teamsById.get(id) ?? null;
    },
    relations: {
      maintainer(team: unknown) {
        const maintainerTeam = team as Team;
        return maintainerTeam.maintainerIds.map((id) => ({ type: "user", id }));
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
        const repositoryEntity = repository as Repository;
        return repositoryEntity.ownerIds.map((id) => ({ type: "user", id }));
      },
      team(repository: unknown) {
        const repositoryEntity = repository as Repository;
        return repositoryEntity.teamIds.map((id) => ({ type: "team", id }));
      },
      organization(repository: unknown) {
        const repositoryEntity = repository as Repository;
        return {
          type: "organization",
          id: repositoryEntity.organizationId,
        };
      },
    },
  },
};
