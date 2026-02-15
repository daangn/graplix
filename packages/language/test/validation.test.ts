import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseFile } from "../src/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function fixture(name: string): string {
  return join(__dirname, "fixtures", name);
}

describe("URLSpec Validation", () => {
  describe("Parameter key naming validation", () => {
    it("should accept parameter keys in snake_case", async () => {
      const doc = await parseFile(
        fixture("validation-param-snake-case.urlspec"),
      );

      expect(doc.parseResult.lexerErrors).toHaveLength(0);
      expect(doc.parseResult.parserErrors).toHaveLength(0);
      expect(doc.diagnostics ?? []).toHaveLength(0);
    });

    it("should accept parameter keys in camelCase", async () => {
      const doc = await parseFile(
        fixture("validation-param-camelCase-invalid.urlspec"),
      );

      // Parameter naming restriction has been removed
      expect(doc.parseResult.lexerErrors).toHaveLength(0);
      expect(doc.parseResult.parserErrors).toHaveLength(0);
      expect(doc.diagnostics ?? []).toHaveLength(0);
    });

    it("should accept parameter keys in PascalCase", async () => {
      const doc = await parseFile(
        fixture("validation-param-PascalCase-invalid.urlspec"),
      );

      expect(doc.parseResult.lexerErrors).toHaveLength(0);
      expect(doc.parseResult.parserErrors).toHaveLength(0);
      expect(doc.diagnostics ?? []).toHaveLength(0);
    });

    it("should accept parameter keys with mixed case", async () => {
      const doc = await parseFile(
        fixture("validation-param-mixed-case-invalid.urlspec"),
      );

      expect(doc.parseResult.lexerErrors).toHaveLength(0);
      expect(doc.parseResult.parserErrors).toHaveLength(0);
      expect(doc.diagnostics ?? []).toHaveLength(0);
    });

    it("should accept parameter keys starting with uppercase", async () => {
      const doc = await parseFile(
        fixture("validation-param-uppercase-start-invalid.urlspec"),
      );

      expect(doc.parseResult.lexerErrors).toHaveLength(0);
      expect(doc.parseResult.parserErrors).toHaveLength(0);
      expect(doc.diagnostics ?? []).toHaveLength(0);
    });

    it("should accept global parameter keys in snake_case", async () => {
      const doc = await parseFile(
        fixture("validation-global-snake-case.urlspec"),
      );

      expect(doc.parseResult.lexerErrors).toHaveLength(0);
      expect(doc.parseResult.parserErrors).toHaveLength(0);
      expect(doc.diagnostics ?? []).toHaveLength(0);
    });

    it("should accept global parameter keys in camelCase", async () => {
      const doc = await parseFile(
        fixture("validation-global-camelCase-invalid.urlspec"),
      );

      expect(doc.parseResult.lexerErrors).toHaveLength(0);
      expect(doc.parseResult.parserErrors).toHaveLength(0);
      expect(doc.diagnostics ?? []).toHaveLength(0);
    });
  });

  describe("ParamType alias naming validation", () => {
    it("should accept ParamType names in camelCase", async () => {
      const doc = await parseFile(
        fixture("validation-paramtype-camelCase.urlspec"),
      );

      expect(doc.parseResult.lexerErrors).toHaveLength(0);
      expect(doc.parseResult.parserErrors).toHaveLength(0);
      expect(doc.diagnostics ?? []).toHaveLength(0);
    });
  });

  describe("Path parameter validation", () => {
    it("should require path parameters to be declared in parameter block", async () => {
      const doc = await parseFile(
        fixture("validation-path-param-missing.urlspec"),
      );

      // Should have validation error for missing job_id declaration
      expect(doc.diagnostics?.length ?? 0).toBeGreaterThan(0);
      const errors = doc.diagnostics?.filter((d) => d.severity === 1) ?? [];
      expect(errors.length).toBeGreaterThan(0);

      // Check that the error message mentions the missing path parameter
      const hasJobIdError = errors.some((e) => e.message.includes("job_id"));
      expect(hasJobIdError).toBe(true);
    });

    it("should accept path parameters when declared in parameter block", async () => {
      const doc = await parseFile(
        fixture("validation-path-param-declared.urlspec"),
      );

      expect(doc.parseResult.lexerErrors).toHaveLength(0);
      expect(doc.parseResult.parserErrors).toHaveLength(0);
      expect(doc.diagnostics ?? []).toHaveLength(0);
    });

    it("should require all path parameters to be declared", async () => {
      const doc = await parseFile(
        fixture("validation-path-param-multiple-missing.urlspec"),
      );

      // Should have validation error for missing comment_id declaration
      expect(doc.diagnostics?.length ?? 0).toBeGreaterThan(0);
      const errors = doc.diagnostics?.filter((d) => d.severity === 1) ?? [];
      expect(errors.length).toBeGreaterThan(0);

      const hasCommentIdError = errors.some((e) =>
        e.message.includes("comment_id"),
      );
      expect(hasCommentIdError).toBe(true);
    });

    it("should accept multiple path parameters when all are declared", async () => {
      const doc = await parseFile(
        fixture("validation-path-param-multiple-declared.urlspec"),
      );

      expect(doc.parseResult.lexerErrors).toHaveLength(0);
      expect(doc.parseResult.parserErrors).toHaveLength(0);
      expect(doc.diagnostics ?? []).toHaveLength(0);
    });

    it("should accept path parameter in any naming convention", async () => {
      const doc = await parseFile(
        fixture("validation-path-param-camelCase-invalid.urlspec"),
      );

      // Parameter naming restriction has been removed
      expect(doc.parseResult.lexerErrors).toHaveLength(0);
      expect(doc.parseResult.parserErrors).toHaveLength(0);
      expect(doc.diagnostics ?? []).toHaveLength(0);
    });
  });

  describe("Combined validation scenarios", () => {
    it("should validate path parameter declaration", async () => {
      const doc = await parseFile(
        fixture("validation-combined-invalid.urlspec"),
      );

      expect(doc.diagnostics?.length ?? 0).toBeGreaterThan(0);
      const errors = doc.diagnostics?.filter((d) => d.severity === 1) ?? [];

      // Should have at least 1 error: missing job_id (parameter naming is no longer restricted)
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });

    it("should accept valid specification with all rules followed", async () => {
      const doc = await parseFile(fixture("validation-combined-valid.urlspec"));

      expect(doc.parseResult.lexerErrors).toHaveLength(0);
      expect(doc.parseResult.parserErrors).toHaveLength(0);
      expect(doc.diagnostics ?? []).toHaveLength(0);
    });
  });
});
