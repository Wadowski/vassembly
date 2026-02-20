import { describe, it, expect } from "vitest";
import { factory, translationFactory } from "./factory";
import { Translation } from "./types";
import { COUNTRIES } from "@vassembly/constants";
import { Model, ModelWithTranslation } from "./model";

class TestModel extends Model {
  name?: string;
  description?: string;
}

class TestModelWithTranslation extends ModelWithTranslation {
  name?: string;
  nameTranslations?: Translation[];
  category?: string;
  categoryTranslations?: Translation[];
  items?: Array<{ value: string; valueTranslations: Translation[] }>;
}

describe("factory", () => {
  it("should create an instance with provided data", () => {
    const testFactory = factory(TestModel);
    const data = { id: "123", name: "Test", description: "Test Description" };

    const result = testFactory.create(data);

    expect(result).not.toBeNull();
    expect(result?.id).toBe("123");
    expect(result?.name).toBe("Test");
    expect(result?.description).toBe("Test Description");
  });

  it("should omit reserved keys when creating instance", () => {
    const testFactory = factory(TestModel);
    const data = {
      id: "123",
      name: "Test",
      toMongoDb: () => ({}),
      toJSON: () => ({}),
      setLanguageTranslation: () => {},
    } as any;

    const result = testFactory.create(data);

    expect(result?.id).toBe("123");
    expect(result?.name).toBe("Test");
  });

  it("should return null when data is null", () => {
    const testFactory = factory(TestModel);

    const result = testFactory.create(null);

    expect(result).toBeNull();
  });

  it("should return null when data is undefined", () => {
    const testFactory = factory(TestModel);

    const result = testFactory.create(undefined);

    expect(result).toBeNull();
  });

  it("should create multiple instances with createMany", () => {
    const testFactory = factory(TestModel);
    const dataArray = [
      { id: "1", name: "First" },
      { id: "2", name: "Second" },
      { id: "3", name: "Third" },
    ];

    const result = testFactory.createMany(dataArray);

    expect(result).toHaveLength(3);
    expect(result[0]?.id).toBe("1");
    expect(result[1]?.id).toBe("2");
    expect(result[2]?.id).toBe("3");
  });

  it("should handle empty array in createMany", () => {
    const testFactory = factory(TestModel);

    const result = testFactory.createMany([]);

    expect(result).toHaveLength(0);
  });

  it("should assign all provided properties to the instance", () => {
    const testFactory = factory(TestModel);
    const data = {
      id: "abc123",
      name: "My Model",
      description: "A detailed description",
    };

    const result = testFactory.create(data);

    expect(result?.id).toBe(data.id);
    expect(result?.name).toBe(data.name);
    expect(result?.description).toBe(data.description);
  });
});

describe("translationFactory", () => {
  it("should return object with createWithTranslations and createManyWithTranslations methods", () => {
    const translationMap = [
      { fieldKey: "name", translationKey: "nameTranslations" },
    ];
    const translationFact = translationFactory(
      TestModelWithTranslation,
      translationMap
    );

    expect(translationFact).toHaveProperty("createWithTranslations");
    expect(translationFact).toHaveProperty("createManyWithTranslations");
    expect(typeof translationFact.createWithTranslations).toBe("function");
    expect(typeof translationFact.createManyWithTranslations).toBe("function");
  });

  it("should create instance with translation map data", () => {
    const translationMap = [
      { fieldKey: "name", translationKey: "nameTranslations" },
    ];
    const translationFact = translationFactory(
      TestModelWithTranslation,
      translationMap
    );

    const data = {
      id: "123",
      name: "Default Name",
      nameTranslations: [
        { language: COUNTRIES.Poland, value: "Nazwa" },
      ],
    };

    const result = translationFact.createWithTranslations(data);

    expect(result).not.toBeNull();
    expect(result?.id).toBe("123");
  });

  it("should return null when data is null", () => {
    const translationMap = [
      { fieldKey: "name", translationKey: "nameTranslations" },
    ];
    const translationFact = translationFactory(
      TestModelWithTranslation,
      translationMap
    );

    const result = translationFact.createWithTranslations(null as any);

    expect(result).toBeNull();
  });

  it("should provide createManyWithTranslations method", () => {
    const translationMap = [
      { fieldKey: "name", translationKey: "nameTranslations" },
    ];
    const translationFact = translationFactory(
      TestModelWithTranslation,
      translationMap
    );

    expect(typeof translationFact.createManyWithTranslations).toBe("function");
  });
});
