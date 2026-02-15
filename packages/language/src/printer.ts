import type { LangiumDocument } from "langium";
import type {
  PageDeclaration,
  ParameterDeclaration,
  PathSegment,
  StringKeyword,
  StringLiteralType,
  Type,
  TypeReference,
  UnionType,
  URLSpecDocument,
} from "./__generated__/ast";

/**
 * Print Langium AST back to .urlspec format
 */
export function print(doc: LangiumDocument<URLSpecDocument>): string {
  const model = doc.parseResult.value;
  const lines: string[] = [];

  // Param types
  if (model.paramTypes.length > 0) {
    for (const paramType of model.paramTypes) {
      lines.push(`param ${paramType.name} = ${printType(paramType.type)};`);
    }
    lines.push("");
  }

  // Global block
  if (model.global) {
    lines.push("global {");
    for (const param of model.global.parameters) {
      lines.push(`  ${printParameter(param)}`);
    }
    lines.push("}");
    lines.push("");
  }

  // Pages
  for (const page of model.pages) {
    lines.push(printPage(page));
    lines.push("");
  }

  return `${lines.join("\n").trim()}\n`;
}

function printPage(page: PageDeclaration): string {
  const lines: string[] = [];

  const path = page.path.root
    ? "/"
    : page.path.segments.map(printPathSegment).join("");
  lines.push(`page ${page.name} = ${path} {`);

  for (const param of page.parameters) {
    lines.push(`  ${printParameter(param)}`);
  }

  lines.push("}");

  return lines.join("\n");
}

function printPathSegment(segment: PathSegment): string {
  if (segment.static) {
    // PATH_SEGMENT now includes the leading slash
    return segment.static;
  }
  if (segment.parameter) {
    return `/:${segment.parameter}`;
  }
  return "";
}

function printParameter(param: ParameterDeclaration): string {
  const optional = param.optional ? "?" : "";
  return `${param.name}${optional}: ${printType(param.type)};`;
}

function printType(type: Type): string {
  if (isStringKeyword(type)) {
    return "string";
  }

  if (isStringLiteralType(type)) {
    // Keep the quotes in the string literal value
    return type.value.startsWith('"') ? type.value : `"${type.value}"`;
  }

  if (isUnionType(type)) {
    return type.types
      .map((t) => (t.value.startsWith('"') ? t.value : `"${t.value}"`))
      .join(" | ");
  }

  if (isTypeReference(type)) {
    return type.ref?.$refText || "unknown";
  }

  return "unknown";
}

// Type guards
function isStringKeyword(type: Type): type is StringKeyword {
  return "$type" in type && type.$type === "StringKeyword";
}

function isStringLiteralType(type: Type): type is StringLiteralType {
  return "$type" in type && type.$type === "StringLiteralType";
}

function isUnionType(type: Type): type is UnionType {
  return "$type" in type && type.$type === "UnionType";
}

function isTypeReference(type: Type): type is TypeReference {
  return "$type" in type && type.$type === "TypeReference";
}
