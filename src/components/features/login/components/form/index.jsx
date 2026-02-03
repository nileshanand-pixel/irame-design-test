import { useState } from 'react';
import ResetPasswordForm from '../reset-password-form';
import LoginWithEmailForm from '../login-with-email-form';
import SSOLoginForm from '../sso-login-form';

export default function Form({ setIsLoading, email, setEmail }) {
	const [isResetPasswordFormVisible, setIsResetPasswordFormVisible] =
		useState(false);

	const isRecaptchaEnabled = import.meta.env.VITE_IS_RECAPTCHA_ENABLED === 'true';

	return (
		<>
			{isResetPasswordFormVisible ? (
				<ResetPasswordForm
					setIsResetPasswordFormVisible={setIsResetPasswordFormVisible}
					email={email}
					setEmail={setEmail}
				/>
			) : (
				<div>
					<div className="mb-10">
						<h1 className="text-primary100 text-[1.75rem] leading-10 font-semilbold">
							Let's Start
						</h1>
						<p className="text-sm text-primary100">
							Enter your Email to Login
						</p>
					</div>
					<LoginWithEmailForm
						setIsLoading={setIsLoading}
						email={email}
						setEmail={setEmail}
						setIsResetPasswordFormVisible={setIsResetPasswordFormVisible}
					/>
					<SSOLoginForm setIsLoading={setIsLoading} />
					{isRecaptchaEnabled && (
						<p className="text-xs text-primary60 mt-4 text-center">
							This site is protected by reCAPTCHA and the Google{' '}
							<a
								href="https://policies.google.com/privacy"
								className="text-primary80 underline"
							>
								Privacy Policy
							</a>{' '}
							and{' '}
							<a
								href="https://policies.google.com/terms"
								className="text-primary80 underline"
							>
								Terms of Service
							</a>{' '}
							apply.
						</p>
					)}
				</div>
			)}
		</>
	);
}
