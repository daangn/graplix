import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "./src/index.ts",
  outDir: "./dist",
  dts: {
    transformer: "typescript",
    autoAddExts: true,
  },
  format: ["esm", "cjs"],
  clean: true,
});
