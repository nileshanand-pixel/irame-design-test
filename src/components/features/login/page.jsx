import React, { useEffect, useState } from 'react';
import { useRouter } from '@/hooks/useRouter';
import BoxLoader from '@/components/elements/loading/BoxLoader';
import Form from './components/form';
import { authUserDetails, ssoLogin } from './service/auth.service';
import { getErrorAnalyticsProps, trackEvent } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { useNavigate } from 'react-router-dom';
import { logError } from '@/lib/logger';
import { toast } from '@/lib/toast';
import useAuth from '@/hooks/useAuth';

const REDIRECTION_URL_AFTER_LOGIN = '/app/home?source=login';

const SignInSignUp = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [email, setEmail] = useState('');

	const router = useRouter();
	const navigate = useNavigate();
	const hasCode = Boolean(router.query?.code);
	const authResult = !hasCode ? useAuth() : { isAuthenticated: false };
	const { isAuthenticated } = authResult;

	const bgStyles = {
		background:
			'linear-gradient(180deg, rgba(255, 255, 255, 0.40) 1.14%, rgba(255, 255, 255, 0.16) 98.72%), rgba(106, 18, 205, 0.02)',
		backdropFilter: 'blur(60px)',
		WebkitBackdropFilter: 'blur(60px)',
	};

	const handleGoogleLogin = () => {
		ssoLogin({ code: router?.query?.code })
			.then(async (response) => {
				const [responseData, status_code] = response;
				if (status_code === 200) {
					const authUserData = await authUserDetails();
					localStorage.setItem(
						'userDetails',
						JSON.stringify(authUserData),
					);
					trackEvent(
						EVENTS_ENUM.LOGIN_SUCCESSFUL,
						EVENTS_REGISTRY.LOGIN_SUCCESSFUL,
						() => ({
							type: 'sso',
							login_type: 'login',
							team_name: authUserData.team_name,
						}),
					);
					navigate(REDIRECTION_URL_AFTER_LOGIN);
				} else {
					const params = new URLSearchParams(window.location.search);
					params.delete('code');
					window.history.replaceState(
						{},
						'',
						`${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`,
					);
					logError(new Error('SSO login failed with non-200 status'), {
						feature: 'authentication',
						action: 'sso_login_non_200',
						extra: {
							statusCode: status_code,
						},
					});
					toast.error(
						'Login failed. Please check your credentials and try again.',
					);
					// createSession();
					navigate(REDIRECTION_URL_AFTER_LOGIN);
				}
			})
			.catch((error) => {
				logError(error, { feature: 'login', action: 'google-login' });
				const params = new URLSearchParams(window.location.search);
				params.delete('code');
				window.history.replaceState(
					{},
					'',
					`${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`,
				);
				trackEvent(
					EVENTS_ENUM.LOGIN_FAILURE,
					EVENTS_REGISTRY.LOGIN_FAILURE,
					() => ({
						type: 'sso',
						login_type: 'login',
						...getErrorAnalyticsProps(error),
					}),
				);
				logError(error, {
					feature: 'authentication',
					action: 'sso_login',
					extra: {
						errorCode: error?.code,
						errorMessage: error?.message,
					},
				});
				toast.error('An error occurred during login. Please try again.');
			})
			.finally(() => {
				setIsLoading(false);
			});
	};

	useEffect(() => {
		if (router.query?.code) {
			setIsLoading(true);
			handleGoogleLogin();
		}
	}, [router.query?.code]);

	useEffect(() => {
		if (!hasCode && isAuthenticated) {
			navigate(REDIRECTION_URL_AFTER_LOGIN);
		} else if (!hasCode && !isAuthenticated) {
			trackEvent(
				EVENTS_ENUM.SIGN_IN_PAGE_LOADED,
				EVENTS_REGISTRY.SIGN_IN_PAGE_LOADED,
			);
		}
	}, [navigate, isAuthenticated, hasCode]);

	useEffect(() => {
		if (router.query?.error) {
			logError(new Error('Login error from query param'), {
				feature: 'login',
				action: 'query-error',
				extra: { error: router.query?.error },
			});
			toast.error('Something went wrong while logging in');
		}
	}, [router.query]);

	if (hasCode || isLoading) {
		return (
			<div className="flex items-center justify-center h-screen relative">
				<BoxLoader />
			</div>
		);
	}

	return (
		<>
			<h1 className="text-2xl font-semibold text-purple-100 pt-10 px-10">
				Irame.ai
			</h1>

			<div className="flex items-center justify-center ">
				<div className="relative w-[30rem] h-[44rem]">
					<div
						className="relative px-10 pb-10 flex flex-col form-bg rounded-3xl border-[0.0875rem] h-full z-10 pt-[7.5rem]"
						style={bgStyles}
					>
						<Form
							setIsLoading={setIsLoading}
							email={email}
							setEmail={setEmail}
						/>
					</div>

					<div
						className="absolute -top-8  bg-custom-gradient left-0 border border-red-500 -translate-x-[50%]"
						style={{
							width: '13.625rem',
							height: '13.625rem',
							borderRadius: '50%',
							zIndex: 1,
						}}
					></div>

					<div
						className="absolute -bottom-8 right-0 bg-custom-gradient translate-x-[50%]"
						style={{
							width: '13.625rem',
							height: '13.625rem',
							borderRadius: '50%',
							zIndex: 1,
						}}
					></div>
				</div>
			</div>
		</>
	);
};

export default SignInSignUp;
