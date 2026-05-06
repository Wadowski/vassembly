import z from "zod";

const MONGODB_OBJECT_ID_HEX = /^[a-f\d]{24}$/i;

export const USER_ID_VALIDATION_SCHEMA = z.object({
  id: z.string().regex(MONGODB_OBJECT_ID_HEX, {
    message:
      "id must be a 24 character hexadecimal MongoDB ObjectId string",
  }),
});
