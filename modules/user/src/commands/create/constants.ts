import z from "zod";

export const CREATE_USER_VALIDATION_SCHEMA = z.object({
  email: z.email(),
  passwordHash: z.string(),
  firstName: z.string(),
  lastName: z.string(),
});

export const PASSWORD_VALIDATION_SCHEMA = z.object({
  password: z.string().min(8).max(100).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number and one special character",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});