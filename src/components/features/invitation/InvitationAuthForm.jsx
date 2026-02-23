import { useEffect, useRef, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import {
	getOAuthProviders,
	ssoLogin,
} from '@/components/features/login/service/auth.service';
import { invitationService } from '@/api/gatekeeper/invitation.service';

const InvitationAuthForm = ({
	authConfig,
	email,
	invitationToken,
	authCode,
	onAccountCreated,
}) => {
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

	const markAccountCreated = async () => {
		if (typeof onAccountCreated === 'function') {
			onAccountCreated();
		}
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
				await markAccountCreated();
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
			if (isRecaptchaEnabled) {
				const captchaToken = await recaptchaRef.current.executeAsync();
				if (!captchaToken) {
					setError('Recaptcha verification failed. Please try again.');
					setProcessing(false);
					return;
				}
			}

			await invitationService.signupInvitation(invitationToken, {
				password,
			});
			await markAccountCreated();
		} catch (authError) {
			setError(
				authError?.response?.data?.message ||
					'Failed to create account. Please try again.',
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
		<div className="space-y-6">
			{error && (
				<Alert
					variant="destructive"
					className="bg-red-50 border-red-100 text-red-800"
				>
					<AlertCircle className="h-4 w-4" />
					<AlertTitle>Authentication Error</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{emailPasswordEnabled && (
				<form onSubmit={handleEmailPasswordAuth} className="space-y-5">
					<div className="space-y-2">
						<label className="text-sm font-semibold text-gray-700 ml-1">
							Email Address
						</label>
						<input
							type="email"
							value={email}
							readOnly
							className="block w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-400 cursor-not-allowed focus:outline-none transition-all"
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-semibold text-gray-700 ml-1">
							Password
						</label>
						<input
							type="password"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							placeholder="Create a strong password"
							className="block w-full px-3 py-2.5 bg-white border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400"
							required
						/>
					</div>

					{isRecaptchaEnabled && (
						<div className="flex justify-center py-2">
							<ReCAPTCHA
								ref={recaptchaRef}
								sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
								size="invisible"
							/>
						</div>
					)}

					<Button
						type="submit"
						disabled={processing}
						className="w-full h-11 font-semibold text-sm transition-all active:scale-[0.98]"
					>
						{processing ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Setting up...
							</>
						) : (
							'Create My Account'
						)}
					</Button>
				</form>
			)}

			{(publicSsoEnabled || privateProviders.length > 0) && (
				<div className="relative py-2">
					<div className="absolute inset-0 flex items-center">
						<span className="w-full border-t border-gray-100"></span>
					</div>
					<div className="relative flex justify-center text-xs uppercase">
						<span className="bg-white px-2 text-gray-400 font-medium">
							Or continue with
						</span>
					</div>
				</div>
			)}

			{/* SSO buttons: 1-col for single, 2-col grid when 2+ options */}
			{(() => {
				const ssoButtons = [
					...(publicSsoEnabled && googleProvider
						? [
								{
									key: 'google',
									label: 'Google',
									icon: (
										<svg
											className="h-4 w-4 shrink-0"
											viewBox="0 0 24 24"
										>
											<path
												d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
												fill="#4285F4"
											/>
											<path
												d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
												fill="#34A853"
											/>
											<path
												d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
												fill="#FBBC05"
											/>
											<path
												d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
												fill="#EA4335"
											/>
										</svg>
									),
									onClick: () =>
										redirectToProvider(googleProvider),
								},
							]
						: []),
					...privateProviders.map((provider) => ({
						key: provider.name,
						label: provider.display_name || provider.name,
						icon: null,
						onClick: () => redirectToProvider(provider),
					})),
				];
				if (ssoButtons.length === 0) return null;
				return (
					<div
						className={
							ssoButtons.length > 1 ? 'grid grid-cols-2 gap-2' : ''
						}
					>
						{ssoButtons.map((btn) => (
							<Button
								key={btn.key}
								type="button"
								variant="outline"
								onClick={btn.onClick}
								disabled={processing}
								className="w-full h-10 text-sm border-gray-200 hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center gap-2 font-medium transition-all truncate"
							>
								{btn.icon}
								<span className="truncate">{btn.label}</span>
							</Button>
						))}
					</div>
				);
			})()}

			{!emailPasswordEnabled &&
				!publicSsoEnabled &&
				privateProviders.length === 0 && (
					<Alert className="rounded-xl">
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
