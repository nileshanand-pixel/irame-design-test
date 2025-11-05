import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { EmailStepSchema } from './scheme';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { sendOtpToEmail } from '../../../service/auth.service';
import { toast } from '@/lib/toast';

export default function EmailStep({
	email: emailProp,
	setEmail,
	redirectToNextStep,
	setResetToken,
}) {
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting, isValid },
		watch,
		setValue,
	} = useForm({
		defaultValues: {
			email: emailProp || '',
		},
		resolver: zodResolver(EmailStepSchema),
		mode: 'onChange',
	});

	// Set email value from prop when it changes
	useEffect(() => {
		if (emailProp) {
			setValue('email', emailProp, { shouldValidate: true });
		}
	}, [emailProp, setValue]);

	const { mutate: sendOtpToEmailMutation, isPending: isSendOtpToEmailPending } =
		useMutation({
			mutationFn: async (data) => {
				return await sendOtpToEmail(data);
			},
			onSuccess: (data) => {
				setResetToken(data?.reset_token);
				toast.success('OTP sent to email');
				redirectToNextStep?.();
			},
			onError: (error) => {
				toast.error(error?.response?.data?.message || 'Failed to send OTP');
			},
		});
	const onSubmit = (data) => {
		if (!data.email || isSendOtpToEmailPending) {
			return;
		}
		sendOtpToEmailMutation({ email: data.email });
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="text-[#26064A]">
				<div className="text-[1.75rem] font-semibold">Forgot password</div>
				<div className="text-sm">
					Receive an OTP on your email to reset your password.
				</div>
			</div>

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-[10rem]">
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
						{...register('email', {
							onChange: (e) => {
								// Update parent component if needed
								if (setEmail) {
									setEmail(e.target.value);
								}
							},
						})}
						className="mt-1 block w-full px-3 py-2 bg-transparent border border-[#0000001A] rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
					/>
					{errors.email && (
						<p className="mt-2 text-sm text-red-600" id="email-error">
							{errors.email.message}
						</p>
					)}
				</div>

				<Button
					type="submit"
					disabled={
						isSubmitting ||
						!isValid ||
						!emailProp ||
						isSendOtpToEmailPending
					}
					className={`w-full text-white bg-primary hover:bg-purple-80/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center ${
						isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
					}`}
				>
					{isSendOtpToEmailPending ? 'Sending OTP...' : 'Continue'}
				</Button>
			</form>
		</div>
	);
}
