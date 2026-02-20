import { readFile } from "node:fs/promises";
import type { Resolvers } from "../Resolvers";
import type { ResolveType } from "../ResolveType";

export const schema = await readFile(
  new URL("./github.graplix", import.meta.url),
  "utf8",
);

export interface GithubContext {
  readonly shouldReadOwner?: boolean;
}

export type User = {
  readonly id: string;
};

export type Organization = {
  readonly id: string;
  readonly adminIds: readonly string[];
  readonly memberIds: readonly string[];
};

export type Team = {
  readonly id: string;
  readonly ownerIds: readonly string[];
  readonly maintainerIds: readonly string[];
  readonly triagerIds: readonly string[];
  readonly memberIds: readonly string[];
};

export type Project = {
  readonly id: string;
  readonly teamIds: readonly string[];
  readonly triageTeamIds: readonly string[];
  readonly approverIds: readonly string[];
};

export type Repository = {
  readonly id: string;
  readonly ownerIds: readonly string[];
  readonly organizationId: string;
  readonly teamIds: readonly string[];
};

export type Artifact = {
  readonly id: string;
  readonly projectId: string;
};

export type Label = {
  readonly id: string;
  readonly reviewerIds: readonly string[];
};

export type Issue = {
  readonly id: string;
  readonly reporterId: string;
  readonly assigneeId: string;
  readonly projectId: string;
  readonly labelId: string;
};

export type GithubEntityInput =
  | User
  | Organization
  | Team
  | Project
  | Repository
  | Artifact
  | Label
  | Issue;

const users: User[] = [
  { id: "user-0" },
  { id: "user-1" },
  { id: "user-2" },
  { id: "user-3" },
  { id: "user-4" },
  { id: "user-default" },
  { id: "u-reporter" },
  { id: "u-triage-lead" },
  { id: "u-sre" },
  { id: "u-security" },
  { id: "u-qa" },
  { id: "u-platform-owner" },
  { id: "u-platform-maintainer" },
  { id: "u-security-lead" },
  { id: "u-ops" },
  { id: "u-cto" },
];

const organizations: Organization[] = [
  {
    id: "organization-0",
    adminIds: ["u-cto"],
    memberIds: ["user-0", "user-1"],
  },
  {
    id: "organization-1",
    adminIds: ["u-security-lead"],
    memberIds: ["user-2", "user-3"],
  },
];

const teams: Team[] = [
  {
    id: "team-platform",
    ownerIds: ["user-0"],
    maintainerIds: ["u-platform-owner", "u-platform-maintainer"],
    triagerIds: ["u-triage-lead", "u-sre"],
    memberIds: ["user-4"],
  },
  {
    id: "team-security",
    ownerIds: ["user-3"],
    maintainerIds: ["u-security-lead"],
    triagerIds: ["u-security"],
    memberIds: ["u-sre"],
  },
];

const projects: Project[] = [
  {
    id: "project-core",
    teamIds: ["team-platform", "team-security"],
    triageTeamIds: ["team-platform", "team-security"],
    approverIds: ["u-security"],
  },
  {
    id: "project-checkout",
    teamIds: ["team-platform"],
    triageTeamIds: ["team-platform"],
    approverIds: ["u-sre"],
  },
];

const repositories: Repository[] = [
  {
    id: "repository-0",
    ownerIds: ["user-0"],
    organizationId: "organization-0",
    teamIds: ["team-platform"],
  },
  {
    id: "repo-4",
    ownerIds: ["user-default"],
    organizationId: "organization-0",
    teamIds: ["team-platform"],
  },
  {
    id: "repo-api",
    ownerIds: ["u-platform-owner"],
    organizationId: "organization-0",
    teamIds: ["team-platform"],
  },
  {
    id: "repository-1",
    ownerIds: ["user-1"],
    organizationId: "organization-1",
    teamIds: ["team-security"],
  },
];

const artifacts: Artifact[] = [
  {
    id: "artifact-0",
    projectId: "project-core",
  },
];

const labels: Label[] = [
  {
    id: "label-high",
    reviewerIds: ["u-security"],
  },
  {
    id: "label-low",
    reviewerIds: ["u-qa"],
  },
];

const issues: Issue[] = [
  {
    id: "issue-101",
    reporterId: "u-reporter",
    assigneeId: "u-qa",
    projectId: "project-core",
    labelId: "label-high",
  },
  {
    id: "issue-202",
    reporterId: "u-qa",
    assigneeId: "u-triage-lead",
    projectId: "project-checkout",
    labelId: "label-low",
  },
];

