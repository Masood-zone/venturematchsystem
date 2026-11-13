import { z } from "zod";

const email = z.string().trim().email("Enter a valid email address.");
const newPassword = z.string()
  .min(12, "Use at least 12 characters.")
  .max(128, "Use no more than 128 characters.");

export const forgotPasswordSchema = z.object({ email });
export const resetPasswordSchema = z.object({
  password: newPassword,
  confirmPassword: z.string().min(1, "Confirm your password."),
}).refine((values) => values.password === values.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
  remember: z.boolean(),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Enter your full name."),
  email,
  programme: z.string().trim().min(1, "Choose your programme."),
  password: newPassword,
  confirmPassword: z.string().min(1, "Confirm your password."),
  agreement: z
    .boolean()
    .refine(
      (value) => value,
      "Please agree to the collaboration guidelines to continue.",
    ),
}).refine((values) => values.password === values.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
