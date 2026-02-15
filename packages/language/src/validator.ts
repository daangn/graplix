import type { ValidationAcceptor, ValidationChecks } from "langium";
import type { URLSpecAstType } from "./__generated__/ast";
import type { URLSpecServices } from "./services";

/**
 * Validation checks for the URLSpec language.
 *
 * Note: Naming conventions (camelCase for page/param types)
 * are enforced at the AST level here.
 */
export class URLSpecValidator {
  registerChecks(_services: URLSpecServices): ValidationChecks<URLSpecAstType> {
    const checks: ValidationChecks<URLSpecAstType> = {
      ParamTypeDeclaration: this.checkParamTypeNaming,
      PageDeclaration: this.checkPageDeclaration,
    };
    return checks;
  }

  /**
   * Validate param type names follow camelCase convention.
   */
  checkParamTypeNaming = (
    paramType: URLSpecAstType["ParamTypeDeclaration"],
    accept: ValidationAcceptor,
  ): void => {
    const camelCasePattern = /^[a-z][a-zA-Z0-9]*$/;

    if (!camelCasePattern.test(paramType.name)) {
      accept(
        "error",
        "Param type names must be in camelCase format (start with lowercase letter, followed by letters and numbers only).",
        {
          node: paramType,
          property: "name",
        },
      );
    }
  };

  /**
   * Validate page declarations:
   * 1. Page names must be in camelCase
   * 2. All path parameters must be declared in the parameter block
   */
  checkPageDeclaration = (
    page: URLSpecAstType["PageDeclaration"],
    accept: ValidationAcceptor,
  ): void => {
    // Check page name is camelCase
    const camelCasePattern = /^[a-z][a-zA-Z0-9]*$/;
    if (!camelCasePattern.test(page.name)) {
      accept(
        "error",
        "Page names must be in camelCase format (start with lowercase letter, followed by letters and numbers only).",
        {
          node: page,
          property: "name",
        },
      );
    }

    // Extract path parameter names from the path
    const pathParams = new Set<string>();
    if (page.path.segments) {
      for (const segment of page.path.segments) {
        if (segment.parameter) {
          pathParams.add(segment.parameter);
        }
      }
    }

    // Check if all path parameters are declared in the parameter block
    const declaredParams = new Set(page.parameters.map((p) => p.name));

    for (const pathParam of pathParams) {
      if (!declaredParams.has(pathParam)) {
        accept(
          "error",
          `Path parameter '${pathParam}' must be declared in the parameter block.`,
          {
            node: page,
            property: "path",
          },
        );
      }
    }
  };
}
