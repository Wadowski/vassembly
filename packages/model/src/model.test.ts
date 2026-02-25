import { describe, it, expect } from "vitest";
import { Model, ModelWithTranslation, MONGODB_VALUE_MAP } from "./model";

class TestModel extends Model {}

class TestModelWithTranslation extends ModelWithTranslation {}

describe("Model", () => {
  describe("MONGODB_VALUE_MAP", () => {
    it("should export MONGODB_VALUE_MAP with value, list, and object methods", () => {
      expect(MONGODB_VALUE_MAP).toBeDefined();
      expect(MONGODB_VALUE_MAP.value).toBeDefined();
      expect(MONGODB_VALUE_MAP.list).toBeDefined();
      expect(MONGODB_VALUE_MAP.object).toBeDefined();
    });
  });

  describe("Model class", () => {
    it("should have mongoDbKeyMap with id mapped to _id", () => {
      const instance = new TestModel();
      expect(instance.mongoDbKeyMap).toEqual({ id: "_id" });
    });

    it("should have mongoDbValueMap defined", () => {
      const instance = new TestModel();
      expect(instance.mongoDbValueMap).toBeDefined();
      expect(instance.mongoDbValueMap.id).toBeDefined();
    });

    it("should have toMongoDb method", () => {
      const instance = new TestModel();
      expect(typeof instance.toMongoDb).toBe("function");
    });

    it("should have toJSON method", () => {
      const instance = new TestModel();
      expect(typeof instance.toJSON).toBe("function");
    });

    it("toMongoDb should return object without timestamps by default", () => {
      const instance = new TestModel();
      instance.id = "65de1f2a9b3c4d5e6f7a8b9c";

      const result = instance.toMongoDb();

      expect(result).toBeDefined();
      expect(result).not.toHaveProperty("createdAt");
      expect(result).not.toHaveProperty("updatedAt");
      expect(result).not.toHaveProperty("removedAt");
    });

    it("toMongoDb with isCreate should add timestamps", () => {
      const instance = new TestModel();
      instance.id = "65de1f2a9b3c4d5e6f7a8b9c";

      const result = instance.toMongoDb({ isCreate: true });

      expect(result).toHaveProperty("createdAt");
      expect(result).toHaveProperty("updatedAt");
      expect(result.createdAt instanceof Date).toBe(true);
      expect(result.updatedAt instanceof Date).toBe(true);
    });

    it("toMongoDb with isUpdate should add updatedAt only", () => {
      const instance = new TestModel();
      instance.id = "65de1f2a9b3c4d5e6f7a8b9c";

      const result = instance.toMongoDb({ isUpdate: true });

      expect(result).toHaveProperty("updatedAt");
      expect(result).not.toHaveProperty("createdAt");
      expect(result.updatedAt instanceof Date).toBe(true);
    });

    it("toMongoDb with isRemove should add removedAt", () => {
      const instance = new TestModel();
      instance.id = "65de1f2a9b3c4d5e6f7a8b9c";

      const result = instance.toMongoDb({ isRemove: true });

      expect(result).toHaveProperty("removedAt");
      expect(result).not.toHaveProperty("createdAt");
      expect(result).not.toHaveProperty("updatedAt");
      expect(result.removedAt instanceof Date).toBe(true);
    });

    it("toJSON should exclude model-specific properties", () => {
      class CustomModel extends TestModel {
        customField?: string;
      }
      const instance = new CustomModel();
      instance.id = "65de1f2a9b3c4d5e6f7a8b9c";
      instance.customField = "test";

      const result = instance.toJSON();

      expect(result).not.toHaveProperty("toMongoDb");
      expect(result).not.toHaveProperty("toJSON");
      expect(result).not.toHaveProperty("mongoDbKeyMap");
      expect(result).not.toHaveProperty("mongoDbValueMap");
      expect(result.customField).toBe("test");
    });
  });
});

describe("ModelWithTranslation", () => {
  describe("class", () => {
    it("should have setLanguageTranslation method", () => {
      const instance = new TestModelWithTranslation();
      expect(typeof instance.setLanguageTranslation).toBe("function");
    });

    it("should have toJSON method that excludes setLanguageTranslation", () => {
      class CustomModel extends TestModelWithTranslation {
        customField?: string;
      }

      const instance = new CustomModel();
      instance.customField = "value";

      const result = instance.toJSON();

      expect(result).not.toHaveProperty("setLanguageTranslation");
      expect(result.customField).toBe("value");
    });
  });
});
