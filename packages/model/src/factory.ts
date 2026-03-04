import { z } from "zod";
import { validatorFactory } from "@vassembly/validation";
import { COUNTRIES } from "@vassembly/constants";
import { Model, ModelWithTranslation, ModelFactory, ModelTranslationFactory } from "./types";

const KEYS_TO_OMIT = ["toMongoDb", "toJSON", "setLanguageTranslation"];

export const factory = <T extends Model>(
  FactoryModel: { new (): T },
  validationSchema?: z.ZodSchema
): ModelFactory<T> => {
  const validator = validationSchema ? validatorFactory(validationSchema) : undefined;

  const create = (data: Partial<T>): T => {
    const instance = new FactoryModel();

    Object.entries(data).forEach(([key, value]) => {
      if (!KEYS_TO_OMIT.includes(key)) {
        (instance as any)[key] = value;
      }
    });

    if (validator) {
      (instance as any).validator = validator;
    }

    return instance;
  };

  const createMany = (data: Array<Partial<T>>): Array<T> => {
    return data.map(create);
  };

  return {
    create,
    createMany,
  };
};

export const translationFactory = <T extends ModelWithTranslation>(
  FactoryModel: { new (): T },
  translationMap: Array<{
    fieldKey: string;
    translationKey: string;
    isArray?: boolean;
  }>,
  validationSchema?: z.ZodSchema
): ModelTranslationFactory<T> => {
  const createWithTranslations = (
    data: Partial<T>,
    language?: COUNTRIES
  ) => {
    const instance = factory<T>(FactoryModel, validationSchema).create(data);
    if (!language) {
      return instance;
    }

    translationMap.forEach(({ translationKey, fieldKey, isArray }) => {
      instance?.setLanguageTranslation(
        fieldKey,
        translationKey,
        isArray
      )(language);
    });

    return instance;
  };

  const createManyWithTranslations = (
    data: Array<Partial<T>>,
    language: COUNTRIES
  ) => {
    return data.map((record) => createWithTranslations(record, language));
  };

  return {
    createWithTranslations,
    createManyWithTranslations,
  };
};
