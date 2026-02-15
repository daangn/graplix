import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseFile, print } from "../src/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function fixture(name: string): string {
  return join(__dirname, "fixtures", name);
}

describe("URLSpec Printer", () => {
  it("should print and parse roundtrip", async () => {
    const doc1 = await parseFile(fixture("complete-example.urlspec"));
    const printed = print(doc1);

    // Parse again
    const doc2 = await parseFile(fixture("complete-example.urlspec"));

    // Should have no errors
    expect(doc2.parseResult.lexerErrors).toHaveLength(0);
    expect(doc2.parseResult.parserErrors).toHaveLength(0);

    // Print doc1 and doc2 - should be identical
    const printed2 = print(doc2);
    expect(printed2).toBe(printed);
  });

  it("should print basic spec", async () => {
    const doc = await parseFile(fixture("printer-basic.urlspec"));
    const printed = print(doc);

    expect(printed).not.toContain("namespace");
    expect(printed).toContain("page home = /home {");
    expect(printed).toContain("query?: string;");
  });

  it("should print path parameters", async () => {
    const doc = await parseFile(fixture("printer-path-params.urlspec"));
    const printed = print(doc);

    expect(printed).toContain("/items/:item_id");
  });
});
