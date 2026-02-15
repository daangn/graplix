import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseFile, resolve } from "../src/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function fixture(name: string): string {
  return join(__dirname, "fixtures", name);
}

describe("URLSpec Resolver", () => {
  it("should resolve basic spec", async () => {
    const doc = await parseFile(fixture("basic-page.urlspec"));
    const spec = resolve(doc);

    expect(spec.pages).toHaveLength(1);
    expect(spec.pages[0]?.name).toBe("list");
    expect(spec.pages[0]?.path).toBe("/jobs");
  });

  it("should resolve param types", async () => {
    const doc = await parseFile(fixture("param-type-reference.urlspec"));
    const spec = resolve(doc);

    expect(spec.paramTypes).toHaveLength(1);
    expect(spec.paramTypes[0]?.name).toBe("sortOrder");
    expect(spec.paramTypes[0]?.type).toEqual({
      kind: "union",
      values: ["recent", "popular", "trending"],
    });

    // Check that the type reference is resolved
    expect(spec.pages[0]?.parameters[0]?.type).toEqual({
      kind: "union",
      values: ["recent", "popular", "trending"],
    });
  });

  it("should merge global parameters", async () => {
    const doc = await parseFile(fixture("global-merge.urlspec"));
    const spec = resolve(doc);

    expect(spec.global).toHaveLength(2);
    expect(spec.pages[0]?.parameters).toHaveLength(3);

    // Check global params
    expect(spec.pages[0]?.parameters[0]?.name).toBe("utm_source");
    expect(spec.pages[0]?.parameters[0]?.source).toBe("global");
    expect(spec.pages[0]?.parameters[1]?.name).toBe("referrer");
    expect(spec.pages[0]?.parameters[1]?.source).toBe("global");

    // Check page param
    expect(spec.pages[0]?.parameters[2]?.name).toBe("category");
    expect(spec.pages[0]?.parameters[2]?.source).toBe("page");
  });

  it("should resolve path segments", async () => {
    const doc = await parseFile(fixture("path-segments.urlspec"));
    const spec = resolve(doc);

    expect(spec.pages[0]?.path).toBe("/jobs/:job_id/comments/:comment_id");
    expect(spec.pages[0]?.pathSegments).toEqual([
      { type: "static", value: "jobs" },
      { type: "parameter", value: "job_id" },
      { type: "static", value: "comments" },
      { type: "parameter", value: "comment_id" },
    ]);
  });

  it("should resolve all types correctly", async () => {
    const doc = await parseFile(fixture("all-types.urlspec"));
    const spec = resolve(doc);

    const params = spec.pages[0]?.parameters;
    expect(params?.[0]?.type).toEqual({ kind: "string" });
    expect(params?.[1]?.type).toEqual({ kind: "literal", value: "exact" });
    expect(params?.[2]?.type).toEqual({
      kind: "union",
      values: ["a", "b", "c"],
    });
    expect(params?.[3]?.optional).toBeTruthy();
  });

  it("should resolve complete example", async () => {
    const doc = await parseFile(fixture("complete-example.urlspec"));
    const spec = resolve(doc);

    expect(spec.paramTypes).toHaveLength(2);
    expect(spec.global).toHaveLength(2);
    expect(spec.pages).toHaveLength(2);

    // Each page should have global + page params
    expect(spec.pages[0]?.parameters).toHaveLength(4); // 2 global + 2 page
    expect(spec.pages[1]?.parameters).toHaveLength(5); // 2 global + 3 page
  });

  it("should extract descriptions from comments", async () => {
    const doc = await parseFile(fixture("with-descriptions.urlspec"));
    const spec = resolve(doc);

    // Check param type description
    expect(spec.paramTypes[0]?.description).toBe(
      "Sort order for job listings\nUsed to determine how jobs are displayed",
    );

    // Check global parameter descriptions
    expect(spec.global?.[0]?.description).toBe(
      "Referrer source\nIndicates where the user came from",
    );
    expect(spec.global?.[1]?.description).toBe("UTM source parameter");

    // Check page descriptions
    expect(spec.pages[0]?.description).toBe(
      "Job listings page\nDisplays a list of all available jobs",
    );
    expect(spec.pages[1]?.description).toBe(
      "Job detail page\nShows detailed information about a specific job",
    );

    // Check parameter descriptions
    const listPageParams = spec.pages[0]?.parameters;
    // Skip global params (first 2), check page params
    expect(listPageParams?.[2]?.description).toBe("Job category filter");
    expect(listPageParams?.[3]?.description).toBe("Sort order");

    const detailPageParams = spec.pages[1]?.parameters;
    // Skip global params (first 2), check page params
    expect(detailPageParams?.[2]?.description).toBe("Unique job identifier");
    expect(detailPageParams?.[3]?.description).toBe("Preview mode flag");
  });

  it("should parse and resolve example.urlspec file", async () => {
    const doc = await parseFile(fixture("example.urlspec"));
    expect(doc.parseResult.lexerErrors).toHaveLength(0);
    expect(doc.parseResult.parserErrors).toHaveLength(0);

    const spec = resolve(doc);

    // Verify basic structure
    expect(spec.paramTypes).toHaveLength(2);
    expect(spec.pages).toHaveLength(2);

    // Verify descriptions are extracted
    expect(spec.paramTypes[0]?.description).toBeDefined();
    expect(spec.pages[0]?.description).toBeDefined();
    expect(spec.pages[1]?.description).toBeDefined();

    // Verify specific descriptions
    expect(spec.paramTypes[0]?.description).toContain(
      "Sort order for job listings",
    );
    expect(spec.paramTypes[1]?.description).toContain(
      "Status of a job posting",
    );
  });
});
