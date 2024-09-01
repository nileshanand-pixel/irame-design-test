import { z } from 'zod';

export const LoginFormSchema = z.object({
  email: z
    .string()
    .trim() // Strip whitespace from both ends
    .refine(
      (value) =>
        value.length === 0 || z.string().email().safeParse(value).success,
      {
        message: 'Invalid email address',
      }
    ),
  password: z
    .string()
    .refine(
      (value) =>
        value.length === 0 || z.string().min(6).safeParse(value).success,
      {
        message: 'Password must be at least 6 characters',
      }
    ),
});


