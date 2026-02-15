import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseFile } from "../src/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function fixture(name: string): string {
  return join(__dirname, "fixtures", name);
}

describe("URLSpec Parser", () => {
  it("should parse basic page", async () => {
    const doc = await parseFile(fixture("basic-page.urlspec"));
    expect(doc.parseResult.lexerErrors).toHaveLength(0);
    expect(doc.parseResult.parserErrors).toHaveLength(0);

    const model = doc.parseResult.value;
    expect(model.pages).toHaveLength(1);
  });

  it("should parse param types", async () => {
    const doc = await parseFile(fixture("param-types.urlspec"));
    expect(doc.parseResult.lexerErrors).toHaveLength(0);
    expect(doc.parseResult.parserErrors).toHaveLength(0);

    const model = doc.parseResult.value;
    expect(model.paramTypes).toHaveLength(2);
    expect(model.paramTypes[0]?.name).toBe("sortOrder");
    expect(model.paramTypes[1]?.name).toBe("jobStatus");
  });

  it("should parse global block", async () => {
    const doc = await parseFile(fixture("global-block.urlspec"));
    expect(doc.parseResult.lexerErrors).toHaveLength(0);
    expect(doc.parseResult.parserErrors).toHaveLength(0);

    const model = doc.parseResult.value;
    expect(model.global).toBeDefined();
    expect(model.global?.parameters).toHaveLength(2);
  });

  it("should parse page declarations", async () => {
    const doc = await parseFile(fixture("page-declarations.urlspec"));
    expect(doc.parseResult.lexerErrors).toHaveLength(0);
    expect(doc.parseResult.parserErrors).toHaveLength(0);

    const model = doc.parseResult.value;
    expect(model.pages).toHaveLength(2);
    expect(model.pages[0]?.name).toBe("list");
    expect(model.pages[1]?.name).toBe("detail");

    // Check path segments
    const listPath = model.pages[0]?.path;
    expect(listPath?.segments).toHaveLength(1);
    expect(listPath?.segments[0]?.static).toBe("/jobs");

    const detailPath = model.pages[1]?.path;
    expect(detailPath?.segments).toHaveLength(2);
    expect(detailPath?.segments[0]?.static).toBe("/jobs");
    expect(detailPath?.segments[1]?.parameter).toBe("job_id");
  });

  it("should parse complete example", async () => {
    const doc = await parseFile(fixture("complete-example.urlspec"));
    expect(doc.parseResult.lexerErrors).toHaveLength(0);
    expect(doc.parseResult.parserErrors).toHaveLength(0);

    const model = doc.parseResult.value;
    expect(model.paramTypes).toHaveLength(2);
    expect(model.global).toBeDefined();
    expect(model.pages).toHaveLength(2);
  });

  it("should parse spec with comments", async () => {
    const doc = await parseFile(fixture("with-comments.urlspec"));
    expect(doc.parseResult.lexerErrors).toHaveLength(0);
    expect(doc.parseResult.parserErrors).toHaveLength(0);

    const model = doc.parseResult.value;
    expect(model.paramTypes).toHaveLength(1);
    expect(model.pages).toHaveLength(1);
  });
});
