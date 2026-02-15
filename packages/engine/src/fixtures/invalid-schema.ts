import { readFile } from "node:fs/promises";
import type { Resolvers } from "../createEngine";

export const schema = await readFile(
  new URL("./invalid-schema.graplix", import.meta.url),
  "utf8",
);

export const resolvers: Resolvers = {};
