import { factory, translationFactory } from "@vassembly/model";
import { UserModel } from "./model";

export const userFactory = factory(UserModel);

const TRANSLATION_MAP = [];
export const userTranslationFactory = translationFactory(UserModel, TRANSLATION_MAP);