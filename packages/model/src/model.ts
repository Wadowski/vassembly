import "reflect-metadata";
import { ObjectId } from "mongodb";
import { mongoDbDocumentParamOmitDecorator, MongoDbOmit } from "./mongodb";
import { COUNTRIES } from "@vassembly/constants";
import { getTranslation, getTranslationList, getTranslationListList } from "./translationMapping";
import { ValidatorResult } from "@vassembly/validation";
import { WrongParamError } from "@vassembly/errors";
import type { ZodIssue } from "zod";

interface MongoDbConvertible {
  toMongoDb: () => Record<string, unknown>;
}

export const MONGODB_VALUE_MAP = {
  value: (data: unknown) => new ObjectId(data as string),
  list: (data: string[]) => {
    return Array.isArray(data) ? data.map((r) => new ObjectId(r)) : data;
  },
  object: (data: Record<string, string>) => {
    return data
      ? Object.entries(data).reduce((acc, [key, value]) => {
          if (value === undefined) {
            return acc;
          }

          return {
            [key]: value ? new ObjectId(value) : value,
            ...acc,
          };
        }, {})
      : data;
  }
};

const MODEL_JSON_OMIT_KEYS = new Set([
  "toJSON",
  "toMongoDb",
  "mongoDbKeyMap",
  "mongoDbValueMap",
  "validator",
  "isValid",
]);

export abstract class Model {
  id?: string;
  
  createdAt?: Date;
  
  updatedAt?: Date;
  
  removedAt?: Date | null;
  
  @MongoDbOmit
  mongoDbKeyMap: Record<string, string> = {
    id: "_id",
  };

  @MongoDbOmit
  mongoDbValueMap: Record<string, (data: unknown) => unknown> = {
    id: MONGODB_VALUE_MAP.value,
  };

  @MongoDbOmit
  private validator?: (data: unknown) => ValidatorResult<this>;

  @MongoDbOmit
  isValid = (options?: { shouldThrow?: boolean }): ValidatorResult<this> => {
    if (!this.validator) {
      return { success: true, data: this };
    }

    const result = this.validator(this);

    if (options?.shouldThrow && !result.success) {
      const zodError = result.error.error as { issues: ZodIssue[] } | undefined;
      const issuesMessages = (zodError?.issues ?? [])
        .map((issue: ZodIssue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ");
      const errorMessage = `${this.constructor.name} :: ${issuesMessages}`;
      throw new WrongParamError(errorMessage);
    }

    return result;
  };

  @MongoDbOmit
  toMongoDb = ({
    isCreate,
    isUpdate,
    isRemove,
  }: { isCreate?: boolean; isUpdate?: boolean; isRemove?: boolean } = {}): Record<string, unknown> => {
    const cleanupDocument = (data: Record<string, unknown>): Record<string, unknown> => {
      const omitKeys =
        (Reflect.getMetadata(mongoDbDocumentParamOmitDecorator, data) as string[] | undefined) ?? [];

      return Object.entries(data).reduce((acc, [key, value]) => {
        if (value === undefined) {
          return acc;
        }

        const mongoKey = this.mongoDbKeyMap[key] ?? key;
        const mongoValue = this.mongoDbValueMap[key];

        let newAcc = acc;
        let mappedValue: unknown = value;

        if (mongoValue && value) {
          mappedValue = mongoValue(value);
        } else if (
          typeof value === "object" &&
          value !== null &&
          "toMongoDb" in value &&
          typeof (value as MongoDbConvertible).toMongoDb === "function"
        ) {
          mappedValue = (value as MongoDbConvertible).toMongoDb();
        }

        if (!omitKeys.includes(key)) {
          newAcc = {
            ...acc,
            [mongoKey]: mappedValue,
          };
        }
        return newAcc;
      }, {});
    };

    const cleanData = cleanupDocument(this as unknown as Record<string, unknown>);

    if (isCreate) {
      return {
        ...cleanData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } else if (isUpdate) {
      return {
        ...cleanData,
        updatedAt: new Date(),
      };
    } else if (isRemove) {
      return {
        ...cleanData,
        removedAt: new Date(),
      };
    }

    return cleanData;
  };

  @MongoDbOmit
  toJSON(): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(this).filter(([key]) => !MODEL_JSON_OMIT_KEYS.has(key))
    );
  }
}

export abstract class ModelWithTranslation extends Model {
  @MongoDbOmit
  setLanguageTranslation =
    (fieldKey: string, translationsKey: string, hasArray?: boolean) =>
    (language: COUNTRIES) => {
      if (hasArray) {
        const isNestedArray = fieldKey.includes(".[].[].");
        if (isNestedArray) {
          const [topLevelFieldKey] = fieldKey.split(".[].[].");
          if (typeof topLevelFieldKey !== "string") { 
            return; 
          }

          (this as Record<string, unknown>)[topLevelFieldKey] = getTranslationListList(
            fieldKey,
            translationsKey,
            this as unknown as Record<string, unknown>,
            language
          );
        } else {
          const [topLevelFieldKey] = fieldKey.split(".[].");
          if (typeof topLevelFieldKey !== "string") { 
            return; 
          }

          (this as Record<string, unknown>)[topLevelFieldKey] = getTranslationList(
            fieldKey,
            translationsKey,
            this as unknown as Record<string, unknown>,
            language
          );
        }
      } else {
        if (typeof fieldKey !== "string") { 
          return; 
        }

        (this as Record<string, unknown>)[fieldKey] = getTranslation(
          fieldKey,
          translationsKey,
          this as unknown as Record<string, unknown>,
          language
        );
      }
    };

  @MongoDbOmit
  override toJSON(): Record<string, unknown> {
    const rest = super.toJSON();
    return Object.fromEntries(
      Object.entries(rest).filter(([key]) => key !== "setLanguageTranslation")
    );
  }
}

