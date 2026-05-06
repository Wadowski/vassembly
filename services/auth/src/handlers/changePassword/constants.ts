import z from "zod";

export const CHANGE_PASSWORD_HANDLER_SCHEMA = z.object({
  userId: z.string().min(1),
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(1, "New password is required"),
});
