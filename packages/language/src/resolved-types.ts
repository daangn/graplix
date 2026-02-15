/**
 * Resolved (user-friendly) types for URLSpec
 * These are the types that users of the library will work with
 */

export interface ResolvedURLSpec {
  paramTypes: ResolvedParamType[];
  pages: ResolvedPage[];
  global?: ResolvedParameter[] | undefined;
}

export interface ResolvedParamType {
  name: string;
  type: ResolvedType;
  description?: string;
}

export interface ResolvedPage {
  name: string;
  path: string;
  pathSegments: ResolvedPathSegment[];
  parameters: ResolvedParameter[];
  description?: string;
}

export interface ResolvedPathSegment {
  type: "static" | "parameter";
  value: string;
}

export interface ResolvedParameter {
  name: string;
  optional: boolean;
  type: ResolvedType;
  source: "global" | "page";
  description?: string;
}

export type ResolvedType =
  | { kind: "string" }
  | { kind: "literal"; value: string }
  | { kind: "union"; values: string[] };
