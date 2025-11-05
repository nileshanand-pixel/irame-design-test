import { z } from 'zod';

export const NewPasswordSchema = z
	.object({
		password: z.string().refine(
			(value) => {
				if (value.length === 0) return true;
				// Check minimum length of 8
				if (value.length < 8) return false;
				// Check for at least one uppercase letter
				const hasUppercase = /[A-Z]/.test(value);
				// Check for at least one lowercase letter
				const hasLowercase = /[a-z]/.test(value);
				// Check for at least one digit
				const hasDigit = /[0-9]/.test(value);
				// Check for at least one special character
				const hasSpecialChar = /[@$!%*?&]/.test(value);
				return hasUppercase && hasLowercase && hasDigit && hasSpecialChar;
			},
			{
				message:
					'Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one digit, and one special character (@$!%*?&)',
			},
		),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ['confirmPassword'],
	});
