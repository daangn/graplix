import { describe, expect, test } from "vitest";
import { createEngine } from "./createEngine";
import * as circularFixture from "./fixtures/circular";
import * as githubFixture from "./fixtures/github";
import * as invalidSchemaFixture from "./fixtures/invalid-schema";

function getOrThrow<T>(map: ReadonlyMap<string, T>, key: string): T {
  const value = map.get(key);
  if (value === undefined) {
    throw new Error(`Test fixture: "${key}" not found`);
  }
  return value;
}

describe("createEngine", () => {
  test("github - organization membership and admin", async () => {
    const engine = createEngine<
      githubFixture.GithubContext,
      githubFixture.GithubEntityInput
    >({
      schema: githubFixture.schema,
      resolvers: githubFixture.resolvers,
      resolveType: githubFixture.resolveType,
    });

    expect(
      await engine.check({
        user: getOrThrow(githubFixture.usersById, "user-0"),
        object: getOrThrow(githubFixture.organizationsById, "organization-0"),
        relation: "member",
        context: {},
      }),
    ).toBe(true);
    expect(
      await engine.check({
        user: getOrThrow(githubFixture.usersById, "u-cto"),
        object: getOrThrow(githubFixture.organizationsById, "organization-0"),
        relation: "admin",
        context: {},
      }),
    ).toBe(true);
    expect(
      await engine.check({
        user: getOrThrow(githubFixture.usersById, "user-4"),
        object: getOrThrow(githubFixture.organizationsById, "organization-0"),
        relation: "member",
        context: {},
      }),
    ).toBe(false);
  });

  test("github - nested from expressions for permissions", async () => {
    const engine = createEngine<
      githubFixture.GithubContext,
      githubFixture.GithubEntityInput
    >({
      schema: githubFixture.schema,
      resolvers: githubFixture.resolvers,
      resolveType: githubFixture.resolveType,
    });

    expect(
      await engine.check({
        user: getOrThrow(githubFixture.usersById, "user-0"),
        object: getOrThrow(githubFixture.repositoriesById, "repository-0"),
        relation: "can_delete",
        context: {},
      }),
    ).toBe(true);
    expect(
      await engine.check({
        user: getOrThrow(githubFixture.usersById, "user-2"),
        object: getOrThrow(githubFixture.repositoriesById, "repository-0"),
        relation: "can_delete",
        context: {},
      }),
    ).toBe(false);
  });

  test("github - multi-hop and self references", async () => {
    const engine = createEngine<
      githubFixture.GithubContext,
      githubFixture.GithubEntityInput
    >({
      schema: githubFixture.schema,
      resolvers: githubFixture.resolvers,
      resolveType: githubFixture.resolveType,
    });

    expect(
      await engine.check({
        user: getOrThrow(githubFixture.usersById, "user-0"),
        object: getOrThrow(githubFixture.artifactsById, "artifact-0"),
        relation: "can_delete",
        context: {},
      }),
    ).toBe(true);
    expect(
      await engine.check({
        user: getOrThrow(githubFixture.usersById, "user-3"),
        object: getOrThrow(githubFixture.artifactsById, "artifact-0"),
        relation: "can_delete",
        context: {},
      }),
    ).toBe(true);
    expect(
      await engine.check({
        user: getOrThrow(githubFixture.usersById, "user-2"),
        object: getOrThrow(githubFixture.artifactsById, "artifact-0"),
        relation: "can_delete",
        context: {},
      }),
    ).toBe(false);
    expect(
      await engine.check({
        user: getOrThrow(githubFixture.projectsById, "project-core"),
        object: getOrThrow(githubFixture.projectsById, "project-core"),
        relation: "self",
        context: {},
      }),
    ).toBe(true);
    expect(
      await engine.check({
        user: getOrThrow(githubFixture.usersById, "user-0"),
        object: getOrThrow(githubFixture.artifactsById, "artifact-0"),
        relation: "can_touch",
        context: {},
      }),
    ).toBe(false);
  });

  test("github - repository collaboration permissions", async () => {
    const engine = createEngine<
      githubFixture.GithubContext,
      githubFixture.GithubEntityInput
    >({
      schema: githubFixture.schema,
      resolvers: githubFixture.resolvers,
      resolveType: githubFixture.resolveType,
    });

    expect(
      await engine.check({
        user: getOrThrow(githubFixture.usersById, "u-platform-owner"),
        object: getOrThrow(githubFixture.repositoriesById, "repo-api"),
        relation: "write",
        context: {},
      }),
    ).toBe(true);
    expect(
      await engine.check({
        user: getOrThrow(githubFixture.usersById, "u-platform-maintainer"),
        object: getOrThrow(githubFixture.repositoriesById, "repo-api"),
        relation: "write",
        context: {},
      }),
    ).toBe(true);
    expect(
      await engine.check({
        user: getOrThrow(githubFixture.usersById, "u-cto"),
        object: getOrThrow(githubFixture.repositoriesById, "repo-api"),
        relation: "admin",
        context: {},
      }),
    ).toBe(true);
    expect(
      await engine.check({
        user: getOrThrow(githubFixture.usersById, "u-platform-owner"),
        object: getOrThrow(githubFixture.repositoriesById, "repo-api"),
        relation: "admin",
        context: {},
      }),
    ).toBe(true);
  });

  test("github - missing relation fields return false", async () => {
    const engine = createEngine<
      githubFixture.GithubContext,
      githubFixture.GithubEntityInput
    >({
      schema: githubFixture.schema,
      resolvers: githubFixture.resolvers,
      resolveType: githubFixture.resolveType,
    });

    expect(
      await engine.check({
        user: getOrThrow(githubFixture.usersById, "user-0"),
        object: getOrThrow(githubFixture.repositoriesById, "repository-0"),
        relation: "resolver_not_found",
        context: {},
      }),
    ).toBe(false);
  });

  test("github - context-aware resolver execution", async () => {
    const engine = createEngine<
      githubFixture.GithubContext,
      githubFixture.GithubEntityInput
    >({
      schema: githubFixture.schema,
      resolvers: githubFixture.resolvers,
      resolveType: githubFixture.resolveType,
    });

    expect(
      await engine.check({
        user: getOrThrow(githubFixture.usersById, "user-default"),
        object: getOrThrow(githubFixture.repositoriesById, "repo-4"),
        relation: "owner",
        context: {},
      }),
    ).toBe(true);
    expect(
      await engine.check({
        user: getOrThrow(githubFixture.usersById, "user-default"),
        object: getOrThrow(githubFixture.repositoriesById, "repo-4"),
        relation: "owner",
        context: { shouldReadOwner: false },
      }),
    ).toBe(false);
  });

  test("github - entity id extraction via resolver", async () => {
    const engine = createEngine<
      githubFixture.GithubContext,
      githubFixture.GithubEntityInput
    >({
      schema: githubFixture.schema,
      resolvers: githubFixture.resolvers,
      resolveType: githubFixture.resolveType,
    });

    expect(
      await engine.check({
        user: getOrThrow(githubFixture.usersById, "user-1"),
        object: getOrThrow(githubFixture.repositoriesById, "repository-1"),
        relation: "owner",
        context: {},
      }),
    ).toBe(true);
  });

  test("github - issue workflow permissions", async () => {
    const engine = createEngine<
      githubFixture.GithubContext,
      githubFixture.GithubEntityInput
    >({
      schema: githubFixture.schema,
      resolvers: githubFixture.resolvers,
      resolveType: githubFixture.resolveType,
    });

    expect(
      await engine.check({
        user: getOrThrow(githubFixture.usersById, "u-qa"),
        object: getOrThrow(githubFixture.issuesById, "issue-101"),
        relation: "can_edit",
        context: {},
      }),
    ).toBe(true);
    expect(
      await engine.check({
        user: getOrThrow(githubFixture.usersById, "u-security"),
        object: getOrThrow(githubFixture.issuesById, "issue-101"),
        relation: "can_approve",
        context: {},
      }),
    ).toBe(true);
    expect(
      await engine.check({
        user: getOrThrow(githubFixture.usersById, "u-reporter"),
        object: getOrThrow(githubFixture.issuesById, "issue-101"),
        relation: "can_close",
        context: {},
      }),
    ).toBe(true);
    expect(
      await engine.check({
        user: getOrThrow(githubFixture.usersById, "u-platform-maintainer"),
        object: getOrThrow(githubFixture.issuesById, "issue-202"),
        relation: "can_edit",
        context: {},
      }),
    ).toBe(false);
  });

  test("github - explain returns matched path when allowed", async () => {
    const engine = createEngine<
      githubFixture.GithubContext,
      githubFixture.GithubEntityInput
    >({
      schema: githubFixture.schema,
      resolvers: githubFixture.resolvers,
      resolveType: githubFixture.resolveType,
    });

    const result = await engine.explain({
      user: getOrThrow(githubFixture.usersById, "user-1"),
      object: getOrThrow(githubFixture.repositoriesById, "repository-1"),
      relation: "owner",
      context: {},
    });

    expect(result.allowed).toBe(true);
    expect(result.matchedPath).not.toBeNull();
    expect(result.matchedPath).toContainEqual(
      expect.objectContaining({
        from: expect.objectContaining({
          type: "repository",
          id: "repository-1",
        }),
        relation: "owner",
        to: expect.objectContaining({ type: "user", id: "user-1" }),
      }),
    );
  });

  test("github - explain returns explored edges when denied", async () => {
    const engine = createEngine<
      githubFixture.GithubContext,
      githubFixture.GithubEntityInput
    >({
      schema: githubFixture.schema,
      resolvers: githubFixture.resolvers,
      resolveType: githubFixture.resolveType,
    });

    const result = await engine.explain({
      user: getOrThrow(githubFixture.usersById, "user-4"),
      object: getOrThrow(githubFixture.repositoriesById, "repo-api"),
      relation: "admin",
      context: {},
    });

    expect(result.allowed).toBe(false);
    expect(result.matchedPath).toBeNull();
    expect(result.exploredEdges.length).toBeGreaterThan(0);
  });

  test("github - accepts domain entity objects via resolver scanning", async () => {
    type Organization = {
      readonly id: string;
      readonly adminIds: readonly string[];
      readonly memberIds: readonly string[];
    };

    const engine = createEngine<
      githubFixture.GithubContext,
      githubFixture.GithubEntityInput
    >({
      schema: githubFixture.schema,
      resolvers: githubFixture.resolvers,
      resolveType: githubFixture.resolveType,
    });

    const org: Organization = {
      id: "organization-0",
      adminIds: ["u-cto"],
      memberIds: ["user-0", "user-1"],
    };

    expect(
      await engine.check({
        user: getOrThrow(githubFixture.usersById, "user-0"),
        object: org,
        relation: "member",
        context: {},
      }),
    ).toBe(true);

    expect(
      await engine.check({
        user: getOrThrow(githubFixture.usersById, "user-4"),
        object: org,
        relation: "member",
        context: {},
      }),
    ).toBe(false);
  });

  test("resolverTimeoutMs - rejects when load exceeds timeout", async () => {
    const baseOrgResolver = githubFixture.resolvers.organization;
    if (baseOrgResolver === undefined) {
      throw new Error("organization resolver not found in fixture");
    }

    const engine = createEngine<
      githubFixture.GithubContext,
      githubFixture.GithubEntityInput
    >({
      schema: githubFixture.schema,
      resolvers: {
        ...githubFixture.resolvers,
        organization: {
          ...baseOrgResolver,
          async load(id, context) {
            await new Promise((resolve) => setTimeout(resolve, 200));
            return baseOrgResolver.load(id, context);
          },
        },
      },
      resolveType: githubFixture.resolveType,
      resolverTimeoutMs: 50,
    });

    await expect(
      engine.check({
        user: getOrThrow(githubFixture.usersById, "user-0"),
        object: getOrThrow(githubFixture.organizationsById, "organization-0"),
        relation: "member",
        context: {},
      }),
    ).rejects.toThrow(/timed out after 50ms/);
  });

  test("resolverTimeoutMs - rejects when relation resolver exceeds timeout", async () => {
    const baseOrgResolver = githubFixture.resolvers.organization;
    if (baseOrgResolver === undefined) {
      throw new Error("organization resolver not found in fixture");
    }

    const engine = createEngine<
      githubFixture.GithubContext,
      githubFixture.GithubEntityInput
    >({
      schema: githubFixture.schema,
      resolvers: {
        ...githubFixture.resolvers,
        organization: {
          ...baseOrgResolver,
          relations: {
            ...baseOrgResolver.relations,
            async member(entity, context) {
              await new Promise((resolve) => setTimeout(resolve, 200));
              return baseOrgResolver.relations?.member?.(entity, context);
            },
          },
        },
      },
      resolveType: githubFixture.resolveType,
      resolverTimeoutMs: 50,
    });

    await expect(
      engine.check({
        user: getOrThrow(githubFixture.usersById, "user-0"),
        object: getOrThrow(githubFixture.organizationsById, "organization-0"),
        relation: "member",
        context: {},
      }),
    ).rejects.toThrow(/timed out after 50ms/);
  });

  test("maxCacheSize - engine still evaluates correctly with small cache", async () => {
    const engine = createEngine<
      githubFixture.GithubContext,
      githubFixture.GithubEntityInput
    >({
      schema: githubFixture.schema,
      resolvers: githubFixture.resolvers,
      resolveType: githubFixture.resolveType,
      maxCacheSize: 1,
    });

    expect(
      await engine.check({
        user: getOrThrow(githubFixture.usersById, "user-0"),
        object: getOrThrow(githubFixture.organizationsById, "organization-0"),
        relation: "member",
        context: {},
      }),
    ).toBe(true);
  });

  test("circular - stops recursive relation cycles", async () => {
    const engine = createEngine<object, circularFixture.Repository>({
      schema: circularFixture.schema,
      resolvers: circularFixture.resolvers,
      resolveType: circularFixture.resolveType,
    });

    expect(
      await engine.check({
        user: getOrThrow(circularFixture.repositoriesById, "repository-cycle"),
        object: getOrThrow(
          circularFixture.repositoriesById,
          "repository-cycle",
        ),
        relation: "a",
        context: {},
      }),
    ).toBe(false);
  });

  test("invalid-schema - rejects invalid schema", async () => {
    const engine = createEngine<object, { id: string }>({
      schema: invalidSchemaFixture.schema,
      resolvers: invalidSchemaFixture.resolvers,
      resolveType: invalidSchemaFixture.resolveType,
    });

    await expect(
      engine.check({
        user: { id: "user-0" },
        object: { id: "repository-0" },
        relation: "owner",
        context: {},
      }),
    ).rejects.toThrow(/Invalid Graplix schema/);
  });
});
