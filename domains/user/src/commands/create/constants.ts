import z from "zod";

export const CREATE_USER_VALIDATION_SCHEMA = z.object({
  email: z.email(),
  passwordHash: z.string(),
  firstName: z.string(),
  lastName: z.string(),
});

export const PASSWORD_VALIDATION_SCHEMA = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(100, "Password must be at most 100 characters long")
    .refine((password: string) => /[a-z]/.test(password), {
      message: "Password must contain at least one lowercase letter",
    })
    .refine((password: string) => /[A-Z]/.test(password), {
      message: "Password must contain at least one uppercase letter",
    })
    .refine((password: string) => /\d/.test(password), {
      message: "Password must contain at least one number",
    })
    .refine((password: string) => /[!@#$%^&*()_+\-=\[\]{};:'",.<>?/\\|~`]/.test(password), {
      message: "Password must contain at least one special character",
    }),
});