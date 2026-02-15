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

export type GraplixAddedServices = {};

export type GraplixServices = LangiumServices & GraplixAddedServices;

export const GraplixModule: Module<
  GraplixServices,
  PartialLangiumServices & GraplixAddedServices
> = {};

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

  shared.ServiceRegistry.register(Graplix);

  return { shared, Graplix };
}
