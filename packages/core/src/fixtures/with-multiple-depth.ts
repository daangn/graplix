import DataLoader from "dataloader";
import type { GraplixInput } from "../GraplixInput";
import type { GraplixResolvers } from "../GraplixResolvers";
import type { GraplixSchema } from "../GraplixSchema";
import { filterNonError } from "../utils";

type Artifact = {
  type: "Artifact";
  entityId: string;
  entityName: "Artifact";
  state: {
    projectId: string;
  };
};

type Project = {
  type: "Project";
  entityId: string;
  entityName: "Project";
  state: {
    teamId: string;
  };
};

type Team = {
  type: "Team";
  entityId: string;
  entityName: "Team";
  state: {
    members: Array<{
      userId: string;
      role: "Owner" | "Member";
    }>;
  };
};

type User = {
  type: "User";
  entityId: string;
  entityName: "User";
  state: {};
};

type ObjectTypeMap = {
  Artifact: Artifact;
  Project: Project;
  Team: Team;
  User: User;
};

export const artifacts: Artifact[] = [
  {
    type: "Artifact",
    entityId: "0",
    entityName: "Artifact",
    state: {
      projectId: "0",
    },
  },
];

export const projects: Project[] = [
  {
    type: "Project",
    entityId: "0",
    entityName: "Project",
    state: {
      teamId: "0",
    },
  },
];

export const teams: Team[] = [
  {
    type: "Team",
    entityId: "0",
    entityName: "Team",
    state: {
      members: [
        { userId: "0", role: "Owner" },
        { userId: "1", role: "Member" },
      ],
    },
  },
];

export const users: User[] = [
  { type: "User", entityId: "0", entityName: "User", state: {} },
  { type: "User", entityId: "1", entityName: "User", state: {} },
  { type: "User", entityId: "2", entityName: "User", state: {} },
  { type: "User", entityId: "3", entityName: "User", state: {} },
];

type Context = {
  loaders: {
    artifact: DataLoader<string, Artifact>;
    project: DataLoader<string, Project>;
    team: DataLoader<string, Team>;
    user: DataLoader<string, User>;
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
    team: new DataLoader<string, Team>(async (ids) => {
      return teams.filter((a) => ids.includes(a.entityId));
    }),
    user: new DataLoader<string, User>(async (ids) => {
      return users.filter((a) => ids.includes(a.entityId));
    }),
  },
};

export const schema: GraplixSchema<ObjectTypeMap> = {
  Artifact: {
    parent: {
      type: "Project",
    },
    can_delete: {
      when: "owner",
      from: "parent",
    },
  },
  Project: {
    parent: {
      type: "Team",
    },
    owner: {
      when: "owner",
      from: "parent",
    },
  },
  Team: {
    owner: {
      type: "User",
    },
    member: {
      type: "User",
    },
  },
  User: {},
};

export const resolvers: GraplixResolvers<Context, ObjectTypeMap> = {
  Artifact: {
    identify: (entity) => entity.entityId,
    relations: {
      parent: {
        type: "Project",
        async resolve(artifact, ctx) {
          return ctx.loaders.project.load(artifact.state.projectId);
        },
      },
    },
  },

  Project: {
    identify: (entity) => entity.entityId,
    relations: {
      parent: {
        type: "Team",
        async resolve(project, ctx) {
          return ctx.loaders.team.load(project.state.teamId);
        },
      },
    },
  },
  Team: {
    identify: (entity) => entity.entityId,
    relations: {
      owner: {
        type: "User",
        async resolve(team, ctx) {
          const users = await ctx.loaders.user
            .loadMany(
              team.state.members
                .filter(({ role }) => role === "Owner")
                .map(({ userId }) => userId),
            )
            .then(filterNonError);

          return users;
        },
      },
      member: {
        type: "User",
        async resolve(team, ctx) {
          const users = await ctx.loaders.user
            .loadMany(
              team.state.members
                .filter(({ role }) => role === "Member")
                .map(({ userId }) => userId),
            )
            .then(filterNonError);

          return users;
        },
      },
    },
  },
  User: {
    identify: (entity) => entity.entityId,
  },
};

export const input: GraplixInput<Context, ObjectTypeMap> = {
  schema,
  resolvers,
};
