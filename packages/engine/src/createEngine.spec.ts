import { describe, expect, test } from "vitest";
import { createEngine } from "./createEngine";
import * as circularFixture from "./fixtures/circular";
import * as githubFixture from "./fixtures/github";
import * as invalidSchemaFixture from "./fixtures/invalid-schema";

describe("createEngine", () => {
  test("github - direct house membership and OR composition", async () => {
    const engine = createEngine({
      schema: githubFixture.schema,
      resolvers: githubFixture.resolvers,
      resolveType: githubFixture.resolveType,
    });

    expect(
      await engine.check({
        user: "user:user-0",
        object: "house:house-0",
        relation: "can_enter",
      }),
    ).toBe(true);
    expect(
      await engine.check({
        user: "user:user-2",
        object: "house:house-0",
        relation: "can_enter",
      }),
    ).toBe(true);
    expect(
      await engine.check({
        user: "user:user-4",
        object: "house:house-0",
        relation: "can_enter",
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
        user: "user:user-0",
        object: "repository:repository-0",
        relation: "can_delete",
      }),
    ).toBe(true);
    expect(
      await engine.check({
        user: "user:user-2",
        object: "repository:repository-0",
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
        user: "user:user-0",
        object: "artifact:artifact-0",
        relation: "can_delete",
      }),
    ).toBe(true);
    expect(
      await engine.check({
        user: "user:user-3",
        object: "artifact:artifact-0",
        relation: "can_delete",
      }),
    ).toBe(true);
    expect(
      await engine.check({
        user: "user:user-2",
        object: "artifact:artifact-0",
        relation: "can_delete",
      }),
    ).toBe(false);
    expect(
      await engine.check({
        user: "project:project-core",
        object: "project:project-core",
        relation: "self",
      }),
    ).toBe(true);
    expect(
      await engine.check({
        user: "user:user-0",
        object: "artifact:artifact-0",
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
        user: "user:u-platform-owner",
        object: "repository:repo-api",
        relation: "write",
      }),
    ).toBe(true);
    expect(
      await engine.check({
        user: "user:u-platform-maintainer",
        object: "repository:repo-api",
        relation: "write",
      }),
    ).toBe(true);
    expect(
      await engine.check({
        user: "user:u-cto",
        object: "repository:repo-api",
        relation: "admin",
      }),
    ).toBe(true);
    expect(
      await engine.check({
        user: "user:u-platform-owner",
        object: "repository:repo-api",
        relation: "admin",
      }),
    ).toBe(true);
  });

  test("github - resolver filters and missing relation fields", async () => {
    const engine = createEngine({
      schema: githubFixture.schema,
      resolvers: githubFixture.resolvers,
      resolveType: githubFixture.resolveType,
    });

    expect(
      await engine.check({
        user: "user:user-0",
        object: "house:house-0",
        relation: "resolver_type_not_matched",
      }),
    ).toBe(false);
    expect(
      await engine.check({
        user: "user:user-0",
        object: "house:house-0",
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
        user: "user:user-default",
        object: "repository:repo-4",
        relation: "owner",
      }),
    ).toBe(true);
    expect(
      await engine.check({
        user: "user:user-default",
        object: "repository:repo-4",
        relation: "owner",
        context: { shouldReadOwner: false },
      }),
    ).toBe(false);
  });

  test("github - supports type:id inputs", async () => {
    const engine = createEngine({
      schema: githubFixture.schema,
      resolvers: githubFixture.resolvers,
      resolveType: githubFixture.resolveType,
    });

    expect(
      await engine.check({
        user: "user:user-1",
        object: "repository:repository-1",
        relation: "owner",
      }),
    ).toBe(true);
  });

  test("github - accepts type:id string inputs", async () => {
    const engine = createEngine({
      schema: githubFixture.schema,
      resolvers: githubFixture.resolvers,
      resolveType: githubFixture.resolveType,
    });

    expect(
      await engine.check({
        user: "user:user-0",
        object: "house:house-0",
        relation: "can_enter",
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
        user: "user:u-qa",
        object: "issue:issue-101",
        relation: "can_edit",
      }),
    ).toBe(true);
    expect(
      await engine.check({
        user: "user:u-security",
        object: "issue:issue-101",
        relation: "can_approve",
      }),
    ).toBe(true);
    expect(
      await engine.check({
        user: "user:u-reporter",
        object: "issue:issue-101",
        relation: "can_close",
      }),
    ).toBe(true);
    expect(
      await engine.check({
        user: "user:u-platform-maintainer",
        object: "issue:issue-202",
        relation: "can_edit",
      }),
    ).toBe(false);
  });

  test("circular - stops recursive relation cycles", async () => {
    const engine = createEngine({
      schema: circularFixture.schema,
      resolvers: circularFixture.resolvers,
      resolveType: circularFixture.resolveType,
    });

    expect(
      await engine.check({
        user: "repository:repository-cycle",
        object: "repository:repository-cycle",
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
        user: "user:user-0",
        object: "repository:repository-0",
        relation: "owner",
      }),
    ).rejects.toThrow(/Invalid Graplix schema/);
  });
});
