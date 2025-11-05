import { z } from 'zod';

export const EmailStepSchema = z.object({
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
});
