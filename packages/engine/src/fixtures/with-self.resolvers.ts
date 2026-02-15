import type { Resolvers } from "../createEngine";

type Project = {
  readonly id: string;
};

type Artifact = {
  readonly id: string;
  readonly projectId: string;
};

const projects: Project[] = [
  {
    id: "project-0",
  },
];

const artifacts: Artifact[] = [
  {
    id: "artifact-0",
    projectId: "project-0",
  },
];

const projectsById = new Map(
  projects.map((project) => [project.id, project] as const),
);
const artifactsById = new Map(
  artifacts.map((artifact) => [artifact.id, artifact] as const),
);

export const withSelfResolvers: Resolvers = {
  project: {
    id(value: Project): string {
      return value.id;
    },
    async load(id: string) {
      return projectsById.get(id) ?? null;
    },
    relations: {
      self(project: unknown) {
        const projectValue = project as Project;
        return { type: "project", id: projectValue.id };
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
