#!/usr/bin/env node

import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { cosmiconfig } from "cosmiconfig";
import { TypeScriptLoader } from "cosmiconfig-typescript-loader";
import type { CodegenConfig } from "./config";
import { generateTypeScriptFromFile, type MapperConfig } from "./generate";

interface RawCliArguments {
  readonly schemaFilePath?: string;
  readonly outputFilePath?: string;
  readonly configFilePath?: string;
  readonly mappers: MapperConfig;
}

interface ResolvedArguments {
  readonly schemaFilePath: string;
  readonly outputFilePath?: string;
  readonly mappers: MapperConfig;
}

function fail(message: string): never {
  throw new Error(
    `${message}\nUsage: graplix-codegen [schema.graplix] [output.ts] [--config graplix.codegen.json] [--mapper Type=./module#Type]`,
  );
}

function parseMapper(rawMapper: string): { typeName: string; mapper: string } {
  const equalIndex = rawMapper.indexOf("=");
  if (equalIndex <= 0 || equalIndex === rawMapper.length - 1) {
    fail(`Invalid mapper: ${rawMapper}`);
  }

  return {
    typeName: rawMapper.slice(0, equalIndex),
    mapper: rawMapper.slice(equalIndex + 1),
  };
}

function parseCliArguments(argv: readonly string[]): RawCliArguments {
  let schemaFilePath: string | undefined;
  let outputFilePath: string | undefined;
  let configFilePath: string | undefined;
  const mappers: MapperConfig = {};

  let cursor = 0;
  const firstArg = argv[cursor];
  if (firstArg?.startsWith("--") !== true) {
    if (firstArg === undefined) {
      return { schemaFilePath, outputFilePath, configFilePath, mappers };
    }

    schemaFilePath = firstArg;
    cursor += 1;
  }

  const secondArg = argv[cursor];
  if (secondArg?.startsWith("--") !== true) {
    if (secondArg === undefined) {
      return { schemaFilePath, outputFilePath, configFilePath, mappers };
    }

    outputFilePath = secondArg;
    cursor += 1;
  }

  while (cursor < argv.length) {
    const token = argv[cursor];
    if (token === undefined) {
      break;
    }

    if (token === "--config") {
      const configValue = argv[cursor + 1];
      if (configValue === undefined) {
        fail("--config requires a value.");
      }

      configFilePath = configValue;
      cursor += 2;
      continue;
    }

    if (token === "--mapper") {
      const mapperValue = argv[cursor + 1];
      if (mapperValue === undefined) {
        fail("--mapper requires a value.");
      }

      const { typeName, mapper } = parseMapper(mapperValue);
      mappers[typeName] = mapper;
      cursor += 2;
      continue;
    }

    if (token === "--help" || token === "-h") {
      fail("Help requested.");
    }

    if (token?.startsWith("--") === true) {
      fail(`Unknown argument: ${token}`);
    }

    fail(`Unexpected positional argument: ${token}`);
  }

  return { schemaFilePath, outputFilePath, configFilePath, mappers };
}

async function loadConfig(rawArgs: RawCliArguments): Promise<{
  readonly config: Partial<CodegenConfig>;
  readonly baseDir: string;
}> {
  const explorer = cosmiconfig("graplix-codegen", {
    searchPlaces: [
      "package.json",
      "graplix-codegen.config.json",
      "graplix-codegen.config.yaml",
      "graplix-codegen.config.yml",
      "graplix-codegen.config.js",
      "graplix-codegen.config.cjs",
      "graplix-codegen.config.mjs",
      "graplix-codegen.config.ts",
      "graplix-codegen.config.cts",
      "graplix-codegen.config.mts",
      "graplix.codegen.json",
      "graplix.codegen.yaml",
      "graplix.codegen.yml",
      "graplix.codegen.js",
      "graplix.codegen.cjs",
      "graplix.codegen.mjs",
      "graplix.codegen.ts",
      "graplix.codegen.cts",
      "graplix.codegen.mts",
    ],
    loaders: {
      ".ts": TypeScriptLoader(),
      ".cts": TypeScriptLoader(),
      ".mts": TypeScriptLoader(),
    },
  });

  const loaded =
    rawArgs.configFilePath === undefined
      ? await explorer.search()
      : await explorer.load(resolve(rawArgs.configFilePath));

  if (
    loaded === null ||
    loaded.config === null ||
    loaded.config === undefined
  ) {
    return {
      config: {},
      baseDir: process.cwd(),
    };
  }

  return {
    config: loaded.config as Partial<CodegenConfig>,
    baseDir: dirname(loaded.filepath),
  };
}

async function resolveArguments(
  rawArgs: RawCliArguments,
): Promise<ResolvedArguments> {
  const loaded = await loadConfig(rawArgs);
  const schemaFromConfig = loaded.config.schema;
  const outputFromConfig = loaded.config.output;
  const schemaFilePath = rawArgs.schemaFilePath ?? schemaFromConfig;

  if (schemaFilePath === undefined) {
    fail("Schema file path is required (CLI arg or config.schema).");
  }

  const outputFilePath = rawArgs.outputFilePath ?? outputFromConfig;

  return {
    schemaFilePath: resolve(loaded.baseDir, schemaFilePath),
    outputFilePath:
      outputFilePath === undefined
        ? undefined
        : resolve(loaded.baseDir, outputFilePath),
    mappers: {
      ...(loaded.config.mappers ?? {}),
      ...rawArgs.mappers,
    },
  };
}

async function run(): Promise<void> {
  const rawArgs = parseCliArguments(process.argv.slice(2));
  const args = await resolveArguments(rawArgs);
  const generated = await generateTypeScriptFromFile({
    schemaFilePath: args.schemaFilePath,
    mappers: args.mappers,
  });

  const outputPath =
    args.outputFilePath === undefined
      ? resolve(dirname(args.schemaFilePath), generated.fileName)
      : args.outputFilePath;

  await writeFile(outputPath, generated.content, "utf8");
  process.stdout.write(`${outputPath}\n`);
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
