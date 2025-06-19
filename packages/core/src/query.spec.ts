import DataLoader from "dataloader";
import { vi } from "vitest";
import * as noResolver from "./fixtures/no-resolver";
import * as simple from "./fixtures/simple";
import * as withCircularDependency from "./fixtures/with-circular-dependency";
import * as withDepth from "./fixtures/with-depth";
import * as withHierarchy from "./fixtures/with-hierarchy";
import * as withMultipleDepth from "./fixtures/with-multiple-depth";
import * as withNPlusOne from "./fixtures/with-n+1";
import * as withSelf from "./fixtures/with-self";
import { query } from "./query";

test("query - simple - explicit relation", async () => {
  const graph = await query(simple.input, {
    user: simple.users[0],
    object: simple.houses[0],
    relation: "own",
    context: simple.context,
  });

  const edges = Array.from(graph.edgeEntries());

  expect(edges).toStrictEqual([
    {
      edge: expect.anything(),
      attributes: { relation: "own" },
      source: "House:0",
      target: "User:0",
      sourceAttributes: { node: simple.houses[0], matched: false },
      targetAttributes: { node: simple.users[0], matched: true },
      undirected: false,
    },
    {
      edge: expect.anything(),
      attributes: { relation: "own" },
      source: "House:0",
      target: "User:1",
      sourceAttributes: { node: simple.houses[0], matched: false },
      targetAttributes: { node: simple.users[1], matched: false },
      undirected: false,
    },
  ]);
});

test("query - simple - implicit relation", async () => {
  const graph = await query(simple.input, {
    user: simple.users[0],
    object: simple.houses[0],
    relation: "can_enter",
    context: simple.context,
  });

  const edges = Array.from(graph.edgeEntries());

  expect(edges).toStrictEqual([
    {
      edge: expect.anything(),
      attributes: { relation: "own" },
      source: "House:0",
      target: "User:0",
      sourceAttributes: { node: simple.houses[0], matched: false },
      targetAttributes: { node: simple.users[0], matched: true },
      undirected: false,
    },
    {
      edge: expect.anything(),
      attributes: { relation: "own" },
      source: "House:0",
      target: "User:1",
      sourceAttributes: { node: simple.houses[0], matched: false },
      targetAttributes: { node: simple.users[1], matched: false },
      undirected: false,
    },
  ]);
});

test("query - implicit relation with depth", async () => {
  const graph = await query(withDepth.input, {
    user: withDepth.users[0],
    object: withDepth.repositories[0],
    relation: "can_delete",
    context: withDepth.context,
  });

  const edges = Array.from(graph.edgeEntries());

  expect(edges).toStrictEqual([
    {
      edge: expect.anything(),
      attributes: { relation: "own" },
      source: "Repository:0",
      target: "Organization:0",
      sourceAttributes: { node: withDepth.repositories[0], matched: false },
      targetAttributes: { node: withDepth.organizations[0], matched: false },
      undirected: false,
    },
    {
      edge: expect.anything(),
      attributes: { relation: "member" },
      source: "Organization:0",
      target: "User:0",
      sourceAttributes: { node: withDepth.organizations[0], matched: false },
      targetAttributes: { node: withDepth.users[0], matched: true },
      undirected: false,
    },
  ]);
});

test("query - implicit relation with multiple depth", async () => {
  const graph = await query(withMultipleDepth.input, {
    user: withMultipleDepth.users[0],
    object: withMultipleDepth.artifacts[0],
    relation: "can_delete",
    context: withMultipleDepth.context,
  });

  const edges = Array.from(graph.edgeEntries());

  expect(edges).toStrictEqual([
    {
      edge: expect.anything(),
      attributes: { relation: "parent" },
      source: "Artifact:0",
      target: "Project:0",
      sourceAttributes: {
        node: withMultipleDepth.artifacts[0],
        matched: false,
      },
      targetAttributes: { node: withMultipleDepth.projects[0], matched: false },
      undirected: false,
    },
    {
      edge: expect.anything(),
      attributes: { relation: "parent" },
      source: "Project:0",
      target: "Team:0",
      sourceAttributes: { node: withMultipleDepth.projects[0], matched: false },
      targetAttributes: { node: withMultipleDepth.teams[0], matched: false },
      undirected: false,
    },
    {
      edge: expect.anything(),
      attributes: { relation: "owner" },
      source: "Team:0",
      target: "User:0",
      sourceAttributes: { node: withMultipleDepth.teams[0], matched: false },
      targetAttributes: { node: withMultipleDepth.users[0], matched: true },
      undirected: false,
    },
  ]);
});