export const usersById = new Map(users.map((user) => [user.id, user] as const));
export const organizationsById = new Map(
  organizations.map((organization) => [organization.id, organization] as const),
);
export const teamsById = new Map(teams.map((team) => [team.id, team] as const));
export const projectsById = new Map(
  projects.map((project) => [project.id, project] as const),
);
export const repositoriesById = new Map(
  repositories.map((repository) => [repository.id, repository] as const),
);
export const artifactsById = new Map(
  artifacts.map((artifact) => [artifact.id, artifact] as const),
);
export const labelsById = new Map(
  labels.map((label) => [label.id, label] as const),
);
export const issuesById = new Map(
  issues.map((issue) => [issue.id, issue] as const),
);

export const resolveType: ResolveType<GithubContext> = (value) => {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  // Each type is identified by a unique required field combination.
  if ("reporterId" in v && "assigneeId" in v) return "issue";
  if ("reviewerIds" in v) return "label";
  if ("projectId" in v) return "artifact";
  if ("organizationId" in v) return "repository";
  if ("triageTeamIds" in v) return "project";
  if ("triagerIds" in v) return "team";
  if ("adminIds" in v) return "organization";
  return "user";
};

export const resolvers: Resolvers<GithubContext> = {
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
      admin(organization: unknown) {
        const org = organization as Organization;
        return org.adminIds.flatMap((id) => {
          const user = usersById.get(id);
          return user !== undefined ? [user] : [];
        });
      },
      member(organization: unknown) {
        const org = organization as Organization;
        return org.memberIds.flatMap((id) => {
          const user = usersById.get(id);
          return user !== undefined ? [user] : [];
        });
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
      owner(team: unknown) {
        const t = team as Team;
        return t.ownerIds.flatMap((id) => {
          const user = usersById.get(id);
          return user !== undefined ? [user] : [];
        });
      },
      maintainer(team: unknown) {
        const t = team as Team;
        return t.maintainerIds.flatMap((id) => {
          const user = usersById.get(id);
          return user !== undefined ? [user] : [];
        });
      },
      triager(team: unknown) {
        const t = team as Team;
        return t.triagerIds.flatMap((id) => {
          const user = usersById.get(id);
          return user !== undefined ? [user] : [];
        });
      },
      member(team: unknown) {
        const t = team as Team;
        return t.memberIds.flatMap((id) => {
          const user = usersById.get(id);
          return user !== undefined ? [user] : [];
        });
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
        const p = project as Project;
        return p.teamIds.flatMap((id) => {
          const team = teamsById.get(id);
          return team !== undefined ? [team] : [];
        });
      },
      triage_team(project: unknown) {
        const p = project as Project;
        return p.triageTeamIds.flatMap((id) => {
          const team = teamsById.get(id);
          return team !== undefined ? [team] : [];
        });
      },
      approver(project: unknown) {
        const p = project as Project;
        return p.approverIds.flatMap((id) => {
          const user = usersById.get(id);
          return user !== undefined ? [user] : [];
        });
      },
      self(project: unknown) {
        const p = project as Project;
        return projectsById.get(p.id) ?? null;
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
      owner(repository: unknown, context: GithubContext) {
        const repo = repository as Repository;
        if (context.shouldReadOwner === false) {
          return [];
        }
        return repo.ownerIds.flatMap((id) => {
          const user = usersById.get(id);
          return user !== undefined ? [user] : [];
        });
      },
      team(repository: unknown) {
        const repo = repository as Repository;
        return repo.teamIds.flatMap((id) => {
          const team = teamsById.get(id);
          return team !== undefined ? [team] : [];
        });
      },
      organization(repository: unknown) {
        const repo = repository as Repository;
        return organizationsById.get(repo.organizationId) ?? null;
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
        const a = artifact as Artifact;
        return projectsById.get(a.projectId) ?? null;
      },
    },
  },
  label: {
    id(value: Label): string {
      return value.id;
    },
    async load(id: string) {
      return labelsById.get(id) ?? null;
    },
    relations: {
      reviewer(label: unknown) {
        const l = label as Label;
        return l.reviewerIds.flatMap((id) => {
          const user = usersById.get(id);
          return user !== undefined ? [user] : [];
        });
      },
    },
  },
  issue: {
    id(value: Issue): string {
      return value.id;
    },
    async load(id: string) {
      return issuesById.get(id) ?? null;
    },
    relations: {
      reporter(issue: unknown) {
        const i = issue as Issue;
        return usersById.get(i.reporterId) ?? null;
      },
      assignee(issue: unknown) {
        const i = issue as Issue;
        return usersById.get(i.assigneeId) ?? null;
      },
      project(issue: unknown) {
        const i = issue as Issue;
        return projectsById.get(i.projectId) ?? null;
      },
      label(issue: unknown) {
        const i = issue as Issue;
        return labelsById.get(i.labelId) ?? null;
      },
    },
  },
};
