import z from "zod";

const OBJECT_ID_HEX = /^[a-f\d]{24}$/i;

export const DELETE_ACCOUNT_COMMAND_SCHEMA = z.object({
  userId: z.string().regex(OBJECT_ID_HEX, {
    message: "userId must be a 24 character hexadecimal MongoDB ObjectId string",
  }),
});
