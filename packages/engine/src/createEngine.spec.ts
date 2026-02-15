import { readFile } from "node:fs/promises";
import { describe, expect, test } from "vitest";

import type { ResolverContext, Resolvers } from "./createEngine";
import { createEngine } from "./createEngine";

import { issuePriorityWorkflowResolvers } from "./fixtures/issue-priority-workflow.resolvers";
import { noResolverResolvers } from "./fixtures/no-resolver.resolvers";
import { repoCollaborationResolvers } from "./fixtures/repo-collaboration.resolvers";
import { simpleResolvers } from "./fixtures/simple.resolvers";
import { withCircularDependencyResolvers } from "./fixtures/with-circular-dependency.resolvers";
import type { WithContextContext } from "./fixtures/with-context.resolvers";
import { withContextResolvers } from "./fixtures/with-context.resolvers";
import { withDepthResolvers } from "./fixtures/with-depth.resolvers";
import { withHierarchyResolvers } from "./fixtures/with-hierarchy.resolvers";
import { withIdInferenceResolvers } from "./fixtures/with-id-inference.resolvers";
import { withMultipleDepthResolvers } from "./fixtures/with-multiple-depth.resolvers";
import { withNPlusOneResolvers } from "./fixtures/with-n+1.resolvers";
import { withSelfResolvers } from "./fixtures/with-self.resolvers";

const readFixtureSchema = async (filename: string): Promise<string> =>
  readFile(new URL(`./fixtures/${filename}`, import.meta.url), "utf8");

const createEngineFromFixture = async <TContext extends ResolverContext = {}>(
  filename: string,
  resolvers: Resolvers<TContext>,
) =>
  createEngine<TContext>({
    schema: await readFixtureSchema(filename),
    resolvers,
  });

