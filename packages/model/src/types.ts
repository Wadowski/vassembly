import { COUNTRIES } from "@vassembly/constants";
import { ValidatorResult } from "@vassembly/validation";
import { z } from "zod";

export interface Model {
  createdAt?: Date;
  updatedAt?: Date;
  removedAt?: Date | null;
  isValid: (options?: { shouldThrow?: boolean }) => ValidatorResult<this>;
}

export interface CreateOptions {
  validationSchema?: z.ZodSchema;
}

export interface ModelFactory<T> {
  create: (data: Partial<T>, options?: CreateOptions) => T;
  createMany: (data: Array<Partial<T>>, options?: CreateOptions) => Array<T>;
}

export interface ModelTranslationFactory<T> {
  createWithTranslations: (data: Partial<T>, language?: COUNTRIES, options?: CreateOptions) => T;
  createManyWithTranslations: (data: Array<Partial<T>>, language: COUNTRIES, options?: CreateOptions) => Array<T>;
}

export interface ModelWithTranslation extends Model {
  setLanguageTranslation: (
    fieldKey: string,
    translationKey: string,
    hasArray?: boolean
  ) => (language: COUNTRIES) => void;
}

export interface Translation<Value = string> {
  language: COUNTRIES;
  value: Value;
}
