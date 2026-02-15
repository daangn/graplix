import { inject, type Module } from "langium";
import type {
  DefaultSharedModuleContext,
  LangiumServices,
  LangiumSharedServices,
  PartialLangiumServices,
} from "langium/lsp";
import { createDefaultModule, createDefaultSharedModule } from "langium/lsp";
import {
  GraplixGeneratedModule,
  GraplixGeneratedSharedModule,
} from "./__generated__/module";
import { GraplixValidator, registerValidationChecks } from "./validator";

/** Additional Graplix services layered over Langium defaults. */
export type GraplixAddedServices = {
  validation: {
    GraplixValidator: GraplixValidator;
  };
};

/** Full Graplix service type used by parser and language server. */
export type GraplixServices = LangiumServices & GraplixAddedServices;

/** Runtime module that wires Graplix-specific service implementations. */
export const GraplixModule: Module<
  GraplixServices,
  PartialLangiumServices & GraplixAddedServices
> = {
  validation: {
    GraplixValidator: () => new GraplixValidator(),
  },
};

/**
 * Creates and registers Langium shared/language services for Graplix.
 */
export function createGraplixServices(context: DefaultSharedModuleContext): {
  shared: LangiumSharedServices;
  Graplix: GraplixServices;
} {
  const shared = inject(
    createDefaultSharedModule(context),
    GraplixGeneratedSharedModule,
  );

  const Graplix = inject(
    createDefaultModule({ shared }),
    GraplixGeneratedModule,
    GraplixModule,
  );

  registerValidationChecks(Graplix);

  shared.ServiceRegistry.register(Graplix);

  return { shared, Graplix };
}
