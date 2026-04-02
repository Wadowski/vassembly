import "reflect-metadata";
import { ObjectId } from "mongodb";
import { mongoDbDocumentParamOmitDecorator, MongoDbOmit } from "./mongodb";
import { COUNTRIES } from "@vassembly/constants";
import { getTranslation, getTranslationList, getTranslationListList } from "./translationMapping";
import { ValidatorResult } from "@vassembly/validation";

export const MONGODB_VALUE_MAP = {
  value: (data: string) => new ObjectId(data),
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
  mongoDbValueMap: Record<string, (data: string) => any> = {
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
      throw result.error;
    }

    return result;
  };

  @MongoDbOmit
  toMongoDb = ({
    isCreate,
    isUpdate,
    isRemove,
  }: { isCreate?: boolean; isUpdate?: boolean; isRemove?: boolean } = {}): Record<string, any> => {
    const cleanupDocument = (data: any) => {
      const omitKeys =
        Reflect.getMetadata(mongoDbDocumentParamOmitDecorator, data) || [];

      return Object.entries(data).reduce((acc, [key, value]) => {
        if (value === undefined) {
          return acc;
        }

        const mongoKey = this.mongoDbKeyMap[key] ?? key;
        const mongoValue = this.mongoDbValueMap[key];

        let newAcc = acc;
        let mappedValue = value;

        if (mongoValue) {
          mappedValue = mongoValue(value as any);
        } else if ((value as any)?.toMongoDb) {
          mappedValue = (value as any).toMongoDb();
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

    const cleanData = cleanupDocument(this);

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
  toJSON(): Record<string, any> {
    const {
      toJSON,
      toMongoDb,
      mongoDbKeyMap,
      mongoDbValueMap,
      validator,
      isValid,
      ...rest
    } = this;
    return rest;
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

          (this as any)[topLevelFieldKey] = getTranslationListList(
            fieldKey,
            translationsKey,
            this,
            language
          );
        } else {
          const [topLevelFieldKey] = fieldKey.split(".[].");
          if (typeof topLevelFieldKey !== "string") { 
            return; 
          }

          (this as any)[topLevelFieldKey] = getTranslationList(
            fieldKey,
            translationsKey,
            this,
            language
          );
        }
      } else {
        if (typeof fieldKey !== "string") { 
          return; 
        }

        (this as any)[fieldKey] = getTranslation(
          fieldKey,
          translationsKey,
          this,
          language
        );
      }
    };

  @MongoDbOmit
  override toJSON(): Record<string, any> {
    const { setLanguageTranslation, ...rest } = super.toJSON();
    return rest;
  }
}

