import { useState } from 'react';
import ResetPasswordForm from '../reset-password-form';
import LoginWithEmailForm from '../login-with-email-form';
import SSOLoginForm from '../sso-login-form';

export default function Form({ setIsLoading, email, setEmail }) {
	const [isResetPasswordFormVisible, setIsResetPasswordFormVisible] =
		useState(false);

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
				</div>
			)}
		</>
	);
}
