import { Button } from '@/components/ui/button';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { OtpStepSchema } from './scheme';
import { useMutation } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { resendOtp, verifyOtp } from '../../../service/auth.service';
import { useState, useEffect } from 'react';

export default function OTPStep({
	email: emailProp,
	redirectToPreviousStep,
	redirectToNextStep,
	resetToken,
}) {
	const [countdown, setCountdown] = useState(30);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting, isValid },
		watch,
	} = useForm({
		defaultValues: {
			otp: '',
		},
		resolver: zodResolver(OtpStepSchema),
		mode: 'onChange',
	});

	const otp = watch('otp');

	// Countdown timer effect
	useEffect(() => {
		if (countdown > 0) {
			const timer = setTimeout(() => {
				setCountdown(countdown - 1);
			}, 1000);
			return () => clearTimeout(timer);
		}
	}, [countdown]);

	const { mutate: verifyOtpMutation, isPending: isVerifyOtpPending } = useMutation(
		{
			mutationFn: async (data) => {
				return await verifyOtp(data);
			},
			onSuccess: () => {
				toast.success('OTP verified');
				redirectToNextStep?.();
			},
			onError: (error) => {
				toast.error(
					error?.response?.data?.message || 'Failed to verify OTP',
				);
			},
		},
	);

	const { mutate: resendOtpMutation, isPending: isResendOtpPending } = useMutation(
		{
			mutationFn: async (data) => {
				return await resendOtp(data);
			},
			onSuccess: () => {
				toast.success('OTP resent');
				setCountdown(30); // Reset countdown after successful resend
			},
			onError: (error) => {
				toast.error(
					error?.response?.data?.message || 'Failed to resend OTP',
				);
			},
		},
	);

	const onSubmit = (data) => {
		if (!data.otp || data.otp.length < 4 || !emailProp || isVerifyOtpPending) {
			return;
		}
		verifyOtpMutation({ otp: data.otp, reset_token: resetToken });
	};

	const handleResendOtp = () => {
		if (isResendOtpPending || countdown > 0) {
			return;
		}
		resendOtpMutation({ reset_token: resetToken });
	};
	return (
		<div className="flex flex-col gap-6">
			<div className="text-[#26064A]">
				<div className="text-[1.75rem] font-semibold">Enter OTP</div>
				<div className="text-sm">
					Please enter the OTP code we’ve sent you on{' '}
				</div>
			</div>

			<div>
				<div>
					<label
						htmlFor="email"
						className="block text-sm font-medium text-gray-700"
					>
						Email
					</label>

					<div className="relative">
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

						<Button
							variant="ghost"
							className="text-[#6A12CD] text-sm font-medium absolute right-0 bottom-0 hover:bg-transparent hover:text-[#6A12CD]"
							size="sm"
							onClick={() => {
								redirectToPreviousStep?.();
							}}
						>
							Change
						</Button>
					</div>
				</div>

				<form
					onSubmit={handleSubmit(onSubmit)}
					className="space-y-[7rem] mt-4"
				>
					<div>
						<label
							htmlFor="otp"
							className="block text-sm font-medium text-gray-700"
						>
							OTP
						</label>
						<input
							id="otp"
							type="text"
							{...register('otp')}
							className="mt-1 block w-full px-3 py-2 bg-transparent border border-[#0000001A] rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
						/>
						{errors.otp && (
							<p className="mt-2 text-sm text-red-600" id="otp-error">
								{errors.otp.message}
							</p>
						)}
					</div>

					<Button
						type="submit"
						disabled={
							isSubmitting ||
							!isValid ||
							!otp.length ||
							!emailProp ||
							isVerifyOtpPending
						}
						className={`w-full text-white bg-primary hover:bg-purple-80/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center ${
							isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
						}`}
					>
						{isVerifyOtpPending ? 'Verifying OTP...' : 'Continue'}
					</Button>
				</form>

				<Button
					variant="outline"
					onClick={handleResendOtp}
					className={'w-full mt-3'}
					disabled={countdown > 0 || isResendOtpPending}
				>
					{isResendOtpPending
						? 'Resending OTP...'
						: countdown > 0
							? `Resend OTP (${countdown}s)`
							: 'Resend OTP'}
				</Button>
			</div>
		</div>
	);
}
