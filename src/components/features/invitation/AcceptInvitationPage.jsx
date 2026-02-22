import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { invitationService } from '@/api/gatekeeper/invitation.service';
import useAuth from '@/hooks/useAuth';
import { fullLogout } from '@/components/features/login/service/auth.service';
import InvitationAuthForm from './InvitationAuthForm';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, AlertCircle, Users } from 'lucide-react';

const AcceptInvitationPage = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const token = searchParams.get('token');
	const authCode = searchParams.get('code');
	const { isAuthenticated, isLoading: isAuthLoading, userDetails } = useAuth();

	const [loading, setLoading] = useState(true);
	const [processing, setProcessing] = useState(false);
	const [invitation, setInvitation] = useState(null);
	const [tenant, setTenant] = useState(null);
	const [authConfig, setAuthConfig] = useState(null);
	const [userExists, setUserExists] = useState(false);
	const [error, setError] = useState(null);
	const [accepted, setAccepted] = useState(false);

	// Validate token on mount
	useEffect(() => {
		if (!token) {
			setError('Invalid invitation link. Token is missing.');
			setLoading(false);
			return;
		}

		loadInvitationContext();
	}, [token]);

	const loadInvitationContext = async () => {
		try {
			setLoading(true);
			setError(null);
			const result = await invitationService.validateToken(token);
			setInvitation(result.invitation);
			setTenant(result.tenant);
			setAuthConfig(result.auth_config);
			setUserExists(result.user_exists);
		} catch (err) {
			setError(
				err.response?.data?.message ||
					'Failed to validate invitation. The link may be invalid or expired. Please contact your administrator.',
			);
		} finally {
			setLoading(false);
		}
	};

	const handleAccept = async () => {
		try {
			setProcessing(true);
			setError(null);
			await invitationService.acceptInvitation(token);
			setAccepted(true);

			// Redirect to access-management after 2 seconds
			setTimeout(() => {
				navigate('/app/access-management');
			}, 2000);
		} catch (err) {
			setError(
				err.response?.data?.message ||
					'Failed to accept invitation. Please try again.',
			);
		} finally {
			setProcessing(false);
		}
	};

	const handleDecline = async () => {
		if (!window.confirm('Are you sure you want to decline this invitation?')) {
			return;
		}

		try {
			setProcessing(true);
			setError(null);
			await invitationService.declineInvitation(token);

			// Redirect after declining
			setTimeout(() => {
				navigate('/');
			}, 2000);
		} catch (err) {
			setError(
				err.response?.data?.message ||
					'Failed to decline invitation. Please try again.',
			);
		} finally {
			setProcessing(false);
		}
	};

	const handleAuthenticated = async () => {
		await handleAccept();
	};

	const handleMismatchLogout = async () => {
		await fullLogout(window.location.pathname + window.location.search);
	};

	const invitedEmail = invitation?.email?.toLowerCase();
	const authenticatedEmail = userDetails?.email?.toLowerCase();

	const viewState = (() => {
		if (loading || isAuthLoading || processing) {
			return 'LOADING';
		}

		if (accepted) {
			return 'ACCEPTED';
		}

		if (error && !invitation) {
			return 'INVALID';
		}

		if (isAuthenticated) {
			if (invitedEmail && authenticatedEmail === invitedEmail) {
				return 'AUTHENTICATED_MATCH';
			}
			return 'AUTHENTICATED_MISMATCH';
		}

		return 'NEEDS_AUTH';
	})();

	if (viewState === 'LOADING') {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-50">
				<Card className="w-full max-w-md">
					<CardContent className="flex flex-col items-center justify-center py-12">
						<Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
						<p className="text-gray-600">
							{authCode
								? 'Completing authentication...'
								: 'Loading invitation...'}
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (viewState === 'INVALID') {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-50">
				<Card className="w-full max-w-md">
					<CardHeader>
						<div className="flex items-center space-x-2">
							<XCircle className="h-6 w-6 text-destructive" />
							<CardTitle>Invalid Invitation</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>Error</AlertTitle>
							<AlertDescription>
								{error} Please contact your administrator for a new
								invitation.
							</AlertDescription>
						</Alert>
					</CardContent>
					<CardFooter>
						<Button
							onClick={() => navigate('/')}
							variant="outline"
							className="w-full"
						>
							Go to Home
						</Button>
					</CardFooter>
				</Card>
			</div>
		);
	}

	if (viewState === 'ACCEPTED') {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-50">
				<Card className="w-full max-w-md">
					<CardHeader>
						<div className="flex items-center space-x-2">
							<CheckCircle2 className="h-6 w-6 text-green-600" />
							<CardTitle>Invitation Accepted!</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						<p className="text-gray-700">
							You have successfully joined the team(s). Redirecting to
							access management...
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-2xl">Team Invitation</CardTitle>
					<CardDescription>
						{tenant?.name && (
							<span className="block text-gray-900 font-semibold mb-1">
								{tenant.name}
							</span>
						)}
						You've been invited by{' '}
						<strong>{invitation?.invited_by?.name || 'Unknown'}</strong>
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{error && (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>Error</AlertTitle>
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					<div className="space-y-3">
						<div>
							<label className="text-sm font-medium text-gray-700">
								Email
							</label>
							<p className="text-gray-900">{invitation?.email}</p>
						</div>

						{invitation?.full_name && (
							<div>
								<label className="text-sm font-medium text-gray-700">
									Name
								</label>
								<p className="text-gray-900">
									{invitation?.full_name}
								</p>
							</div>
						)}

						<div>
							<label className="text-sm font-medium text-gray-700">
								Role
							</label>
							<p className="text-gray-900">
								{invitation?.role?.name || 'Member'}
							</p>
						</div>

						{invitation?.teams && invitation.teams.length > 0 && (
							<div>
								<label className="text-sm font-medium text-gray-700 flex items-center gap-2">
									<Users className="h-4 w-4" />
									Teams ({invitation.teams.length})
								</label>
								<ul className="mt-2 space-y-1">
									{invitation.teams.map((team) => (
										<li
											key={team.id}
											className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded"
										>
											• {team.name}
										</li>
									))}
								</ul>
							</div>
						)}

						<div className="pt-2 border-t">
							<p className="text-xs text-gray-500">
								Expires:{' '}
								{new Date(
									invitation?.expires_at,
								).toLocaleDateString()}
							</p>
						</div>

						{viewState === 'AUTHENTICATED_MISMATCH' && (
							<Alert>
								<AlertCircle className="h-4 w-4" />
								<AlertTitle>Different logged-in account</AlertTitle>
								<AlertDescription>
									This invitation is for{' '}
									<strong>{invitation?.email}</strong>, but you are
									logged in as{' '}
									<strong>
										{userDetails?.email || 'unknown user'}
									</strong>
									. Logout and sign in with the invited account.
								</AlertDescription>
							</Alert>
						)}

						{viewState === 'NEEDS_AUTH' && (
							<InvitationAuthForm
								authConfig={authConfig}
								email={invitation?.email}
								invitationToken={token}
								authCode={authCode}
								userExists={userExists}
								onAuthenticated={handleAuthenticated}
							/>
						)}
					</div>
				</CardContent>
				<CardFooter className="flex gap-3">
					{viewState === 'AUTHENTICATED_MATCH' && (
						<>
							<Button
								onClick={handleDecline}
								variant="outline"
								disabled={processing}
								className="flex-1"
							>
								Decline
							</Button>
							<Button
								onClick={handleAccept}
								disabled={processing}
								className="flex-1"
							>
								Accept Invitation
							</Button>
						</>
					)}

					{viewState === 'AUTHENTICATED_MISMATCH' && (
						<>
							<Button
								onClick={handleDecline}
								variant="outline"
								disabled={processing}
								className="flex-1"
							>
								Decline
							</Button>
							<Button
								onClick={handleMismatchLogout}
								disabled={processing}
								className="flex-1"
							>
								Logout
							</Button>
						</>
					)}

					{viewState === 'NEEDS_AUTH' && (
						<Button
							onClick={handleDecline}
							variant="outline"
							disabled={processing}
							className="w-full"
						>
							Decline Invitation
						</Button>
					)}
				</CardFooter>
			</Card>
		</div>
	);
};

export default AcceptInvitationPage;
