import { inject, type Module } from "langium";
import type {
  DefaultSharedModuleContext,
  LangiumServices,
  LangiumSharedServices,
  PartialLangiumServices,
} from "langium/lsp";
import { createDefaultModule, createDefaultSharedModule } from "langium/lsp";
import {
  URLSpecGeneratedModule,
  URLSpecGeneratedSharedModule,
} from "./__generated__/module";
import { URLSpecValidator } from "./validator";

export type URLSpecAddedServices = {
  validation: {
    URLSpecValidator: URLSpecValidator;
  };
};

export type URLSpecServices = LangiumServices & URLSpecAddedServices;

export const URLSpecModule: Module<
  URLSpecServices,
  PartialLangiumServices & URLSpecAddedServices
> = {
  validation: {
    URLSpecValidator: () => new URLSpecValidator(),
  },
};

export function createURLSpecServices(context: DefaultSharedModuleContext): {
  shared: LangiumSharedServices;
  URLSpec: URLSpecServices;
} {
  const shared = inject(
    createDefaultSharedModule(context),
    URLSpecGeneratedSharedModule,
  );

  const URLSpec = inject(
    createDefaultModule({ shared }),
    URLSpecGeneratedModule,
    URLSpecModule,
  );

  shared.ServiceRegistry.register(URLSpec);

  // Register validation checks after the service is registered
  // In Langium 4.x, we need to ensure the reflection is properly set up first
  const validator = URLSpec.validation.URLSpecValidator;
  const checks = validator.registerChecks(URLSpec);
  // Pass validator as thisObj (second parameter) for proper context binding
  URLSpec.validation.ValidationRegistry.register(checks, validator, "fast");

  return { shared, URLSpec };
}
