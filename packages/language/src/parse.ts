import type { LangiumDocument } from "langium";
import { NodeFileSystem } from "langium/node";
import { URI } from "vscode-uri";

import type { GraplixDocument } from "./__generated__/ast";
import { createGraplixServices } from "./services";

export interface GraplixParseOptions {
  readonly documentUri?: string;
  readonly validation?: boolean;
}

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
