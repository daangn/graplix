import * as path from "node:path";
import { parse } from "@graplix/language";
import * as vscode from "vscode";
import {
  LanguageClient,
  type LanguageClientOptions,
  type ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";

let client: LanguageClient;
const validationTimers = new Map<string, ReturnType<typeof setTimeout>>();
let outputChannel: vscode.OutputChannel | undefined;

interface GraplixTemplate {
  readonly startOffset: number;
  readonly endOffset: number;
  readonly content: string;
  readonly hasInterpolation: boolean;
}

function extractGraplixTemplates(text: string): readonly GraplixTemplate[] {
  const templates: GraplixTemplate[] = [];
  const tag = "graplix";

  const isIdentifierCharacter = (char: string | undefined): boolean => {
    return char !== undefined && /[A-Za-z0-9_$]/.test(char);
  };

  const skipWhitespaceAndComments = (startIndex: number): number => {
    let index = startIndex;

    while (index < text.length) {
      const char = text[index];
      const next = text[index + 1];

      if (char === " " || char === "\t" || char === "\r" || char === "\n") {
        index += 1;
        continue;
      }

      if (char === "/" && next === "/") {
        index += 2;
        while (index < text.length && text[index] !== "\n") {
          index += 1;
        }
        continue;
      }

      if (char === "/" && next === "*") {
        index += 2;
        while (index + 1 < text.length) {
          if (text[index] === "*" && text[index + 1] === "/") {
            index += 2;
            break;
          }
          index += 1;
        }
        continue;
      }

      break;
    }

    return index;
  };

  let searchIndex = 0;

  while (searchIndex < text.length) {
    const matchIndex = text.indexOf(tag, searchIndex);
    if (matchIndex < 0) {
      break;
    }

    const previous = text[matchIndex - 1];
    const nextAfterTag = text[matchIndex + tag.length];
    if (
      isIdentifierCharacter(previous) ||
      isIdentifierCharacter(nextAfterTag)
    ) {
      searchIndex = matchIndex + tag.length;
      continue;
    }

    const templateDelimiterIndex = skipWhitespaceAndComments(
      matchIndex + tag.length,
    );
    if (text[templateDelimiterIndex] !== "`") {
      searchIndex = matchIndex + tag.length;
      continue;
    }

    const templateStart = templateDelimiterIndex + 1;
    let cursor = templateStart;
    let hasInterpolation = false;

    while (cursor < text.length) {
      const char = text[cursor];

      if (char === "\\") {
        cursor += 2;
        continue;
      }

      if (char === "$" && text[cursor + 1] === "{") {
        hasInterpolation = true;
        cursor += 2;
        let interpolationDepth = 1;

        while (cursor < text.length && interpolationDepth > 0) {
          const interpolationChar = text[cursor];
          if (interpolationChar === "\\") {
            cursor += 2;
            continue;
          }
          if (interpolationChar === "{") {
            interpolationDepth += 1;
          } else if (interpolationChar === "}") {
            interpolationDepth -= 1;
          }
          cursor += 1;
        }

        continue;
      }

      if (char === "`") {
        templates.push({
          startOffset: templateStart,
          endOffset: cursor,
          content: text.slice(templateStart, cursor),
          hasInterpolation,
        });
        break;
      }

      cursor += 1;
    }

    searchIndex = cursor + 1;
  }

  return templates;
}

function severityToVscode(
  severity: number | undefined,
): vscode.DiagnosticSeverity {
  if (severity === 1) {
    return vscode.DiagnosticSeverity.Error;
  }
  if (severity === 2) {
    return vscode.DiagnosticSeverity.Warning;
  }
  if (severity === 3) {
    return vscode.DiagnosticSeverity.Information;
  }
  if (severity === 4) {
    return vscode.DiagnosticSeverity.Hint;
  }

  return vscode.DiagnosticSeverity.Error;
}

async function validateGraplixTemplates(
  document: vscode.TextDocument,
  collection: vscode.DiagnosticCollection,
): Promise<void> {
  if (
    document.languageId !== "typescript" &&
    document.languageId !== "typescriptreact"
  ) {
    collection.delete(document.uri);
    return;
  }

  const version = document.version;
  const templates = extractGraplixTemplates(document.getText());
  const diagnostics: vscode.Diagnostic[] = [];

  for (const [index, template] of templates.entries()) {
    const startPosition = document.positionAt(template.startOffset);

    if (template.hasInterpolation) {
      const interpolationDiagnostic = new vscode.Diagnostic(
        new vscode.Range(
          startPosition,
          document.positionAt(template.endOffset),
        ),
        "graplix tagged template with interpolation is not validated.",
        vscode.DiagnosticSeverity.Warning,
      );
      interpolationDiagnostic.source = "graplix";
      diagnostics.push(interpolationDiagnostic);
      continue;
    }

    const ext = "graplix";
    const filename = `template-${encodeURIComponent(document.uri.toString())}-${index}.${ext}`;

    const graplixDocument = await parse(template.content, {
      documentUri: `memory://graplix/${filename}`,
      validation: true,
    });

    for (const issue of graplixDocument.diagnostics ?? []) {
      const issueRange = issue.range;
      const range =
        issueRange === undefined
          ? new vscode.Range(startPosition, startPosition)
          : new vscode.Range(
              new vscode.Position(
                startPosition.line + issueRange.start.line,
                issueRange.start.line === 0
                  ? startPosition.character + issueRange.start.character
                  : issueRange.start.character,
              ),
              new vscode.Position(
                startPosition.line + issueRange.end.line,
                issueRange.end.line === 0
                  ? startPosition.character + issueRange.end.character
                  : issueRange.end.character,
              ),
            );

      const diagnostic = new vscode.Diagnostic(
        range,
        issue.message,
        severityToVscode(issue.severity),
      );
      diagnostic.source = "graplix";
      diagnostics.push(diagnostic);
    }
  }

  if (version !== document.version) {
    return;
  }

  collection.set(document.uri, diagnostics);
}

function scheduleTemplateValidation(
  document: vscode.TextDocument,
  collection: vscode.DiagnosticCollection,
): void {
  const key = document.uri.toString();
  const pending = validationTimers.get(key);
  if (pending !== undefined) {
    clearTimeout(pending);
  }

  validationTimers.set(
    key,
    setTimeout(async () => {
      validationTimers.delete(key);
      try {
        await validateGraplixTemplates(document, collection);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        outputChannel?.appendLine(
          `[graplix-template] validation failed for ${document.uri.toString()}: ${message}`,
        );
      }
    }, 120),
  );
}

/**
 * Activates the Graplix VS Code extension and starts the language client.
 */
export function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel("Graplix");
  context.subscriptions.push(outputChannel);

  // The server is implemented in node
  const serverModule = context.asAbsolutePath(
    path.join("dist", "language-server.cjs"),
  );

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run: {
      module: serverModule,
      transport: TransportKind.ipc,
    },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: {
        execArgv: ["--nolazy", "--inspect=6009"],
      },
    },
  };

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: "file", language: "graplix" }],
    synchronize: {
      fileEvents: [],
    },
  };

  // Create the language client and start the client.
  client = new LanguageClient(
    "graplixLanguageServer",
    "Graplix Language Server",
    serverOptions,
    clientOptions,
  );

  // Start the client. This will also launch the server
  client.start();

  const diagnostics =
    vscode.languages.createDiagnosticCollection("graplix-template");
  context.subscriptions.push(diagnostics);

  for (const document of vscode.workspace.textDocuments) {
    scheduleTemplateValidation(document, diagnostics);
  }

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((document) => {
      scheduleTemplateValidation(document, diagnostics);
    }),
    vscode.workspace.onDidChangeTextDocument((event) => {
      scheduleTemplateValidation(event.document, diagnostics);
    }),
    vscode.workspace.onDidCloseTextDocument((document) => {
      diagnostics.delete(document.uri);
      const key = document.uri.toString();
      const pending = validationTimers.get(key);
      if (pending !== undefined) {
        clearTimeout(pending);
        validationTimers.delete(key);
      }
    }),
    vscode.workspace.onDidSaveTextDocument((document) => {
      scheduleTemplateValidation(document, diagnostics);
    }),
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor !== undefined) {
        scheduleTemplateValidation(editor.document, diagnostics);
      }
    }),
  );
}

/**
 * Stops the language client when the extension is deactivated.
 */
export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
