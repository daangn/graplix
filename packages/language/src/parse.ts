import type { LangiumDocument } from "langium";
import { NodeFileSystem } from "langium/node";
import { URI } from "vscode-uri";

import type { GraplixDocument } from "./__generated__/ast";
import { createGraplixServices } from "./services";

/**
 * Parsing options for in-memory Graplix text.
 */
export interface GraplixParseOptions {
  readonly documentUri?: string;
  readonly validation?: boolean;
}

/**
 * Parses Graplix source text into a Langium document.
 */
export async function parse(
  text: string,
  {
    documentUri = "memory://graplix/graplix.graplix",
    validation = true,
  }: GraplixParseOptions = {},
): Promise<LangiumDocument<GraplixDocument>> {
  const { shared } = createGraplixServices({ ...NodeFileSystem });
  const document =
    shared.workspace.LangiumDocumentFactory.fromString<GraplixDocument>(
      text,
      URI.parse(documentUri),
    );
  await shared.workspace.DocumentBuilder.build([document], { validation });

  return document;
}
