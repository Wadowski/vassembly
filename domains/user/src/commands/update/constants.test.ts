import { describe, it, expect } from "vitest";

import { UPDATE_USER_VALIDATION_SCHEMA } from "./constants";

describe("UPDATE_USER_VALIDATION_SCHEMA", () => {
  it("should accept trimmed names within length bounds", () => {
    expect(
      UPDATE_USER_VALIDATION_SCHEMA.safeParse({
        firstName: "  Pat  ",
      }).success,
    ).toBe(true);
  });

  it("should reject names longer than 80 characters", () => {
    expect(
      UPDATE_USER_VALIDATION_SCHEMA.safeParse({
        firstName: "x".repeat(81),
      }).success,
    ).toBe(false);
  });

  it("should reject names that are empty after trimming", () => {
    expect(
      UPDATE_USER_VALIDATION_SCHEMA.safeParse({
        firstName: "     ",
      }).success,
    ).toBe(false);
  });

  it("should accept updates without firstName", () => {
    expect(
      UPDATE_USER_VALIDATION_SCHEMA.safeParse({
        lastName: "Example",
      }).success,
    ).toBe(true);
  });

  it("should accept updates without any name fields", () => {
    expect(
      UPDATE_USER_VALIDATION_SCHEMA.safeParse({
        verifiedAt: new Date(),
      }).success,
    ).toBe(true);
  });
});
