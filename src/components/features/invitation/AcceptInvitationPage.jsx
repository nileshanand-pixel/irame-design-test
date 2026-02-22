import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { invitationService } from '@/api/gatekeeper/invitation.service';
import InvitationAuthForm from './InvitationAuthForm';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	CardFooter,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, AlertCircle, Users } from 'lucide-react';

const AcceptInvitationPage = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const token = searchParams.get('token');
	const authCode = searchParams.get('code');

	const [loading, setLoading] = useState(true);
	const [processing, setProcessing] = useState(false);
	const [invitation, setInvitation] = useState(null);
	const [tenant, setTenant] = useState(null);
	const [authConfig, setAuthConfig] = useState(null);
	const [userExists, setUserExists] = useState(false);
	const [error, setError] = useState(null);
	const [accountCreated, setAccountCreated] = useState(false);
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

	const handleAccountCreated = () => {
		setAccountCreated(true);
	};

	const viewState = (() => {
		if (loading || processing) {
			return 'LOADING';
		}

		if (accepted) {
			return 'ACCEPTED';
		}

		if (error && !invitation) {
			return 'INVALID';
		}

		if (userExists || accountCreated) {
			return 'READY_TO_ACCEPT';
		}

		return 'ACCOUNT_CREATION';
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
							<CardTitle>
								You've joined{' '}
								{tenant?.name ||
									authConfig?.tenant_name ||
									'the team'}
							</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						<p className="text-gray-700">Your team access is ready.</p>
						<Button
							className="w-full mt-4"
							onClick={() => navigate('/')}
						>
							Go to Login
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
			<div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-4">
				<Card>
					<CardHeader>
						<CardTitle className="text-2xl">Team Invitation</CardTitle>
						<CardDescription>
							<span className="block text-gray-900 font-semibold mb-1">
								{tenant?.name ||
									authConfig?.tenant_name ||
									'Organisation'}
							</span>
							You were invited by{' '}
							<strong>
								{invitation?.invited_by?.name || 'Unknown'}
							</strong>
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
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
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>
							{viewState === 'READY_TO_ACCEPT'
								? userExists
									? 'Step 2 of 2 · Accept Invitation'
									: 'Step 2 of 2 · Accept Invitation'
								: 'Step 1 of 2 · Create Account'}
						</CardTitle>
						<CardDescription>
							{viewState === 'READY_TO_ACCEPT'
								? `Accept this invitation to join ${tenant?.name || authConfig?.tenant_name || 'the organisation'}.`
								: 'Create your account first. You will accept the invitation in the next step.'}
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

						{viewState === 'ACCOUNT_CREATION' && (
							<InvitationAuthForm
								authConfig={authConfig}
								email={invitation?.email}
								invitationToken={token}
								authCode={authCode}
								userExists={false}
								onAccountCreated={handleAccountCreated}
							/>
						)}

						{viewState === 'READY_TO_ACCEPT' && (
							<div className="space-y-3">
								<Button
									onClick={handleAccept}
									disabled={processing}
									className="w-full"
								>
									Accept Team Invitation
								</Button>
								<Button
									onClick={handleDecline}
									variant="outline"
									disabled={processing}
									className="w-full"
								>
									Decline Invitation
								</Button>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default AcceptInvitationPage;
