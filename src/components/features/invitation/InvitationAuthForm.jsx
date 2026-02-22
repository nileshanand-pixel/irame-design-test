import { useEffect, useRef, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import {
	authUserDetails,
	getOAuthProviders,
	login,
	ssoLogin,
} from '@/components/features/login/service/auth.service';
import { invitationService } from '@/api/gatekeeper/invitation.service';
import { useDispatch } from 'react-redux';
import { syncAuthIdentity } from '@/redux/reducer/authReducer';

const InvitationAuthForm = ({
	authConfig,
	email,
	invitationToken,
	authCode,
	userExists,
	onAuthenticated,
}) => {
	const dispatch = useDispatch();
	const [password, setPassword] = useState('');
	const [processing, setProcessing] = useState(false);
	const [error, setError] = useState('');
	const [oauthProviders, setOauthProviders] = useState([]);
	const recaptchaRef = useRef(null);
	const hasProcessedCode = useRef(false);

	const isRecaptchaEnabled = import.meta.env.VITE_IS_RECAPTCHA_ENABLED === 'true';
	const emailPasswordEnabled = Boolean(authConfig?.allow_password);
	const publicSsoEnabled = Boolean(authConfig?.public_sso_enabled);
	const privateProviders = authConfig?.private_providers || [];

	useEffect(() => {
		if (!publicSsoEnabled) {
			return;
		}

		const loadProviders = async () => {
			try {
				const response = await getOAuthProviders();
				setOauthProviders(response.providers || []);
			} catch (providerError) {
				setOauthProviders([]);
			}
		};

		loadProviders();
	}, [publicSsoEnabled]);

	const finalizeAuth = async () => {
		const user = await authUserDetails();
		localStorage.setItem('userDetails', JSON.stringify(user));
		dispatch(syncAuthIdentity(user));
		await onAuthenticated();
	};

	useEffect(() => {
		if (!authCode || hasProcessedCode.current) {
			return;
		}

		hasProcessedCode.current = true;
		setProcessing(true);
		setError('');

		ssoLogin({ code: authCode })
			.then(async () => {
				await finalizeAuth();
			})
			.catch(() => {
				setError('Unable to complete SSO authentication. Please try again.');
			})
			.finally(() => {
				setProcessing(false);
			});
	}, [authCode]);

	const handleEmailPasswordAuth = async (event) => {
		event.preventDefault();
		if (!password.trim()) {
			setError('Password is required.');
			return;
		}

		setProcessing(true);
		setError('');

		try {
			let captchaToken = '';
			if (isRecaptchaEnabled) {
				captchaToken = await recaptchaRef.current.executeAsync();
				if (!captchaToken) {
					setError('Recaptcha verification failed. Please try again.');
					setProcessing(false);
					return;
				}
			}

			if (!userExists) {
				// Create account first
				await invitationService.signupInvitation(invitationToken, {
					password,
				});
			}

			await login({
				email,
				password,
				captchaToken,
			});
			await finalizeAuth();
		} catch (authError) {
			setError(
				authError?.response?.data?.message ||
					(userExists
						? 'Authentication failed. Please verify your credentials and try again.'
						: 'Failed to create account. Please try again.'),
			);
		} finally {
			setProcessing(false);
		}
	};

	const redirectToProvider = (provider) => {
		if (!provider?.authorize_url || !provider?.name) {
			setError('SSO provider is not configured correctly.');
			return;
		}

		setProcessing(true);
		setError('');
		const redirectUri = `${window.location.origin}/accept-invitation?token=${invitationToken}`;
		window.location.href = `${provider.authorize_url}?provider=${provider.name}&redirect_uri=${encodeURIComponent(redirectUri)}`;
	};

	const googleProvider = oauthProviders.find(
		(provider) => provider.name?.toLowerCase() === 'google',
	);

	return (
		<div className="space-y-4">
			{error && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertTitle>Authentication Error</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{emailPasswordEnabled && (
				<form onSubmit={handleEmailPasswordAuth} className="space-y-3">
					<div>
						<label className="text-sm font-medium text-gray-700">
							Email
						</label>
						<input
							type="email"
							value={email}
							readOnly
							className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-[#0000001A] rounded-md text-sm"
						/>
					</div>
					<div>
						<label className="text-sm font-medium text-gray-700">
							Password
						</label>
						<input
							type="password"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							placeholder={
								userExists
									? 'Enter your password'
									: 'Create a password'
							}
							className="mt-1 block w-full px-3 py-2 bg-transparent border border-[#0000001A] rounded-md text-sm"
						/>
					</div>

					{isRecaptchaEnabled && (
						<ReCAPTCHA
							ref={recaptchaRef}
							sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
							size="invisible"
						/>
					)}

					<Button type="submit" disabled={processing} className="w-full">
						{processing ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								{userExists
									? 'Authenticating...'
									: 'Creating Account...'}
							</>
						) : userExists ? (
							'Login and Accept Invitation'
						) : (
							'Create Account and Accept'
						)}
					</Button>
				</form>
			)}

			{publicSsoEnabled && (
				<Button
					type="button"
					variant="outline"
					onClick={() => redirectToProvider(googleProvider)}
					disabled={processing || !googleProvider}
					className="w-full"
				>
					Continue with Google
				</Button>
			)}

			{privateProviders.map((provider) => (
				<Button
					key={provider.name}
					type="button"
					variant="outline"
					onClick={() => redirectToProvider(provider)}
					disabled={processing}
					className="w-full"
				>
					{`Continue with ${provider.display_name || provider.name}`}
				</Button>
			))}

			{!emailPasswordEnabled &&
				!publicSsoEnabled &&
				privateProviders.length === 0 && (
					<Alert>
						<AlertCircle className="h-4 w-4" />
						<AlertTitle>No authentication method configured</AlertTitle>
						<AlertDescription>
							Please contact your administrator to configure invitation
							authentication.
						</AlertDescription>
					</Alert>
				)}
		</div>
	);
};

export default InvitationAuthForm;
