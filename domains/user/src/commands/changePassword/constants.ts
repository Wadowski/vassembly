import z from "zod";

const OBJECT_ID_HEX = /^[a-f\d]{24}$/i;

export const CHANGE_PASSWORD_INPUT_SCHEMA = z.object({
  userId: z.string().regex(OBJECT_ID_HEX, {
    message:
      "userId must be a 24 character hexadecimal MongoDB ObjectId string",
  }),
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(1, "New password is required"),
});
