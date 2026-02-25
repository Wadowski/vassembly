import { COUNTRIES } from "@vassembly/constants";

export interface Model {
  createdAt?: Date;
  updatedAt?: Date;
  removedAt?: Date | null;
}

export interface ModelFactory<T> {
  create: (data: Partial<T>) => T;
  createMany: (data: Array<Partial<T>>) => Array<T>;
}

export interface ModelTranslationFactory<T> {
  createWithTranslations: (data: Partial<T>, language?: COUNTRIES) => T;
  createManyWithTranslations: (data: Array<Partial<T>>, language: COUNTRIES) => Array<T>;
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
