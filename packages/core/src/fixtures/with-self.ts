import DataLoader from "dataloader";
import type { GraplixInput } from "../GraplixInput";
import type { GraplixResolvers } from "../GraplixResolvers";
import type { GraplixSchema } from "../GraplixSchema";

type Artifact = {
  entityId: string;
  entityName: "Artifact";
  state: {
    projectId: string;
  };
};

type Project = {
  entityId: string;
  entityName: "Project";
  state: {
    teamId: string;
  };
};

type ObjectTypeMap = {
  Artifact: Artifact;
  Project: Project;
};

export const artifacts: Artifact[] = [
  {
    entityId: "0",
    entityName: "Artifact",
    state: {
      projectId: "0",
    },
  },
];

export const projects: Project[] = [
  {
    entityId: "0",
    entityName: "Project",
    state: {
      teamId: "0",
    },
  },
];

type Context = {
  loaders: {
    artifact: DataLoader<string, Artifact>;
    project: DataLoader<string, Project>;
  };
};

export const context: Context = {
  loaders: {
    artifact: new DataLoader<string, Artifact>(async (ids) => {
      return artifacts.filter((a) => ids.includes(a.entityId));
    }),
    project: new DataLoader<string, Project>(async (ids) => {
      return projects.filter((a) => ids.includes(a.entityId));
    }),
  },
};

export const schema: GraplixSchema<ObjectTypeMap> = {
  Project: {
    self: {
      type: "Project",
    },
  },
  Artifact: {
    parent: {
      type: "Project",
    },
    can_delete: {
      when: "self",
      from: "parent",
    },
  },
};

export const resolvers: GraplixResolvers<Context, ObjectTypeMap> = {
  Project: {
    self: {
      type: "Project",
      async resolve(obj) {
        return obj;
      },
    },
  },
  Artifact: {
    parent: {
      type: "Project",
      async resolve(obj, ctx) {
        return ctx.loaders.project.load(obj.state.projectId);
      },
    },
  },
};

export const input: GraplixInput<Context, ObjectTypeMap> = {
  schema,
  resolvers,
  identify(obj) {
    return {
      type: obj.entityName,
      id: obj.entityId,
    };
  },
};
