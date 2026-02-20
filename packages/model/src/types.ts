import { COUNTRIES } from "@vassembly/constants";

export interface Model {
  createdAt?: Date;
  updatedAt?: Date;
  removedAt?: Date | null;
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
