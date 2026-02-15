import { readFile } from "node:fs/promises";
import { NodeFileSystem } from "langium/node";
import { validationHelper } from "langium/test";
import { describe, expect, test } from "vitest";
import type { GraplixDocument } from "./__generated__/ast";
import { createGraplixServices } from "./services";

const loadFixture = async (filename: string): Promise<string> =>
  readFile(new URL(`./fixtures/${filename}`, import.meta.url), "utf8");

const services = createGraplixServices({ ...NodeFileSystem });
const validate = validationHelper<GraplixDocument>(services.Graplix);

describe("graplix-validator", () => {
  test("does not report errors for valid references", async () => {
    const content = await loadFixture("valid.graplix");
    const { diagnostics = [] } = await validate(content);

    expect(diagnostics).toHaveLength(0);
  });

  test("reports undefined type references in brackets", async () => {
    const content = await loadFixture("undefined-type.graplix");
    const { diagnostics = [] } = await validate(content);

    expect(diagnostics).toHaveLength(1);
    const diagnostic = diagnostics[0];

    expect(diagnostic).toBeDefined();
    expect(diagnostic?.message).toBe(
      'Type "organization" is not declared in this schema.',
    );
  });

  test("reports undefined relation names in computed relations", async () => {
    const content = await loadFixture("undefined-relation.graplix");
    const { diagnostics = [] } = await validate(content);

    expect(diagnostics).toHaveLength(1);
    const diagnostic = diagnostics[0];

    expect(diagnostic).toBeDefined();
    expect(diagnostic?.message).toBe(
      'Relation "maintainer" is not declared in type "repository".',
    );
  });

  test("reports undefined relation names in from clauses", async () => {
    const content = await loadFixture("undefined-relation-source.graplix");
    const { diagnostics = [] } = await validate(content);

    expect(diagnostics).toHaveLength(1);
    const diagnostic = diagnostics[0];

    expect(diagnostic).toBeDefined();
    expect(diagnostic?.message).toBe(
      'Relation source "contributor" is not declared in type "repository".',
    );
  });
});
