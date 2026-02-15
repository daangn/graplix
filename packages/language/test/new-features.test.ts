import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseFile } from "../src/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function fixture(name: string): string {
  return join(__dirname, "fixtures", name);
}

describe("URLSpec New Features", () => {
  it("should parse numeric path segments like /404", async () => {
    const doc = await parseFile(fixture("numeric-path.urlspec"));
    expect(doc.parseResult.lexerErrors).toHaveLength(0);
    expect(doc.parseResult.parserErrors).toHaveLength(0);

    const model = doc.parseResult.value;
    expect(model.pages).toHaveLength(1);
    expect(model.pages[0]?.name).toBe("notFound");
    expect(model.pages[0]?.path.segments).toHaveLength(1);
    expect(model.pages[0]?.path.segments[0]?.static).toBe("/404");
  });

  it("should allow 'page' as parameter name", async () => {
    const doc = await parseFile(fixture("page-param.urlspec"));
    expect(doc.parseResult.lexerErrors).toHaveLength(0);
    expect(doc.parseResult.parserErrors).toHaveLength(0);

    const model = doc.parseResult.value;
    expect(model.pages).toHaveLength(1);
    expect(model.pages[0]?.parameters).toHaveLength(1);
    expect(model.pages[0]?.parameters[0]?.name).toBe("page");
  });

  it("should allow all keywords as parameter names", async () => {
    const doc = await parseFile(fixture("keyword-params.urlspec"));
    expect(doc.parseResult.lexerErrors).toHaveLength(0);
    expect(doc.parseResult.parserErrors).toHaveLength(0);

    const model = doc.parseResult.value;
    expect(model.pages).toHaveLength(2);

    // Check list page parameters
    const listPage = model.pages[0];
    expect(listPage?.name).toBe("list");
    expect(listPage?.parameters).toHaveLength(4);
    expect(listPage?.parameters.map((p) => p.name)).toEqual([
      "page",
      "param",
      "global",
      "string",
    ]);

    // Check detail page with :page path parameter
    const detailPage = model.pages[1];
    expect(detailPage?.name).toBe("detail");
    expect(detailPage?.path.segments[1]?.parameter).toBe("page");
    expect(detailPage?.parameters[0]?.name).toBe("page");
  });
});

it("should parse root path /", async () => {
  const doc = await parseFile(fixture("root-path.urlspec"));
  expect(doc.parseResult.lexerErrors).toHaveLength(0);
  expect(doc.parseResult.parserErrors).toHaveLength(0);

  const model = doc.parseResult.value;
  expect(model.pages).toHaveLength(1);
  expect(model.pages[0]?.name).toBe("home");
  expect(model.pages[0]?.path.root).toBe("/");
  expect(model.pages[0]?.path.segments).toEqual([]);
});
