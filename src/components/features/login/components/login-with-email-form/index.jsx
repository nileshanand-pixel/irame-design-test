import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { LoginFormSchema } from './scheme';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { trackEvent, trackUser } from '@/lib/mixpanel';
import { authUserDetails, login } from '../../service/auth.service';
import { createOrUpdateUserSession } from '@/components/features/user-session-manager/helper';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { updateAuthStoreProp } from '@/redux/reducer/authReducer';
import { logError } from '@/lib/logger';
import { toast } from '@/lib/toast';
import { useEffect, useRef, useState } from 'react';
import { REDIRECTION_URL_AFTER_LOGIN } from '@/constants/login-constants';
import ReCAPTCHA from 'react-google-recaptcha';

export default function LoginWithEmailForm({
	setIsLoading,
	email: emailProp,
	setEmail,
	setIsResetPasswordFormVisible,
}) {
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState('');
	const recaptchaRef = useRef(null);

	const navigate = useNavigate();
	const dispatch = useDispatch();

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting, isValid },
		watch,
		setValue,
	} = useForm({
		defaultValues: {
			email: emailProp || '',
			password: '',
		},
		resolver: zodResolver(LoginFormSchema),
		mode: 'onChange',
	});

	// Set email value from prop when it changes
	useEffect(() => {
		if (emailProp) {
			setValue('email', emailProp, { shouldValidate: true });
		}
	}, [emailProp, setValue]);

	const togglePasswordVisibility = () => {
		setShowPassword((prevState) => !prevState);
	};

	const password = watch('password');

	const handleContinue = async (formData) => {
		trackEvent(EVENTS_ENUM.CONTINUE_CLICKED, EVENTS_REGISTRY.CONTINUE_CLICKED);
		handleEmailLogin(formData);
	};

	const getErrorAnalyticsProps = (error) => {
		return {
			errorCode: error?.code,
			errorMessage: error?.message,
		};
	};

	const handleEmailLogin = async (data) => {
		setIsLoading(true);
		try {
			trackEvent(
				EVENTS_ENUM.CREDENTIALS_LOGIN_ATTEMPTED,
				EVENTS_REGISTRY.CREDENTIALS_LOGIN_ATTEMPTED,
			);
			const [response, status_code] = await login(data);

			const authUserData = await authUserDetails();
			localStorage.setItem('userDetails', JSON.stringify(authUserData));

			// Set user_id in Redux store
			const userId =
				authUserData.user_id ||
				authUserData.id ||
				authUserData.sub ||
				authUserData.userId;
			if (userId) {
				dispatch(
					updateAuthStoreProp([
						{
							key: 'user_id',
							value: userId,
						},
					]),
				);
			}

			trackEvent(
				EVENTS_ENUM.LOGIN_SUCCESSFUL,
				EVENTS_REGISTRY.LOGIN_SUCCESSFUL,
				() => ({
					type: 'credentials',
					login_type: 'login',
				}),
			);
			trackUser(authUserData);
			createOrUpdateUserSession('/app/new-chat');
			navigate(REDIRECTION_URL_AFTER_LOGIN);
		} catch (error) {
			logError(error, { feature: 'login', action: 'email-login' });
			trackEvent(
				EVENTS_ENUM.LOGIN_FAILURE,
				EVENTS_REGISTRY.LOGIN_FAILURE,
				() => ({
					type: 'credentials',
					login_type: 'login',
					...getErrorAnalyticsProps(error),
				}),
			);

			if (error?.code === 'ERR_BAD_REQUEST') {
				logError(error, {
					feature: 'authentication',
					action: 'credentials_login',
					extra: {
						errorCode: error?.code,
					},
				});
				toast.error('Login failed. Invalid Credentials.');
			} else {
				logError(error, {
					feature: 'authentication',
					action: 'credentials_login',
					extra: {
						errorCode: error?.code,
						errorMessage: error?.message,
					},
				});
				toast.error('Login failed. Unknown Error Please Try Again.');
			}
		} finally {
			setTimeout(() => {
				setIsLoading(false);
			}, 2000);
		}
	};

	const isRecaptchaEnabled = import.meta.env.VITE_IS_RECAPTCHA_ENABLED === 'true';

	const onSubmit = async (data) => {
		if (!data.email || !data.password) {
			return;
		}

		let captchaToken = '';
		if (isRecaptchaEnabled) {
			captchaToken = await recaptchaRef.current.executeAsync();

			if (!captchaToken) {
				setError('Recaptcha verification failed! Try again.');
				return;
			} else {
				setError('');
				console.log(captchaToken, 'captchaToken');
			}
		}

		handleContinue({
			...data,
			captchaToken: captchaToken,
		});
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-[3rem]">
			<div className="space-y-2">
				<div className="space-y-5">
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
							<p
								className="mt-2 text-sm text-red-600"
								id="email-error"
							>
								{errors.email.message}
							</p>
						)}
					</div>

					<div>
						<label
							htmlFor="password"
							className="block text-sm font-medium text-gray-700"
						>
							Password
						</label>
						<div className="relative mt-1">
							<input
								id="password"
								autoComplete="current-password"
								type={showPassword ? 'text' : 'password'}
								{...register('password')}
								className="block w-full px-3 py-2 border border-[#0000001A] rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-transparent"
							/>
							{password && (
								<button
									type="button"
									className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
									onClick={togglePasswordVisibility}
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
				</div>

				<div>
					<span
						variant="ghost"
						className="p-0 font-medium text-sm text-[#6A12CD] cursor-pointer"
						onClick={() => setIsResetPasswordFormVisible(true)}
					>
						Forgot Password?
					</span>
				</div>

				{isRecaptchaEnabled && (
					<ReCAPTCHA
						ref={recaptchaRef}
						sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
						size="invisible"
					/>
				)}
			</div>

			<div className="flex flex-col gap-1">
				{error && <div className="text-xs text-red-500">{error}</div>}

				<Button
					type="submit"
					disabled={isSubmitting || !isValid}
					className={`w-full text-white bg-primary hover:bg-purple-80/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center ${
						isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
					}`}
				>
					Continue
				</Button>
			</div>
		</form>
	);
}
