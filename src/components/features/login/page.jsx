import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useRouter } from '@/hooks/useRouter';
import LoginForm from './LoginForm';
import { toast } from '@/lib/toast';
import {
	authUserDetails,
	login,
	getOAuthProviders,
	ssoLogin,
} from './service/auth.service';
import BoxLoader from '@/components/elements/loading/BoxLoader';
import useAuth from '@/hooks/useAuth';
import { getErrorAnalyticsProps, trackEvent, trackUser } from '@/lib/mixpanel';
import { logError } from '@/lib/logger';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { grantType } from '@/config/auth.config';
import { createOrUpdateUserSession } from '../user-session-manager/helper';

const SignInSignUp = () => {
	const navigate = useNavigate();
	const router = useRouter();
	const hasCode = Boolean(router.query?.code);
	const authResult = !hasCode ? useAuth() : { isAuthenticated: false };
	const { isAuthenticated } = authResult;
	const [isLoading, setIsLoading] = useState(false);
	const [team, setTeam] = useState('');
	const [showTeamInput, setShowTeamInput] = useState(false);
	const [oauthProviders, setOAuthProviders] = useState([]);

	useEffect(() => {
		const fetchOAuthProviders = async () => {
			try {
				const response = await getOAuthProviders();
				setOAuthProviders(response.providers);
			} catch (error) {
				logError(error, {
					feature: 'login',
					action: 'fetchOAuthProviders',
					extra: { errorMessage: error.message },
				});
			}
		};
		fetchOAuthProviders();
	}, []);

	const handleSSOLogin = () => {
		if (!showTeamInput) {
			setShowTeamInput(true);
			trackEvent(
				EVENTS_ENUM.SSO_LOGIN_CLICKED,
				EVENTS_REGISTRY.SSO_LOGIN_CLICKED,
			);
			return;
		}
		trackEvent(
			EVENTS_ENUM.SSO_LOGIN_ATTEMPTED,
			EVENTS_REGISTRY.SSO_LOGIN_ATTEMPTED,
			() => ({
				team_name: team,
			}),
		);
		if (!team?.trim()) {
			toast.error('Please enter valid team name');
			return;
		}

		const provider = oauthProviders.find(
			(p) => p.name.toLowerCase() === team.toLowerCase(),
		);
		if (provider) {
			const redirectUri = `${window.location.origin}`;
			window.location.href = `${provider.authorize_url}?provider=${provider.name}&redirect_uri=${redirectUri}`;
		} else {
			toast.error('Your team does not support SSO, Please contact admin!');
		}
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
			navigate('/app/new-chat?source=login');
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
					navigate('/app/new-chat');
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
					createSession();
					navigate('/app/new-chat?source=login');
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

	const handleContinue = async (formData) => {
		trackEvent(EVENTS_ENUM.CONTINUE_CLICKED, EVENTS_REGISTRY.CONTINUE_CLICKED);
		handleEmailLogin(formData);
	};

	useEffect(() => {
		if (router.query?.code) {
			setIsLoading(true);
			handleGoogleLogin();
		}
	}, [router.query?.code]);

	useEffect(() => {
		if (!hasCode && isAuthenticated) {
			navigate('/app/new-chat');
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

	const bgStyles = {
		backdropFilter: 'blur(20px)',
		WebkitBackdropFilter: 'blur(20px)',
		zIndex: 2,
	};

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
			<div className="flex items-center justify-center relative">
				<div
					className="relative w-[30rem] px-10 rounded-3xl border-[0.0875rem] h-[44rem] flex justify-center flex-col form-bg"
					style={bgStyles}
				>
					<div className="z-10">
						<div className="mb-8">
							<h1 className="text-primary100 text-[1.75rem] leading-10 font-bold">
								Let's Start
							</h1>
							<p className="text-sm text-primary100 font-normal">
								Enter your Email to Login
							</p>
						</div>

						<LoginForm team={team} onContinue={handleContinue} />

						<div className="mt-6">
							{showTeamInput && (
								<div className="animate-in animate-s">
									<label
										htmlFor="team"
										className="block text-sm font-medium text-gray-700"
									>
										Team Name
									</label>
									<input
										type="text"
										id="team"
										value={team}
										onChange={(e) => setTeam(e.target.value)}
										placeholder="Enter your team name"
										className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
									/>
								</div>
							)}
							<Button
								variant="outline"
								onClick={handleSSOLogin}
								className=" w-full text-sm mt-4 font-semibold text-purple-100 bg-purple-8 border-none hover:text-purple-100 hover:opacity-80 flex items-center"
							>
								Continue with SSO
							</Button>
						</div>
					</div>
				</div>

				<div
					className="absolute -top-8  bg-custom-gradient left-[25%]"
					style={{
						width: '13.625rem',
						height: '13.625rem',
						borderRadius: '50%',
						zIndex: 1,
					}}
				></div>

				<div
					className="absolute -bottom-8 right-[27%] bg-custom-gradient"
					style={{
						width: '13.625rem',
						height: '13.625rem',
						borderRadius: '50%',
						zIndex: 1,
					}}
				></div>
			</div>
		</>
	);
};

export default SignInSignUp;
