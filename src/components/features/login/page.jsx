import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { useRouter } from '@/hooks/useRouter';
import LoginForm from './LoginForm';
import { COGNITO_CLIENT_ID, GOOGLE_AUTH_API_URL } from '@/config';
import { grantType } from '@/config/auth.config';
import { toast } from 'sonner';
import {
	login,
	LoginWithRefreshToken,
} from './service/auth.service';
import BoxLoader from '@/components/elements/loading/BoxLoader';
import { setupAuthCookies } from '@/lib/cookies';
import useAuth from '@/hooks/useAuth';

const SignInSignUp = () => {
	const navigate = useNavigate();
	const router = useRouter();
	const { isAuthenticated } = useAuth();

	const [isLoading, setIsLoading] = useState(false);

	const handleGoogleRedirect = async () => {
		setIsLoading(true);
		try {
			window.location.href = `${GOOGLE_AUTH_API_URL}/oauth2/authorize?client_id=${COGNITO_CLIENT_ID}&scope=email+openid+profile&response_type=code&redirect_uri=${window.location.origin}&identity_provider=Google`;
		} catch (error) {
			toast.error('Failed to initiate Google login.');
			setIsLoading(false);
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

				navigate('/app/new-chat');
			} else {
				toast.error(
					'Login failed. Please check your credentials and try again.',
				);
			}
		} catch (error) {
			toast.error('An error occurred during login. Please try again.');
		} finally {
			setTimeout(() => {
				setIsLoading(false);
			}, 2000);
		}
	};

	const handleContinue = async (formData) => {
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
		if (!refreshToken) return;
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

				navigate('/app/new-chat');
			}
		} catch (error) {
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
			handleTokenRefresh(); // Check and refresh the token if present
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

						<LoginForm onContinue={handleContinue} />

						<div className="mt-6">
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