describe("createEngine", () => {
  test("evaluates direct relations", async () => {
    const engine = await createEngineFromFixture(
      "simple.graplix",
      simpleResolvers,
    );

    await expect(
      engine.check({
        user: { type: "user", id: "user-0" },
        object: { type: "house", id: "house-0" },
        relation: "can_enter",
      }),
    ).resolves.toBe(true);

    await expect(
      engine.check({
        user: { type: "user", id: "user-2" },
        object: { type: "house", id: "house-0" },
        relation: "can_enter",
      }),
    ).resolves.toBe(false);
  });

  test("evaluates OR composition", async () => {
    const engine = await createEngineFromFixture(
      "with-hierarchy.graplix",
      withHierarchyResolvers,
    );

    await expect(
      engine.check({
        user: { type: "user", id: "user-0" },
        object: { type: "house", id: "house-1" },
        relation: "can_enter",
      }),
    ).resolves.toBe(true);

    await expect(
      engine.check({
        user: { type: "user", id: "user-2" },
        object: { type: "house", id: "house-1" },
        relation: "can_enter",
      }),
    ).resolves.toBe(true);

    await expect(
      engine.check({
        user: { type: "user", id: "user-3" },
        object: { type: "house", id: "house-1" },
        relation: "can_enter",
      }),
    ).resolves.toBe(false);
  });

  test("evaluates relation `from` chains", async () => {
    const engine = await createEngineFromFixture(
      "with-depth.graplix",
      withDepthResolvers,
    );

    await expect(
      engine.check({
        user: { type: "user", id: "user-0" },
        object: { type: "repository", id: "repository-0" },
        relation: "can_delete",
      }),
    ).resolves.toBe(true);

    await expect(
      engine.check({
        user: { type: "user", id: "user-2" },
        object: { type: "repository", id: "repository-0" },
        relation: "can_delete",
      }),
    ).resolves.toBe(false);
  });

  test("evaluates nested `from` traversal", async () => {
    const engine = await createEngineFromFixture(
      "with-multiple-depth.graplix",
      withMultipleDepthResolvers,
    );

    await expect(
      engine.check({
        user: { type: "user", id: "user-0" },
        object: { type: "artifact", id: "artifact-0" },
        relation: "can_delete",
      }),
    ).resolves.toBe(true);

    await expect(
      engine.check({
        user: { type: "user", id: "user-2" },
        object: { type: "artifact", id: "artifact-0" },
        relation: "can_delete",
      }),
    ).resolves.toBe(false);
  });

  test("evaluates `from` across N+1 relation values", async () => {
    const engine = await createEngineFromFixture(
      "with-n+1.graplix",
      withNPlusOneResolvers,
    );

    await expect(
      engine.check({
        user: { type: "user", id: "user-0" },
        object: { type: "artifact", id: "artifact-0" },
        relation: "can_delete",
      }),
    ).resolves.toBe(true);

    await expect(
      engine.check({
        user: { type: "user", id: "user-3" },
        object: { type: "artifact", id: "artifact-0" },
        relation: "can_delete",
      }),
    ).resolves.toBe(true);

    await expect(
      engine.check({
        user: { type: "user", id: "user-4" },
        object: { type: "artifact", id: "artifact-0" },
        relation: "can_delete",
      }),
    ).resolves.toBe(false);
  });

  test("handles self-relation sources and short-circuits safely", async () => {
    const engine = await createEngineFromFixture(
      "with-self.graplix",
      withSelfResolvers,
    );

    await expect(
      engine.check({
        user: { type: "project", id: "project-0" },
        object: { type: "project", id: "project-0" },
        relation: "self",
      }),
    ).resolves.toBe(true);

    await expect(
      engine.check({
        user: { type: "user", id: "user-0" },
        object: { type: "artifact", id: "artifact-0" },
        relation: "can_touch",
      }),
    ).resolves.toBe(false);
  });

  test("prevents circular relation evaluation loops", async () => {
    const engine = await createEngineFromFixture(
      "with-circular-dependency.graplix",
      withCircularDependencyResolvers,
    );

    await expect(
      engine.check({
        user: { type: "repository", id: "repository-cycle" },
        object: { type: "repository", id: "repository-cycle" },
        relation: "a",
      }),
    ).resolves.toBe(false);
  });

  test("filters resolver values by declared target types", async () => {
    const engine = await createEngineFromFixture(
      "no-resolver.graplix",
      noResolverResolvers,
    );

    await expect(
      engine.check({
        user: { type: "user", id: "user-0" },
        object: { type: "house", id: "house-0" },
        relation: "resolver_type_not_matched",
      }),
    ).resolves.toBe(false);

    await expect(
      engine.check({
        user: { type: "user", id: "user-0" },
        object: { type: "house", id: "house-0" },
        relation: "resolver_not_found",
      }),
    ).resolves.toBe(false);
  });

  test("passes query context to resolvers", async () => {
    const engine = await createEngineFromFixture<WithContextContext>(
      "with-context.graplix",
      withContextResolvers,
    );

    await expect(
      engine.check({
        user: { type: "user", id: "user-default" },
        object: { type: "repository", id: "repo-4" },
        relation: "owner",
      }),
    ).resolves.toBe(true);

    await expect(
      engine.check({
        user: { type: "user", id: "user-default" },
        object: { type: "repository", id: "repo-4" },
        relation: "owner",
        context: { shouldReadOwner: false },
      }),
    ).resolves.toBe(false);
  });

  test("infers entity type from non-id field pairs", async () => {
    const engine = await createEngineFromFixture(
      "with-id-inference.graplix",
      withIdInferenceResolvers,
    );

    await expect(
      engine.check({
        user: { entityId: "user-1" },
        object: { type: "repository", id: "repository-1" },
        relation: "owner",
      }),
    ).resolves.toBe(true);
  });

  test("evaluates repository collaboration permissions", async () => {
    const engine = await createEngineFromFixture(
      "repo-collaboration.graplix",
      repoCollaborationResolvers,
    );

    await expect(
      engine.check({
        user: { type: "user", id: "u-platform-owner" },
        object: { type: "repository", id: "repo-api" },
        relation: "write",
      }),
    ).resolves.toBe(true);

    await expect(
      engine.check({
        user: { type: "user", id: "u-platform-maintainer" },
        object: { type: "repository", id: "repo-api" },
        relation: "write",
      }),
    ).resolves.toBe(true);

    await expect(
      engine.check({
        user: { type: "user", id: "u-cto" },
        object: { type: "repository", id: "repo-api" },
        relation: "admin",
      }),
    ).resolves.toBe(true);

    await expect(
      engine.check({
        user: { type: "user", id: "u-platform-owner" },
        object: { type: "repository", id: "repo-api" },
        relation: "admin",
      }),
    ).resolves.toBe(true);
  });

  test("evaluates issue priority workflow permissions", async () => {
    const engine = await createEngineFromFixture(
      "issue-priority-workflow.graplix",
      issuePriorityWorkflowResolvers,
    );

    await expect(
      engine.check({
        user: { type: "user", id: "u-qa" },
        object: { type: "issue", id: "issue-101" },
        relation: "can_edit",
      }),
    ).resolves.toBe(true);

    await expect(
      engine.check({
        user: { type: "user", id: "u-security" },
        object: { type: "issue", id: "issue-101" },
        relation: "can_approve",
      }),
    ).resolves.toBe(true);

    await expect(
      engine.check({
        user: { type: "user", id: "u-reporter" },
        object: { type: "issue", id: "issue-101" },
        relation: "can_close",
      }),
    ).resolves.toBe(true);

    await expect(
      engine.check({
        user: { type: "user", id: "u-platform-maintainer" },
        object: { type: "issue", id: "issue-202" },
        relation: "can_edit",
      }),
    ).resolves.toBe(false);
  });

  test("rejects invalid schemas before evaluation", async () => {
    const engine = await createEngineFromFixture(
      "invalid-type-reference.graplix",
      {},
    );

    await expect(
      engine.check({
        user: { type: "user", id: "user-0" },
        object: { type: "repository", id: "repository-0" },
        relation: "owner",
      }),
    ).rejects.toThrow(/Invalid Graplix schema/);
  });
});
