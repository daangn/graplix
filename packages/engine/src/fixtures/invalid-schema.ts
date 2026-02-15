import { readFile } from "node:fs/promises";
import type { Resolvers } from "../Resolvers";
import type { ResolveType } from "../ResolveType";

export const schema = await readFile(
  new URL("./invalid-schema.graplix", import.meta.url),
  "utf8",
);

export const resolveType: ResolveType = () => null;

export const resolvers: Resolvers = {};
