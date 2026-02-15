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

export type GraplixAddedServices = {
  validation: {
    GraplixValidator: GraplixValidator;
  };
};

export type GraplixServices = LangiumServices & GraplixAddedServices;

export const GraplixModule: Module<
  GraplixServices,
  PartialLangiumServices & GraplixAddedServices
> = {
  validation: {
    GraplixValidator: () => new GraplixValidator(),
  },
};

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
