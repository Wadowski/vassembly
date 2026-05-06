import z from "zod";

export const DELETE_ACCOUNT_HANDLER_SCHEMA = z.object({
  userId: z.string().min(1),
});
