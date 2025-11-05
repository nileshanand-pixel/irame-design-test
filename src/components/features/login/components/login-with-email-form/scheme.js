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
			},
		),
	password: z.string().min(1, {
		message: 'Password is required',
	}),
});
