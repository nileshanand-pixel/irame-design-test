import { z } from 'zod';

export const OtpStepSchema = z.object({
	otp: z
		.string()
		.trim() // Strip whitespace from both ends
		.refine((value) => value.length === 0 || value.length >= 6, {
			message: 'Enter 6 digit verification code',
		}),
});
