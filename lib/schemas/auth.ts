import { z } from "zod";

export const signupSchema = z.object({
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number starting with 6-9"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  terms: z.boolean().refine((val) => val === true, "You must agree to the terms and privacy policy"),
});

export type SignupFormData = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number starting with 6-9"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
