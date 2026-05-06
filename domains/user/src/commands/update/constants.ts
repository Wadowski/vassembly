import z from "zod";

const NAME_FIELD_SCHEMA = z
  .string()
  .trim()
  .min(1, "Name must be between 1 and 80 characters")
  .max(80, "Name must be between 1 and 80 characters");

export const UPDATE_USER_VALIDATION_SCHEMA = z.object({
  firstName: NAME_FIELD_SCHEMA.optional(),
  lastName: NAME_FIELD_SCHEMA.optional(),
  verifiedAt: z.date().optional(),
});
