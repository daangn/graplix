import { createURLSpecServices } from "@urlspec/language";
import { startLanguageServer } from "langium/lsp";
import { NodeFileSystem } from "langium/node";
import { createConnection, ProposedFeatures } from "vscode-languageserver/node";

// Create a connection for the server
const connection = createConnection(ProposedFeatures.all);

// Inject the shared services and language-specific services
const { shared } = createURLSpecServices({ connection, ...NodeFileSystem });

// Start the language server with the shared services
startLanguageServer(shared);
