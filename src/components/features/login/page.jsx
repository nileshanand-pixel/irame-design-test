import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { useRouter } from '@/hooks/useRouter';
import LoginForm from './LoginForm';
import { COGNITO_CLIENT_ID, GOOGLE_AUTH_API_URL } from '@/config';
import { grantType } from '@/config/auth.config';
import { toast } from 'sonner';
import { authUserDetails, login, LoginWithRefreshToken } from './service/auth.service';
import BoxLoader from '@/components/elements/loading/BoxLoader';
import { getUserDetailsFromToken, setupAuthCookies } from '@/lib/cookies';
import useAuth from '@/hooks/useAuth';
import { getErrorAnalyticsProps, trackEvent, trackUser } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';

const SignInSignUp = () => {
	const navigate = useNavigate();
	const router = useRouter();
	const { isAuthenticated } = useAuth();
	const [isLoading, setIsLoading] = useState(false);
	const [team, setTeam] = useState('');
	const [showTeamInput, setShowTeamInput] = useState(false);

	const handleGoogleRedirect = async () => {
		setIsLoading(true);
		try {
			window.location.href = `${GOOGLE_AUTH_API_URL}/oauth2/authorize?client_id=${COGNITO_CLIENT_ID}&scope=email+openid+profile&response_type=code&redirect_uri=${window.location.origin}&identity_provider=Google`;
		} catch (error) {
			toast.error('Failed to initiate Google login.');
			setIsLoading(false);
		}
	};

	const handleSSORedirect = async () => {
		setIsLoading(true);
		try {
			window.location.href = `https://auth.irame.ai/oauth2/authorize?client_id=1pnoea35m9apf5eb565m3tcaqr&scope=email+openid+profile&response_type=code&redirect_uri=${window.location.origin}&identity_provider=pwc-prod-oidc`;
		} catch (error) {
			toast.error('Failed to initiate Google login.');
			setIsLoading(false);
		}
	};

	const handleSSOLogin = () => {
		// First show the input field , then continue with redirection
		if (!showTeamInput) {
			setShowTeamInput(true);
			return;
		}
		if (!team?.trim()) {
			toast.error('Please enter valid team name');
			return;
		}
		trackEvent(EVENTS_ENUM.SSO_LOGIN_CLICKED, EVENTS_REGISTRY.SSO_LOGIN_CLICKED)
		if (team.toLowerCase() === 'pwc') {
			handleSSORedirect();
		} else {
			toast.error('Your team does not support SSO, Please contact admin!');
		}
	};

	const handleEmailLogin = async (data) => {
		setIsLoading(true);
		try {
			const payload = {
				username: data.email,
				password: data.password,
				grant_type: grantType.USER_PASS_AUTH,
				client_id: COGNITO_CLIENT_ID,
				redirect_uri: window.location.origin,
			};

			const response = await login(payload);

			if (response.status_code === 200) {
				const { id_token, access_token, refresh_token, expires_in } =
					response.body;
				const cookiesData = {
					id_token,
					access_token,
					refresh_token,
					expires_in,
				};

				setupAuthCookies(cookiesData);
				const userDetails = getUserDetailsFromToken(id_token);
				const authUserData = await authUserDetails(id_token)
				localStorage.setItem('auth-user-data', JSON.stringify(authUserData));

				trackEvent(
					EVENTS_ENUM.SUCCESSFUL_LOGIN,
					EVENTS_REGISTRY.SUCCESSFUL_LOGIN,
				);
				trackUser(userDetails);
				navigate('/app/new-chat');
			} else {
				toast.error('Login failed. Invalid Credentials.');
				trackEvent(
					EVENTS_ENUM.LOGIN_FAILURE,
					EVENTS_REGISTRY.LOGIN_FAILURE,
					() => getErrorAnalyticsProps,
				);
			}
		} catch (error) {
			if (error?.code === 'ERR_BAD_REQUEST') {
				toast.error('Login failed. Invalid Credentials.');
				trackEvent(
					EVENTS_ENUM.LOGIN_FAILURE,
					EVENTS_REGISTRY.LOGIN_FAILURE,
					() => getErrorAnalyticsProps(error),
				);
			} else {
				toast.error('Login failed. Unknown Error Please Try Again.');
				trackEvent(
					EVENTS_ENUM.LOGIN_FAILURE,
					EVENTS_REGISTRY.LOGIN_FAILURE,
					() => getErrorAnalyticsProps(error),
				);
			}
		} finally {
			setTimeout(() => {
				setIsLoading(false);
			}, 2000);
		}
	};

	const handleContinue = async (formData) => {
		trackEvent(EVENTS_ENUM.CONTINUE_CLICKED, EVENTS_REGISTRY.CONTINUE_CLICKED);
		handleEmailLogin(formData);
	};

	const handleGoogleLogin = () => {
		const payload = {
			code: router?.query?.code,
			grant_type: grantType.AUTH_CODE,
			client_id: COGNITO_CLIENT_ID,
			redirect_uri: window.location.origin,
		};

		login(payload)
			.then((response) => {
				if (response.status_code === 200) {
					const { id_token, access_token, refresh_token, expires_in } =
						response.body;
					const cookiesData = {
						id_token,
						access_token,
						refresh_token,
						expires_in,
					};

					setupAuthCookies(cookiesData);

					navigate('/app/new-chat');
				} else {
					toast.error(
						'Login failed. Please check your credentials and try again.',
					);
				}
			})
			.catch((error) => {
				toast.error('An error occurred during login. Please try again.');
			})
			.finally(() => {
				setIsLoading(false);
			});
	};

	const handleTokenRefresh = async () => {
		const refreshToken = Cookies.get('refresh_token');
		if (!refreshToken) {
			localStorage.removeItem('userDetails');
			trackEvent(
				EVENTS_ENUM.SIGN_IN_PAGE_LOADED,
				EVENTS_REGISTRY.SIGN_IN_PAGE_LOADED,
			);
			return;
		}
		setIsLoading(true);
		try {
			const response = await LoginWithRefreshToken(refreshToken);
			if (response.status_code === 200) {
				const { id_token, access_token, refresh_token, expires_in } =
					response.body;
				const cookiesData = {
					id_token,
					access_token,
					refresh_token,
					expires_in,
				};

				setupAuthCookies(cookiesData);
				trackUser(getUserDetailsFromToken(id_token));

				navigate('/app/new-chat');
			}
		} catch (error) {
			trackEvent(
				EVENTS_ENUM.SIGN_IN_PAGE_LOADED,
				EVENTS_REGISTRY.SIGN_IN_PAGE_LOADED,
			);
			navigate('/login', { replace: true });
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (router.query?.code) {
			setIsLoading(true);
			handleGoogleLogin();
		}
	}, [router.query?.code]);

	useEffect(() => {
		if (isAuthenticated) {
			navigate('/app/new-chat');
		} else {
			handleTokenRefresh();
		}
	}, [navigate, isAuthenticated]);

	const bgStyles = {
		backdropFilter: 'blur(20px)',
		WebkitBackdropFilter: 'blur(20px)',
		zIndex: 2,
	};

	if (router.query?.code || isLoading)
		return (
			<div className="flex items-center justify-center h-screen relative">
				<BoxLoader />
			</div>
		);

	return (
		<>
			<h1 className="text-2xl font-semibold text-purple-100 pt-10 px-10 ">
				Irame.ai
			</h1>
			<div className="flex items-center justify-center relative">
				<div
					className="relative w-[480px] px-10 rounded-3xl border-[1.4px] h-[704px] flex justify-center flex-col form-bg"
					style={bgStyles}
				>
					<div className="z-10">
						<div className="mb-8">
							<h1 className="text-primary100 text-[28px] leading-10 font-bold">
								Let's Start
							</h1>
							<p className="text-sm text-primary100 font-normal">
								Enter your Email to Login
							</p>
						</div>

						<LoginForm team={team} onContinue={handleContinue} />

						{/* <div className="mt-6">
							<Button
								disabled={isLoading}
								onClick={handleGoogleRedirect}
								className={`w-full border border-black/5 hover:text-black hover:bg-white hover:opacity-90 bg-white text-black  ${
									isLoading ? 'cursor-not-allowed opacity-60' : ''
								}`}
							>
								<img
									src="/assets/icons/google-icon.svg"
									className="size-[18px] mr-2"
								/>
								Continue with Google
							</Button>
						</div> */}

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
										className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
						width: '218px',
						height: '218px',
						borderRadius: '50%',
						zIndex: 1,
					}}
				></div>

				<div
					className="absolute -bottom-8 right-[27%] bg-custom-gradient"
					style={{
						width: '218px',
						height: '218px',
						borderRadius: '50%',
						zIndex: 1,
					}}
				></div>
			</div>
		</>
	);
};

export default SignInSignUp;
