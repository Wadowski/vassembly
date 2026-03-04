import { describe, it, expect, vi } from "vitest";
import { factory, translationFactory } from "./factory";
import { Translation } from "./types";
import { COUNTRIES } from "@vassembly/constants";
import { Model, ModelWithTranslation } from "./model";
import { z } from "zod";

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

  describe("isValid", () => {
    it("should have isValid function on created instance", () => {
      const testFactory = factory(TestModel);
      const data = { id: "123", name: "Test" };

      const result = testFactory.create(data);

      expect(typeof result?.isValid).toBe("function");
    });

    it("should have isValid function on all instances created with createMany", () => {
      const testFactory = factory(TestModel);
      const dataArray = [
        { id: "1", name: "First" },
        { id: "2", name: "Second" },
      ];

      const results = testFactory.createMany(dataArray);

      expect(results).toHaveLength(2);
      expect(typeof results[0]?.isValid).toBe("function");
      expect(typeof results[1]?.isValid).toBe("function");
    });

    it("should have isValid function that returns success when no validation schema is provided", () => {
      const testFactory = factory(TestModel);
      const data = { id: "123", name: "Test" };

      const instance = testFactory.create(data);
      const result = instance?.isValid();

      expect(result?.success).toBe(true);
      expect(result?.data).toBe(instance);
    });

    it("should have isValid function that validates against schema when provided", () => {
      const schema = z.object({
        id: z.string(),
        name: z.string().min(1),
      });
      const testFactory = factory(TestModel, schema);
      const data = { id: "123", name: "Test" };

      const instance = testFactory.create(data);
      const result = instance?.isValid();

      expect(result?.success).toBe(true);
    });

    it("should have isValid function that returns error for invalid data against schema", () => {
      const schema = z.object({
        id: z.string(),
        name: z.string().min(5),
      });
      const testFactory = factory(TestModel, schema);
      const data = { id: "123", name: "No" };

      const instance = testFactory.create(data);
      const result = instance?.isValid();

      expect(result?.success).toBe(false);
      expect(result?.error).toBeDefined();
    });
  });
});

describe("translationFactory", () => {
  it("should use translation value based on language when createWithTranslations is called", () => {
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
        { language: COUNTRIES.Poland, value: "Polska Nazwa" },
        { language: COUNTRIES.England, value: "English Name" },
      ],
    };

    const resultPL = translationFact.createWithTranslations(
      data,
      COUNTRIES.Poland
    );

    expect(resultPL?.name).toBe("Polska Nazwa");
  });

  it("should use different translation value for different languages", () => {
    const translationMap = [
      { fieldKey: "name", translationKey: "nameTranslations" },
    ];
    const translationFact = translationFactory(
      TestModelWithTranslation,
      translationMap
    );

    const data = {
      id: "456",
      name: "Default Name",
      nameTranslations: [
        { language: COUNTRIES.Poland, value: "Polska Nazwa" },
        { language: COUNTRIES.England, value: "English Name" },
      ],
    };

    const resultPL = translationFact.createWithTranslations(
      data,
      COUNTRIES.Poland
    );
    const resultEN = translationFact.createWithTranslations(
      data,
      COUNTRIES.England
    );

    expect(resultPL?.name).toBe("Polska Nazwa");
    expect(resultEN?.name).toBe("English Name");
  });

  it("should fallback to default value when translation for language is not found", () => {
    const translationMap = [
      { fieldKey: "name", translationKey: "nameTranslations" },
    ];
    const translationFact = translationFactory(
      TestModelWithTranslation,
      translationMap
    );

    const data = {
      id: "789",
      name: "Default Name",
      nameTranslations: [{ language: COUNTRIES.Poland, value: "Polska Nazwa" }],
    };

    const resultEN = translationFact.createWithTranslations(
      data,
      COUNTRIES.England
    );

    expect(resultEN?.name).toBe("Default Name");
  });

  it("should apply translations to multiple fields", () => {
    const translationMap = [
      { fieldKey: "name", translationKey: "nameTranslations" },
      { fieldKey: "category", translationKey: "categoryTranslations" },
    ];
    const translationFact = translationFactory(
      TestModelWithTranslation,
      translationMap
    );

    const data = {
      id: "101",
      name: "Default Name",
      nameTranslations: [
        { language: COUNTRIES.Poland, value: "Polska Nazwa" },
      ],
      category: "Default Category",
      categoryTranslations: [
        { language: COUNTRIES.Poland, value: "Polska Kategoria" },
      ],
    };

    const result = translationFact.createWithTranslations(
      data,
      COUNTRIES.Poland
    );

    expect(result?.name).toBe("Polska Nazwa");
    expect(result?.category).toBe("Polska Kategoria");
  });

  it("should use translations for multiple items in createManyWithTranslations", () => {
    const translationMap = [
      { fieldKey: "name", translationKey: "nameTranslations" },
    ];
    const translationFact = translationFactory(
      TestModelWithTranslation,
      translationMap
    );

    const dataArray = [
      {
        id: "1",
        name: "Item 1",
        nameTranslations: [
          { language: COUNTRIES.Poland, value: "Przedmiot 1" },
        ],
      },
      {
        id: "2",
        name: "Item 2",
        nameTranslations: [
          { language: COUNTRIES.Poland, value: "Przedmiot 2" },
        ],
      },
    ];

    const results = translationFact.createManyWithTranslations(
      dataArray,
      COUNTRIES.Poland
    );

    expect(results).toHaveLength(2);
    expect(results[0]?.name).toBe("Przedmiot 1");
    expect(results[1]?.name).toBe("Przedmiot 2");
  });
});
