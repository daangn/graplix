import { readFile } from "node:fs/promises";
import { EntityRef } from "../private/EntityRef";
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


export const resolveType: ResolveType<GithubContext> = () => null;

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
        const organizationValue = organization as Organization;
        return organizationValue.adminIds.map((id) => new EntityRef("user", id));
      },
      member(organization: unknown) {
        const organizationValue = organization as Organization;
        return organizationValue.memberIds.map((id) => new EntityRef("user", id));
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
        const teamValue = team as Team;
        return teamValue.ownerIds.map((id) => new EntityRef("user", id));
      },
      maintainer(team: unknown) {
        const teamValue = team as Team;
        return teamValue.maintainerIds.map((id) => new EntityRef("user", id));
      },
      triager(team: unknown) {
        const teamValue = team as Team;
        return teamValue.triagerIds.map((id) => new EntityRef("user", id));
      },
      member(team: unknown) {
        const teamValue = team as Team;
        return teamValue.memberIds.map((id) => new EntityRef("user", id));
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
        return projectValue.teamIds.map((id) => new EntityRef("team", id));
      },
      triage_team(project: unknown) {
        const projectValue = project as Project;
        return projectValue.triageTeamIds.map((id) => new EntityRef("team", id));
      },
      approver(project: unknown) {
        const projectValue = project as Project;
        return projectValue.approverIds.map((id) => new EntityRef("user", id));
      },
      self(project: unknown) {
        const projectValue = project as Project;
        return new EntityRef("project", projectValue.id);
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
        const repositoryValue = repository as Repository;
        if (context.shouldReadOwner === false) {
          return [];
        }

        return repositoryValue.ownerIds.map((id) => new EntityRef("user", id));
      },
      team(repository: unknown) {
        const repositoryValue = repository as Repository;
        return repositoryValue.teamIds.map((id) => new EntityRef("team", id));
      },
      organization(repository: unknown) {
        const repositoryValue = repository as Repository;
        return new EntityRef("organization", repositoryValue.organizationId);
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
        return new EntityRef("project", artifactValue.projectId);
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
        const labelValue = label as Label;
        return labelValue.reviewerIds.map((id) => new EntityRef("user", id));
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
        const issueValue = issue as Issue;
        return new EntityRef("user", issueValue.reporterId);
      },
      assignee(issue: unknown) {
        const issueValue = issue as Issue;
        return new EntityRef("user", issueValue.assigneeId);
      },
      project(issue: unknown) {
        const issueValue = issue as Issue;
        return new EntityRef("project", issueValue.projectId);
      },
      label(issue: unknown) {
        const issueValue = issue as Issue;
        return new EntityRef("label", issueValue.labelId);
      },
    },
  },
};
