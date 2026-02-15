import { readFile } from "node:fs/promises";
import { describe, expect, test } from "vitest";

import { parse } from "./parse";

const loadFixture = async (filename: string): Promise<string> =>
  readFile(new URL(`./fixtures/${filename}`, import.meta.url), "utf8");

describe("graplix-parse", () => {
  test("parses valid content into a document", async () => {
    const content = await loadFixture("valid.graplix");
    const document = await parse(content);
    const firstType = document.parseResult.value.types[0];
    const repositoryType = document.parseResult.value.types[2];

    expect(document.parseResult.value.types).toHaveLength(3);
    expect(firstType).toBeDefined();
    expect(document.diagnostics).toHaveLength(0);
    expect(repositoryType).toBeDefined();
    expect(repositoryType?.name).toBe("repository");
  });

  test("parses and validates errors into diagnostics", async () => {
    const content = await loadFixture("invalid-type-reference.graplix");
    const document = await parse(content);

    expect(document.diagnostics).toHaveLength(1);
    expect(document.diagnostics?.[0]?.message).toBe(
      'Type "organization" is not declared in this schema.',
    );
  });

  test("parses valid relation expression syntax", async () => {
    const content = await loadFixture("valid-relation-expression-or.graplix");
    const document = await parse(content);
    const repositoryType = document.parseResult.value.types[2];

    expect(document.parseResult.value.types).toHaveLength(3);
    expect(repositoryType).toBeDefined();
    expect(repositoryType?.name).toBe("repository");
    expect(document.diagnostics).toHaveLength(0);
  });

  test("supports skipping validation for parse-only mode", async () => {
    const content = await loadFixture("invalid-type-reference.graplix");
    const document = await parse(content, { validation: false });

    expect(document.diagnostics ?? []).toHaveLength(0);
  });
});