test("query - implicit relation with multiple depth - not matched", async () => {
  const graph = await query(withMultipleDepth.input, {
    user: withMultipleDepth.users[1],
    object: withMultipleDepth.artifacts[0],
    relation: "can_delete",
    context: withMultipleDepth.context,
  });

  const edges = Array.from(graph.edgeEntries());

  expect(edges).toStrictEqual([
    {
      edge: expect.anything(),
      attributes: { relation: "parent" },
      source: "Artifact:0",
      target: "Project:0",
      sourceAttributes: {
        node: withMultipleDepth.artifacts[0],
        matched: false,
      },
      targetAttributes: { node: withMultipleDepth.projects[0], matched: false },
      undirected: false,
    },
    {
      edge: expect.anything(),
      attributes: { relation: "parent" },
      source: "Project:0",
      target: "Team:0",
      sourceAttributes: { node: withMultipleDepth.projects[0], matched: false },
      targetAttributes: { node: withMultipleDepth.teams[0], matched: false },
      undirected: false,
    },
    {
      edge: expect.anything(),
      attributes: { relation: "owner" },
      source: "Team:0",
      target: "User:0",
      sourceAttributes: { node: withMultipleDepth.teams[0], matched: false },
      targetAttributes: { node: withMultipleDepth.users[0], matched: false },
      undirected: false,
    },
  ]);
});

test("query - circular dependency", async () => {
  const graph = await query(withCircularDependency.input, {
    context: withCircularDependency.context,
    user: withCircularDependency.users[0],
    object: withCircularDependency.houses[0],
    relation: "a",
  });

  const edges = Array.from(graph.edgeEntries());

  expect(edges).toStrictEqual([]);
});

test("query - with hierarchy", async () => {
  const graph = await query(withHierarchy.input, {
    context: withHierarchy.context,
    user: withHierarchy.users[0],
    object: withHierarchy.houses[0],
    relation: "can_enter",
  });

  const edges = Array.from(graph.edgeEntries());

  expect(edges).toStrictEqual([
    {
      edge: expect.anything(),
      attributes: {
        relation: "member",
      },
      source: "House:0",
      sourceAttributes: {
        matched: false,
        node: withHierarchy.houses[0],
      },
      target: "User:2",
      targetAttributes: {
        matched: false,
        node: withHierarchy.users[2],
      },
      undirected: false,
    },
    {
      edge: expect.anything(),
      attributes: {
        relation: "member",
      },
      source: "House:0",
      sourceAttributes: {
        matched: false,
        node: withHierarchy.houses[0],
      },
      target: "User:3",
      targetAttributes: {
        matched: false,
        node: withHierarchy.users[3],
      },
      undirected: false,
    },
    {
      edge: expect.anything(),
      attributes: {
        relation: "owner",
      },
      source: "House:0",
      sourceAttributes: {
        matched: false,
        node: withHierarchy.houses[0],
      },
      target: "User:0",
      targetAttributes: {
        matched: true,
        node: withHierarchy.users[0],
      },
      undirected: false,
    },
    {
      edge: expect.anything(),
      attributes: {
        relation: "owner",
      },
      source: "House:0",
      sourceAttributes: {
        matched: false,
        node: withHierarchy.houses[0],
      },
      target: "User:1",
      targetAttributes: {
        matched: false,
        node: withHierarchy.users[1],
      },
      undirected: false,
    },
  ]);
});

test("query - with N+1", async () => {
  const batchUsersSpy = vi.fn(withNPlusOne.batchUsers);
  withNPlusOne.context.loaders.user = new DataLoader(batchUsersSpy);

  await query(withNPlusOne.input, {
    context: withNPlusOne.context,
    user: withNPlusOne.users[0],
    object: withNPlusOne.artifacts[0],
    relation: "can_delete",
  });

  /**
   * DataLoader converts multiple requests into a single `batchGet()`.
   * Therefore, it is requested once rather than twice.
   */
  expect(batchUsersSpy).toHaveBeenCalledTimes(1);
  expect(batchUsersSpy).toHaveBeenCalledWith(["0", "2"]);
});

test("query - when resolver not found", async () => {
  const g1 = await query(noResolver.input, {
    context: noResolver.context,
    user: noResolver.users[0],
    object: noResolver.houses[0],
    relation: "resolver_type_not_matched",
  });

  const e1 = Array.from(g1.edgeEntries());

  expect(e1).toStrictEqual([]);

  const g2 = await query(noResolver.input, {
    context: noResolver.context,
    user: noResolver.users[0],
    object: noResolver.houses[0],
    relation: "resolver_not_found",
  });

  const e2 = Array.from(g2.edgeEntries());

  expect(e2).toStrictEqual([]);
});

test("query - self", async () => {
  const g = await query(withSelf.input, {
    context: withSelf.context,
    user: withSelf.projects[0],
    object: withSelf.artifacts[0],
    relation: "can_delete",
  });

  const e = Array.from(g.edgeEntries());

  expect(e).toStrictEqual([
    {
      edge: expect.anything(),
      attributes: { relation: "parent" },
      source: "Artifact:0",
      target: "Project:0",
      sourceAttributes: { node: withSelf.artifacts[0], matched: false },
      targetAttributes: { node: withSelf.projects[0], matched: true },
      undirected: false,
    },
    {
      edge: expect.anything(),
      attributes: { relation: "self" },
      source: "Project:0",
      target: "Project:0",
      sourceAttributes: { node: withSelf.projects[0], matched: true },
      targetAttributes: { node: withSelf.projects[0], matched: true },
      undirected: false,
    },
  ]);
});
