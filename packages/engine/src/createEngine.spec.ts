import { describe, expect, test } from "vitest";
import { createEngine } from "./createEngine";
import * as circularFixture from "./fixtures/circular";
import * as githubFixture from "./fixtures/github";
import * as invalidSchemaFixture from "./fixtures/invalid-schema";

describe("createEngine", () => {
  test("github - organization membership and admin", async () => {
    const engine = createEngine({
      schema: githubFixture.schema,
      resolvers: githubFixture.resolvers,
      resolveType: githubFixture.resolveType,
    });

    expect(
      await engine.check({
        user: { type: "user", id: "user-0" },
        object: { type: "organization", id: "organization-0" },
        relation: "member",
      }),
    ).toBe(true);
    expect(
      await engine.check({
        user: { type: "user", id: "u-cto" },
        object: { type: "organization", id: "organization-0" },
        relation: "admin",
      }),
    ).toBe(true);
    expect(
      await engine.check({
        user: { type: "user", id: "user-4" },
        object: { type: "organization", id: "organization-0" },
        relation: "member",
      }),
    ).toBe(false);
  });

  test("github - nested from expressions for permissions", async () => {
    const engine = createEngine({
      schema: githubFixture.schema,
      resolvers: githubFixture.resolvers,
      resolveType: githubFixture.resolveType,
    });

    expect(
      await engine.check({
        user: { type: "user", id: "user-0" },
        object: { type: "repository", id: "repository-0" },
        relation: "can_delete",
      }),
    ).toBe(true);
    expect(
      await engine.check({
        user: { type: "user", id: "user-2" },
        object: { type: "repository", id: "repository-0" },
        relation: "can_delete",
      }),
    ).toBe(false);
  });

  test("github - multi-hop and self references", async () => {
    const engine = createEngine({
      schema: githubFixture.schema,
      resolvers: githubFixture.resolvers,
      resolveType: githubFixture.resolveType,
    });

    expect(
      await engine.check({
        user: { type: "user", id: "user-0" },
        object: { type: "artifact", id: "artifact-0" },
        relation: "can_delete",
      }),
    ).toBe(true);
    expect(
      await engine.check({
        user: { type: "user", id: "user-3" },
        object: { type: "artifact", id: "artifact-0" },
        relation: "can_delete",
      }),
    ).toBe(true);
    expect(
      await engine.check({
        user: { type: "user", id: "user-2" },
        object: { type: "artifact", id: "artifact-0" },
        relation: "can_delete",
      }),
    ).toBe(false);
    expect(
      await engine.check({
        user: { type: "project", id: "project-core" },
        object: { type: "project", id: "project-core" },
        relation: "self",
      }),
    ).toBe(true);
    expect(
      await engine.check({
        user: { type: "user", id: "user-0" },
        object: { type: "artifact", id: "artifact-0" },
        relation: "can_touch",
      }),
    ).toBe(false);
  });

  test("github - repository collaboration permissions", async () => {
    const engine = createEngine({
      schema: githubFixture.schema,
      resolvers: githubFixture.resolvers,
      resolveType: githubFixture.resolveType,
    });

    expect(
      await engine.check({
        user: { type: "user", id: "u-platform-owner" },
        object: { type: "repository", id: "repo-api" },
        relation: "write",
      }),
    ).toBe(true);
    expect(
      await engine.check({
        user: { type: "user", id: "u-platform-maintainer" },
        object: { type: "repository", id: "repo-api" },
        relation: "write",
      }),
    ).toBe(true);
    expect(
      await engine.check({
        user: { type: "user", id: "u-cto" },
        object: { type: "repository", id: "repo-api" },
        relation: "admin",
      }),
    ).toBe(true);
    expect(
      await engine.check({
        user: { type: "user", id: "u-platform-owner" },
        object: { type: "repository", id: "repo-api" },
        relation: "admin",
      }),
    ).toBe(true);
  });

  test("github - missing relation fields return false", async () => {
    const engine = createEngine({
      schema: githubFixture.schema,
      resolvers: githubFixture.resolvers,
      resolveType: githubFixture.resolveType,
    });

    expect(
      await engine.check({
        user: { type: "user", id: "user-0" },
        object: { type: "repository", id: "repository-0" },
        relation: "resolver_not_found",
      }),
    ).toBe(false);
  });

  test("github - context-aware resolver execution", async () => {
    const engine = createEngine<githubFixture.GithubContext>({
      schema: githubFixture.schema,
      resolvers: githubFixture.resolvers,
      resolveType: githubFixture.resolveType,
    });

    expect(
      await engine.check({
        user: { type: "user", id: "user-default" },
        object: { type: "repository", id: "repo-4" },
        relation: "owner",
      }),
    ).toBe(true);
    expect(
      await engine.check({
        user: { type: "user", id: "user-default" },
        object: { type: "repository", id: "repo-4" },
        relation: "owner",
        context: { shouldReadOwner: false },
      }),
    ).toBe(false);
  });

  test("github - supports EntityRef inputs", async () => {
    const engine = createEngine({
      schema: githubFixture.schema,
      resolvers: githubFixture.resolvers,
      resolveType: githubFixture.resolveType,
    });

    expect(
      await engine.check({
        user: { type: "user", id: "user-1" },
        object: { type: "repository", id: "repository-1" },
        relation: "owner",
      }),
    ).toBe(true);
  });

  test("github - accepts EntityRef inputs", async () => {
    const engine = createEngine({
      schema: githubFixture.schema,
      resolvers: githubFixture.resolvers,
      resolveType: githubFixture.resolveType,
    });

    expect(
      await engine.check({
        user: { type: "user", id: "user-0" },
        object: { type: "repository", id: "repository-0" },
        relation: "owner",
      }),
    ).toBe(true);
  });

  test("github - issue workflow permissions", async () => {
    const engine = createEngine({
      schema: githubFixture.schema,
      resolvers: githubFixture.resolvers,
      resolveType: githubFixture.resolveType,
    });

    expect(
      await engine.check({
        user: { type: "user", id: "u-qa" },
        object: { type: "issue", id: "issue-101" },
        relation: "can_edit",
      }),
    ).toBe(true);
    expect(
      await engine.check({
        user: { type: "user", id: "u-security" },
        object: { type: "issue", id: "issue-101" },
        relation: "can_approve",
      }),
    ).toBe(true);
    expect(
      await engine.check({
        user: { type: "user", id: "u-reporter" },
        object: { type: "issue", id: "issue-101" },
        relation: "can_close",
      }),
    ).toBe(true);
    expect(
      await engine.check({
        user: { type: "user", id: "u-platform-maintainer" },
        object: { type: "issue", id: "issue-202" },
        relation: "can_edit",
      }),
    ).toBe(false);
  });

  test("github - explain returns matched path when allowed", async () => {
    const engine = createEngine({
      schema: githubFixture.schema,
      resolvers: githubFixture.resolvers,
      resolveType: githubFixture.resolveType,
    });

    const result = await engine.explain({
      user: { type: "user", id: "user-1" },
      object: { type: "repository", id: "repository-1" },
      relation: "owner",
    });

    expect(result.allowed).toBe(true);
    expect(result.matchedPath).not.toBeNull();
    expect(result.matchedPath).toContainEqual({
      from: { type: "repository", id: "repository-1" },
      relation: "owner",
      to: { type: "user", id: "user-1" },
    });
  });

  test("github - explain returns explored edges when denied", async () => {
    const engine = createEngine({
      schema: githubFixture.schema,
      resolvers: githubFixture.resolvers,
      resolveType: githubFixture.resolveType,
    });

    const result = await engine.explain({
      user: { type: "user", id: "user-4" },
      object: { type: "repository", id: "repo-api" },
      relation: "admin",
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

    const engine = createEngine<githubFixture.GithubContext, Organization>({
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
        user: { type: "user", id: "user-0" },
        object: org,
        relation: "member",
      }),
    ).toBe(true);

    expect(
      await engine.check({
        user: { type: "user", id: "user-4" },
        object: org,
        relation: "member",
      }),
    ).toBe(false);
  });

  test("resolverTimeoutMs - rejects when load exceeds timeout", async () => {
    // biome-ignore lint/style/noNonNullAssertion: organization resolver is defined in the fixture
    const baseOrgResolver = githubFixture.resolvers.organization!;
    const engine = createEngine({
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
        user: { type: "user", id: "user-0" },
        object: { type: "organization", id: "organization-0" },
        relation: "member",
      }),
    ).rejects.toThrow(/timed out after 50ms/);
  });

  test("resolverTimeoutMs - rejects when relation resolver exceeds timeout", async () => {
    // biome-ignore lint/style/noNonNullAssertion: organization resolver is defined in the fixture
    const baseOrgResolver = githubFixture.resolvers.organization!;
    const engine = createEngine({
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
        user: { type: "user", id: "user-0" },
        object: { type: "organization", id: "organization-0" },
        relation: "member",
      }),
    ).rejects.toThrow(/timed out after 50ms/);
  });

  test("maxCacheSize - engine still evaluates correctly with small cache", async () => {
    const engine = createEngine({
      schema: githubFixture.schema,
      resolvers: githubFixture.resolvers,
      resolveType: githubFixture.resolveType,
      maxCacheSize: 1,
    });

    expect(
      await engine.check({
        user: { type: "user", id: "user-0" },
        object: { type: "organization", id: "organization-0" },
        relation: "member",
      }),
    ).toBe(true);
  });

  test("circular - stops recursive relation cycles", async () => {
    const engine = createEngine({
      schema: circularFixture.schema,
      resolvers: circularFixture.resolvers,
      resolveType: circularFixture.resolveType,
    });

    expect(
      await engine.check({
        user: { type: "repository", id: "repository-cycle" },
        object: { type: "repository", id: "repository-cycle" },
        relation: "a",
      }),
    ).toBe(false);
  });

  test("invalid-schema - rejects invalid schema", async () => {
    const engine = createEngine({
      schema: invalidSchemaFixture.schema,
      resolvers: invalidSchemaFixture.resolvers,
      resolveType: invalidSchemaFixture.resolveType,
    });

    await expect(
      engine.check({
        user: { type: "user", id: "user-0" },
        object: { type: "repository", id: "repository-0" },
        relation: "owner",
      }),
    ).rejects.toThrow(/Invalid Graplix schema/);
  });
});
