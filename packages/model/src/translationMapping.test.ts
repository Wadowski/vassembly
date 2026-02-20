import { describe, it, expect } from "vitest";
import {
  getTranslation,
  getTranslationList,
  getTranslationListList,
} from "./translationMapping";
import { COUNTRIES } from "@vassembly/constants";
import { Translation } from "./types";

describe("translationMapping", () => {
  describe("getTranslation", () => {
    it("should return translated value for valid language", () => {
      const instance = {
        title: "Default Title",
        titleTranslations: [
          { language: COUNTRIES.Poland, value: "Tytuł" },
          { language: COUNTRIES.England, value: "Title" },
        ],
      };

      const result = getTranslation(
        "title",
        "titleTranslations",
        instance,
        COUNTRIES.Poland
      );

      expect(result).toBe("Tytuł");
    });

    it("should return fallback value when translation not found", () => {
      const instance = {
        title: "Default Title",
        titleTranslations: [
          { language: COUNTRIES.Poland, value: "Tytuł" },
        ],
      };

      const result = getTranslation(
        "title",
        "titleTranslations",
        instance,
        COUNTRIES.England
      );

      expect(result).toBe("Default Title");
    });

    it("should return undefined when translations array is undefined", () => {
      const instance = {
        title: "Default Title",
      };

      const result = getTranslation(
        "title",
        "titleTranslations",
        instance,
        COUNTRIES.Poland
      );

      expect(result).toBeUndefined();
    });

    it("should return fallback when translations array is not an array", () => {
      const instance = {
        title: "Default Title",
        titleTranslations: "not an array",
      };

      const result = getTranslation(
        "title",
        "titleTranslations",
        instance,
        COUNTRIES.Poland
      );

      expect(result).toBe("Default Title");
    });

    it("should return undefined when field key is undefined", () => {
      const instance = {
        title: undefined,
        titleTranslations: [
          { language: COUNTRIES.Poland, value: "Tytuł" },
        ],
      };

      const result = getTranslation(
        "title",
        "titleTranslations",
        instance,
        COUNTRIES.Poland
      );

      expect(result).toBeUndefined();
    });

    it("should return undefined for invalid language", () => {
      const instance = {
        title: "Default Title",
        titleTranslations: [
          { language: COUNTRIES.Poland, value: "Tytuł" },
        ],
      };

      const result = getTranslation(
        "title",
        "titleTranslations",
        instance,
        "INVALID" as COUNTRIES
      );

      expect(result).toBeUndefined();
    });

    it("should handle translations with object values", () => {
      const instance = {
        config: { key: "default" },
        configTranslations: [
          { language: COUNTRIES.Poland, value: { key: "wartość" } },
        ],
      };

      const result = getTranslation(
        "config",
        "configTranslations",
        instance,
        COUNTRIES.Poland
      );

      expect(result).toEqual({ key: "wartość" });
    });

    it("should handle translations with numeric values", () => {
      const instance = {
        count: 10,
        countTranslations: [
          { language: COUNTRIES.Poland, value: 20 },
        ],
      };

      const result = getTranslation(
        "count",
        "countTranslations",
        instance,
        COUNTRIES.Poland
      );

      expect(result).toBe(20);
    });

    it("should return undefined when instance is null or undefined", () => {
      const result = getTranslation(
        "title",
        "titleTranslations",
        null,
        COUNTRIES.Poland
      );

      expect(result).toBeUndefined();
    });
  });

  describe("getTranslationList", () => {
    it("should map items and apply getTranslation to each one", () => {
      const instance = {
        names: ["Item 1", "Item 2"],
        nameTranslations: [
          [{ language: COUNTRIES.Poland, value: "Przedmiot 1" }],
          [{ language: COUNTRIES.Poland, value: "Przedmiot 2" }],
        ],
      };

      const result = getTranslationList(
        "names.[].",
        "nameTranslations.[].",
        instance,
        COUNTRIES.Poland
      );

      expect(result).toHaveLength(2);
    });

    it("should return undefined when top level field is not an array", () => {
      const instance = {
        names: "not an array",
        nameTranslations: [],
      };

      const result = getTranslationList(
        "names.[].",
        "nameTranslations.[].",
        instance,
        COUNTRIES.Poland
      );

      expect(result).toBeUndefined();
    });

    it("should return undefined when translation key is not an array", () => {
      const instance = {
        names: ["Item 1"],
        nameTranslations: "not an array",
      };

      const result = getTranslationList(
        "names.[].",
        "nameTranslations.[].",
        instance,
        COUNTRIES.Poland
      );

      expect(result).toBeUndefined();
    });

    it("should return undefined for invalid language", () => {
      const instance = {
        names: ["Item 1"],
        nameTranslations: [[{ language: COUNTRIES.Poland, value: "Przedmiot 1" }]],
      };

      const result = getTranslationList(
        "names.[].",
        "nameTranslations.[].",
        instance,
        "INVALID" as COUNTRIES
      );

      expect(result).toBeUndefined();
    });

    it("should handle empty array", () => {
      const instance = {
        names: [],
        nameTranslations: [],
      };

      const result = getTranslationList(
        "names.[].",
        "nameTranslations.[].",
        instance,
        COUNTRIES.Poland
      );

      expect(result).toEqual([]);
    });
  });

  describe("getTranslationListList", () => {
    it("should return array of transformed objects with translations", () => {
      const instance = {
        items: [
          [
            {
              value: "Val 1",
            },
            {
              value: "Val 2",
            },
          ],
          [
            {
              value: "Val 3",
            },
          ],
        ],
        itemsTranslations: [
          [
            [{ language: COUNTRIES.Poland, value: "Wartość 1" }],
            [{ language: COUNTRIES.Poland, value: "Wartość 2" }],
          ],
          [
            [{ language: COUNTRIES.Poland, value: "Wartość 3" }],
          ],
        ],
      };

      const result = getTranslationListList(
        "items.[].[].",
        "itemsTranslations.[].[].",
        instance,
        COUNTRIES.Poland
      );

      expect(result).toHaveLength(2);
      expect(result?.[0]).toHaveLength(2);
      expect(result?.[1]).toHaveLength(1);
    });

    it("should spread original object and preserve all properties", () => {
      const instance = {
        items: [
          [
            {
              value: "Val 1",
              id: "123",
            },
          ],
        ],
        itemsTranslations: [
          [
            [{ language: COUNTRIES.Poland, value: "Wartość 1" }],
          ],
        ],
      };

      const result = getTranslationListList(
        "items.[].[].",
        "itemsTranslations.[].[].",
        instance,
        COUNTRIES.Poland
      );

      expect(result?.[0]?.[0]?.id).toBe("123");
      expect(result?.[0]?.[0]?.value).toBeDefined();
    });

    it("should return undefined when top level is not an array", () => {
      const instance = {
        items: "not an array",
        itemsTranslations: [],
      };

      const result = getTranslationListList(
        "items.[].[].",
        "itemsTranslations.[].[].",
        instance,
        COUNTRIES.Poland
      );

      expect(result).toBeUndefined();
    });

    it("should handle when translation item is not an array", () => {
      const instance = {
        items: [
          [
            {
              value: "Val 1",
            },
          ],
        ],
        itemsTranslations: [
          [
            "not an array",
          ],
        ],
      };

      const result = getTranslationListList(
        "items.[].[].",
        "itemsTranslations.[].[].",
        instance,
        COUNTRIES.Poland
      );

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
    });

    it("should return undefined for invalid language", () => {
      const instance = {
        items: [
          [
            {
              value: "Val 1",
            },
          ],
        ],
        itemsTranslations: [
          [
            [{ language: COUNTRIES.Poland, value: "Wartość 1" }],
          ],
        ],
      };

      const result = getTranslationListList(
        "items.[].[].",
        "itemsTranslations.[].[].",
        instance,
        "INVALID" as COUNTRIES
      );

      expect(result).toBeUndefined();
    });

    it("should handle non-array items in second level by returning empty arrays", () => {
      const instance = {
        items: [
          "not an array",
          [
            {
              value: "Val 1",
            },
          ],
        ],
        itemsTranslations: [
          [
            [{ language: COUNTRIES.Poland, value: "Wartość 1" }],
          ],
          [
            [{ language: COUNTRIES.Poland, value: "Wartość 2" }],
          ],
        ],
      };

      const result = getTranslationListList(
        "items.[].[].",
        "itemsTranslations.[].[].",
        instance,
        COUNTRIES.Poland
      );

      expect(result).toHaveLength(2);
      expect(result?.[0]).toEqual([]);
      expect(result?.[1]).toHaveLength(1);
    });

    it("should handle empty nested arrays", () => {
      const instance = {
        items: [[], []],
        itemsTranslations: [[], []],
      };

      const result = getTranslationListList(
        "items.[].[].",
        "itemsTranslations.[].[].",
        instance,
        COUNTRIES.Poland
      );

      expect(result).toEqual([[], []]);
    });

    it("should preserve other properties in mapped items", () => {
      const instance = {
        items: [
          [
            {
              id: "id1",
              name: "Name1",
              value: "Val 1",
              extra: { data: "extra" },
            },
          ],
        ],
        itemsTranslations: [
          [
            [{ language: COUNTRIES.Poland, value: "Wartość 1" }],
          ],
        ],
      };

      const result = getTranslationListList(
        "items.[].[].",
        "itemsTranslations.[].[].",
        instance,
        COUNTRIES.Poland
      );

      expect(result?.[0]?.[0]?.id).toBe("id1");
      expect(result?.[0]?.[0]?.name).toBe("Name1");
      expect(result?.[0]?.[0]?.extra).toEqual({ data: "extra" });
    });
  });
});
