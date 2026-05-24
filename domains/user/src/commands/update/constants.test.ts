import { describe, it, expect } from "vitest";
import { validatorFactory } from "@vassembly/validation";

import { UPDATE_USER_VALIDATION_SCHEMA } from "./constants";

const validateUpdateUser = validatorFactory(UPDATE_USER_VALIDATION_SCHEMA);

describe("UPDATE_USER_VALIDATION_SCHEMA", () => {
  it("should accept trimmed names within length bounds", () => {
    expect(
      validateUpdateUser({
        firstName: "  Pat  ",
      }).success,
    ).toBe(true);
  });

  it("should reject names longer than 80 characters", () => {
    expect(
      validateUpdateUser({
        firstName: "x".repeat(81),
      }).success,
    ).toBe(false);
  });

  it("should reject names that are empty after trimming", () => {
    expect(
      validateUpdateUser({
        firstName: "     ",
      }).success,
    ).toBe(false);
  });

  it("should accept updates without firstName", () => {
    expect(
      validateUpdateUser({
        lastName: "Example",
      }).success,
    ).toBe(true);
  });

  it("should accept updates without any name fields", () => {
    expect(
      validateUpdateUser({
        verifiedAt: new Date(),
      }).success,
    ).toBe(true);
  });
});
