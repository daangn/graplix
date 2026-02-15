import type { Resolvers } from "../createEngine";

type User = {
  readonly id: string;
};

type Team = {
  readonly id: string;
  readonly ownerIds: readonly string[];
};

type Project = {
  readonly id: string;
  readonly teamId: string;
};

type Artifact = {
  readonly id: string;
  readonly projectId: string;
};

const users: User[] = [{ id: "user-0" }, { id: "user-1" }, { id: "user-2" }];

const teams: Team[] = [
  {
    id: "team-0",
    ownerIds: ["user-0"],
  },
];

const projects: Project[] = [
  {
    id: "project-0",
    teamId: "team-0",
  },
];

const artifacts: Artifact[] = [
  {
    id: "artifact-0",
    projectId: "project-0",
  },
];

const usersById = new Map(users.map((user) => [user.id, user] as const));
const teamsById = new Map(teams.map((team) => [team.id, team] as const));
const projectsById = new Map(
  projects.map((project) => [project.id, project] as const),
);
const artifactsById = new Map(
  artifacts.map((artifact) => [artifact.id, artifact] as const),
);

export const withMultipleDepthResolvers: Resolvers = {
  user: {
    id(value: User): string {
      return value.id;
    },
    async load(id: string) {
      return usersById.get(id) ?? null;
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
      owner(team: unknown) {
        const teamValue = team as Team;
        return teamValue.ownerIds.map((id) => ({ type: "user", id }));
      },
    },
  },
  project: {
    id(value: Project): string {
      return value.id;
    },
    async load(id: string) {
      return projectsById.get(id) ?? null;
    },
    relations: {
      team(project: unknown) {
        const projectValue = project as Project;
        return { type: "team", id: projectValue.teamId };
      },
    },
  },
  artifact: {
    id(value: Artifact): string {
      return value.id;
    },
    async load(id: string) {
      return artifactsById.get(id) ?? null;
    },
    relations: {
      project(artifact: unknown) {
        const artifactValue = artifact as Artifact;
        return { type: "project", id: artifactValue.projectId };
      },
    },
  },
};
