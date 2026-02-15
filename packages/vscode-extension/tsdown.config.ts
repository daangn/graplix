import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/extension.ts", "src/language-server.ts"],
  format: ["cjs"],
  platform: "node",
  target: "node18",
  clean: true,
  dts: false,
  inlineOnly: false,
  external: ["vscode"],
  noExternal: [
    "@graplix/language",
    "langium",
    "langium/*",
    "vscode-languageclient",
    "vscode-languageclient/*",
    "vscode-languageserver",
    "vscode-languageserver/*",
  ],
});
