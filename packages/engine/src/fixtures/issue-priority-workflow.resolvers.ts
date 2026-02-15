import type { Resolvers } from "../createEngine";

type User = {
  readonly id: string;
};

type Team = {
  readonly id: string;
  readonly triagerIds: readonly string[];
};

type Label = {
  readonly id: string;
  readonly reviewerIds: readonly string[];
};

type Project = {
  readonly id: string;
  readonly triageTeamIds: readonly string[];
  readonly approverIds: readonly string[];
};

type Issue = {
  readonly id: string;
  readonly reporterId: string;
  readonly assigneeId: string;
  readonly projectId: string;
  readonly labelId: string;
};

const users: User[] = [
  { id: "u-reporter" },
  { id: "u-triage-lead" },
  { id: "u-sre" },
  { id: "u-security" },
  { id: "u-qa" },
];

const teams: Team[] = [
  { id: "team-platform", triagerIds: ["u-triage-lead", "u-sre"] },
  { id: "team-security", triagerIds: ["u-security"] },
];

const labels: Label[] = [
  { id: "label-high", reviewerIds: ["u-security"] },
  { id: "label-low", reviewerIds: ["u-qa"] },
];

const projects: Project[] = [
  {
    id: "project-payments",
    triageTeamIds: ["team-platform", "team-security"],
    approverIds: ["u-security"],
  },
  {
    id: "project-checkout",
    triageTeamIds: ["team-platform"],
    approverIds: ["u-sre"],
  },
];

const issues: Issue[] = [
  {
    id: "issue-101",
    reporterId: "u-reporter",
    assigneeId: "u-qa",
    projectId: "project-payments",
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

const usersById = new Map(users.map((user) => [user.id, user] as const));
const teamsById = new Map(teams.map((team) => [team.id, team] as const));
const labelsById = new Map(labels.map((label) => [label.id, label] as const));
const projectsById = new Map(
  projects.map((project) => [project.id, project] as const),
);
const issuesById = new Map(issues.map((issue) => [issue.id, issue] as const));

export const issuePriorityWorkflowResolvers: Resolvers = {
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
      triager(team: unknown) {
        const teamEntity = team as Team;
        return teamEntity.triagerIds.map((id: string) => ({
          type: "user",
          id,
        }));
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
        const labelEntity = label as Label;
        return labelEntity.reviewerIds.map((id: string) => ({
          type: "user",
          id,
        }));
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
      triage_team(project: unknown) {
        const projectEntity = project as Project;
        return projectEntity.triageTeamIds.map((id: string) => ({
          type: "team",
          id,
        }));
      },
      approver(project: unknown) {
        const projectEntity = project as Project;
        return projectEntity.approverIds.map((id: string) => ({
          type: "user",
          id,
        }));
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
        const issueEntity = issue as Issue;
        return { type: "user", id: issueEntity.reporterId };
      },
      assignee(issue: unknown) {
        const issueEntity = issue as Issue;
        return { type: "user", id: issueEntity.assigneeId };
      },
      project(issue: unknown) {
        const issueEntity = issue as Issue;
        return { type: "project", id: issueEntity.projectId };
      },
      label(issue: unknown) {
        const issueEntity = issue as Issue;
        return { type: "label", id: issueEntity.labelId };
      },
    },
  },
};
