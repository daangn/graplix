#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";
import { Command } from "commander";
import { generateFromFgaDsl } from "./generateFromFgaDSL.ts";

const program = new Command();

program.name("graplix").version("0.1.0").description("A CLI tool for Graplix");

program
  .command("generate")
  .description("Generate code based on the input file")
  .requiredOption(
    "-i, --input <filePath>",
    "Path to the input file (e.g., ./model.fga)",
  )
  .option(
    "-o, --output <filePath>",
    "Path to the output file (e.g., __generated__)",
    "__generated__",
  )
  .action((options) => {
    const inputPath = path.resolve(process.cwd(), options.input);
    const dsl = readFileSync(inputPath, "utf-8");

    console.info(`Generating code for input file: ${options.input}`);

    generateFromFgaDsl(dsl, options.output);

    console.log(`Generated graplix scaffold at ${options.output}`);
  });

program.parse(process.argv);
