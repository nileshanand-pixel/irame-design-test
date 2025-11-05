import { Button } from '@/components/ui/button';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { NewPasswordSchema } from './scheme';
import ResetSuccessModal from './reset-success-modal';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { resetPassword } from '../../../service/auth.service';

export default function NewPasswordStep({
	email: emailProp,
	setIsResetPasswordFormVisible,
	resetToken,
}) {
	const [isResetSuccessModalOpen, setIsResetSuccessModalOpen] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting, isValid },
		watch,
	} = useForm({
		defaultValues: {
			password: '',
			confirmPassword: '',
		},
		resolver: zodResolver(NewPasswordSchema),
		mode: 'onChange',
	});

	const passwordValue = watch('password');
	const confirmPasswordValue = watch('confirmPassword');
	const isPasswordValid =
		passwordValue &&
		passwordValue.length >= 8 &&
		/[a-zA-Z]/.test(passwordValue) &&
		/[0-9]/.test(passwordValue);

	const { mutate: resetPasswordMutation, isPending: isResetPasswordPending } =
		useMutation({
			mutationFn: async (data) => {
				return await resetPassword(data);
			},
			onSuccess: () => {
				toast.success('Password reset successfully');
				setIsResetSuccessModalOpen(true);
			},
			onError: (error) => {
				toast.error('Failed to reset password');
			},
		});

	const onSubmit = (data) => {
		if (
			!data.password ||
			!data.confirmPassword ||
			!emailProp ||
			isResetPasswordPending
		) {
			return;
		}
		resetPasswordMutation({
			new_password: data.password,
			reset_token: resetToken,
		});
	};

	const onResetSuccessModalClose = () => {
		setIsResetSuccessModalOpen(false);
		setIsResetPasswordFormVisible(false);
	};

	return (
		<div className="flex flex-col gap-6">
			<ResetSuccessModal
				isOpen={isResetSuccessModalOpen}
				onClose={onResetSuccessModalClose}
			/>
			<div className="text-[#26064A]">
				<div className="text-[1.75rem] font-semibold">Reset Password</div>
				<div className="text-sm">
					Enter your new password to reset your account access.{' '}
				</div>
			</div>

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
				<div className="space-y-6">
					<div>
						<label
							htmlFor="email"
							className="block text-sm font-medium text-gray-700"
						>
							Email
						</label>
						<input
							id="email"
							type="email"
							autoComplete="email"
							value={emailProp}
							style={{
								background:
									'linear-gradient(0deg, rgba(106, 18, 205, 0.04) 0%, rgba(106, 18, 205, 0.04) 100%), rgba(255, 255, 255, 0.40)',
							}}
							disabled
							className="mt-1 block w-full px-3 py-2 bg-transparent border border-[#0000001A] rounded-md shadow-sm text-sm"
						/>
					</div>

					<div>
						<label
							htmlFor="password"
							className="block text-sm font-medium text-gray-700"
						>
							Password
						</label>
						<div className="relative">
							<input
								id="password"
								type={showPassword ? 'text' : 'password'}
								autoComplete="new-password"
								{...register('password')}
								className="mt-1 block w-full px-3 py-2 pr-10 bg-transparent border border-[#0000001A] rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
							/>
							{passwordValue && (
								<button
									type="button"
									className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
									onClick={() => setShowPassword(!showPassword)}
									tabIndex={-1}
								>
									<i
										className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}
									></i>
								</button>
							)}
						</div>
						{errors.password && (
							<p
								className="mt-2 text-sm text-red-600"
								id="password-error"
							>
								{errors.password.message}
							</p>
						)}
					</div>

					<div>
						<label
							htmlFor="confirmPassword"
							className="block text-sm font-medium text-gray-700"
						>
							Confirm Password
						</label>
						<div className="relative">
							<input
								id="confirmPassword"
								type={showConfirmPassword ? 'text' : 'password'}
								autoComplete="new-password"
								disabled={!isPasswordValid}
								{...register('confirmPassword')}
								className="mt-1 block w-full px-3 py-2 pr-10 bg-transparent border border-[#0000001A] rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
							/>
							{confirmPasswordValue && (
								<button
									type="button"
									className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
									onClick={() =>
										setShowConfirmPassword(!showConfirmPassword)
									}
									tabIndex={-1}
								>
									<i
										className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}
									></i>
								</button>
							)}
						</div>
						{errors.confirmPassword && (
							<p
								className="mt-2 text-sm text-red-600"
								id="confirmPassword-error"
							>
								{errors.confirmPassword.message}
							</p>
						)}
					</div>
				</div>

				<Button
					type="submit"
					disabled={isSubmitting || !isValid || isResetPasswordPending}
					className={`w-full text-white bg-primary hover:bg-purple-80/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center ${
						isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
					}`}
				>
					{isResetPasswordPending
						? 'Resetting Password...'
						: 'Reset Password'}
				</Button>
			</form>
		</div>
	);
}
