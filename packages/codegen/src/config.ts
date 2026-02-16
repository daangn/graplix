import type { MapperConfig } from "./generate";

export interface CodegenConfig {
  readonly $schema?: string;
  readonly schema: string;
  readonly output?: string;
  readonly mappers?: MapperConfig;
}
