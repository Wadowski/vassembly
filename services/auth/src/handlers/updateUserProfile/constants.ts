import z from "zod";

const NAME_FIELD_SCHEMA = z
  .string()
  .trim()
  .min(1, "Name must be between 1 and 80 characters")
  .max(80, "Name must be between 1 and 80 characters");

export const UPDATE_USER_PROFILE_INPUT_SCHEMA = z
  .object({
    userId: z.string().min(1),
    firstName: NAME_FIELD_SCHEMA.optional(),
    lastName: NAME_FIELD_SCHEMA.optional(),
  })
  .refine(
    (data) => data.firstName !== undefined || data.lastName !== undefined,
    {
      message: "At least one of first name or last name is required",
    },
  );
