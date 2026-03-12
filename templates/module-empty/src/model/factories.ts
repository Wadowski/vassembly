import { factory, translationFactory } from "@vassembly/model";
import { ModuleModel } from "./model";

export const moduleFactory = factory(ModuleModel);

const TRANSLATION_MAP = [
  {
    fieldKey: "name",
    translationKey: "name",
  },
];
export const moduleTranslationFactory = translationFactory(ModuleModel, TRANSLATION_MAP);