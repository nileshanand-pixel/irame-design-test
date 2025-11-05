import { Button } from '@/components/ui/button';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { trackEvent } from '@/lib/mixpanel';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import {
	authUserDetails,
	getOAuthProviders,
	ssoLogin,
} from '../../service/auth.service';
import { useRouter } from '@/hooks/useRouter';
import { useNavigate } from 'react-router-dom';
import { logError } from '@/lib/logger';
import useAuth from '@/hooks/useAuth';
import { REDIRECTION_URL_AFTER_LOGIN } from '@/constants/login-constants';

export default function SSOLoginForm({ setIsLoading }) {
	const [showTeamInput, setShowTeamInput] = useState(false);
	const [team, setTeam] = useState('');
	const [oauthProviders, setOAuthProviders] = useState([]);

	const router = useRouter();
	const navigate = useNavigate();

	const hasCode = Boolean(router.query?.code);
	const authResult = !hasCode ? useAuth() : { isAuthenticated: false };
	const { isAuthenticated } = authResult;

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

	return (
		<div className="mt-3">
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
				className={cn('w-full', showTeamInput ? 'mt-4' : '')}
			>
				Continue with SSO
			</Button>
		</div>
	);
}
