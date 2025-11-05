import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from 'lucide-react';
import EmailStep from './email-step';
import OTPStep from './otp-step';
import NewPasswordStep from './new-password-step';
import { useState } from 'react';

const STEP_KEYS = {
	EMAIL_STEP: 'EMAIL_STEP',
	OTP_STEP: 'OTP_STEP',
	NEW_PASSWORD_STEP: 'NEW_PASSWORD_STEP',
};

const RESET_PASSWORD_FORM_STEPS = [
	{
		key: STEP_KEYS.EMAIL_STEP,
		component: EmailStep,
	},
	{
		key: STEP_KEYS.OTP_STEP,
		component: OTPStep,
	},
	{
		key: STEP_KEYS.NEW_PASSWORD_STEP,
		component: NewPasswordStep,
	},
];

export default function ResetPasswordForm({
	setIsResetPasswordFormVisible,
	email,
	setEmail,
}) {
	const [currentStepNumber, setCurrentStepNumber] = useState(0);
	const [resetToken, setResetToken] = useState('');

	const handleBackClick = () => {
		if (currentStepNumber === 0) {
			setIsResetPasswordFormVisible(false);
			return;
		} else {
			setCurrentStepNumber(currentStepNumber - 1);
		}
	};

	const CurrentStepComponent =
		RESET_PASSWORD_FORM_STEPS[currentStepNumber]?.component;

	const redirectToNextStep = () => {
		setCurrentStepNumber(currentStepNumber + 1);
	};

	return (
		<div className="">
			<div className="mb-10">
				<Button
					variant="ghost"
					className="text-[#00000099] border border-[#0000001A] flex gap-1 hover:bg-[#fff] hover:text-[#00000099]"
					size="sm"
					onClick={handleBackClick}
				>
					<ArrowLeftIcon className="w-4 h-4" />
					Back
				</Button>
			</div>

			{CurrentStepComponent && (
				<CurrentStepComponent
					redirectToNextStep={redirectToNextStep}
					redirectToPreviousStep={handleBackClick}
					email={email}
					setEmail={setEmail}
					setIsResetPasswordFormVisible={setIsResetPasswordFormVisible}
					resetToken={resetToken}
					setResetToken={setResetToken}
				/>
			)}
		</div>
	);
}
