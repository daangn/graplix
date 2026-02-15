import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "src/index.ts",
  dts: true,
  clean: true,
  inlineOnly: false,
  format: ["esm", "cjs"],
});
