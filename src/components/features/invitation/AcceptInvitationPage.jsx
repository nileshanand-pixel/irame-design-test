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
import {
	Loader2,
	CheckCircle2,
	XCircle,
	AlertCircle,
	Users,
	Mail,
	Shield,
	Calendar,
} from 'lucide-react';
import { capitalizeFirstLetterFullText } from '@/lib/utils';

const formatExpiry = (isoString) => {
	if (!isoString) return '';
	const date = new Date(isoString);
	const day = date.getDate();
	const suffix =
		day % 10 === 1 && day !== 11
			? 'st'
			: day % 10 === 2 && day !== 12
				? 'nd'
				: day % 10 === 3 && day !== 13
					? 'rd'
					: 'th';
	const month = date.toLocaleString(undefined, { month: 'long' });
	const year = date.getFullYear();
	const timeWithZone = date.toLocaleTimeString(undefined, {
		hour: '2-digit',
		minute: '2-digit',
		timeZoneName: 'short',
	});
	return `${day}${suffix} ${month} ${year}, ${timeWithZone}`;
};

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
		<div className="flex items-center justify-center min-h-screen bg-gray-50 p-4 lg:p-8">
			<Card className="w-full max-w-5xl overflow-hidden shadow-sm border border-gray-100 bg-white">
				<div className="grid grid-cols-1 md:grid-cols-2 min-h-[580px]">
					{/* Left Section: Context & Info */}
					<div className="bg-[hsl(268,40%,97%)] border-r border-[hsl(268,30%,92%)] p-8 lg:p-10 flex flex-col justify-between">
						<div>
							<div className="mb-8">
								<span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary80 bg-primary/8 px-3 py-1 rounded-full mb-4 border border-primary/10">
									Invitation
								</span>
								<h1 className="text-3xl lg:text-4xl font-bold text-primary100 leading-tight">
									{tenant?.name ||
										authConfig?.tenant_name ||
										'Join the Organisation'}
								</h1>
							</div>

							<p className="text-gray-500 text-sm mb-8">
								<span className="font-semibold text-gray-800">
									{capitalizeFirstLetterFullText(
										invitation?.invited_by?.name,
									) || 'An administrator'}
								</span>{' '}
								invited you to join{' '}
								{tenant?.name ||
									authConfig?.tenant_name ||
									'the organization'}
								.
							</p>

							<div className="space-y-4">
								<div className="flex items-center gap-3">
									<div className="p-2 bg-white rounded-lg border border-[hsl(268,30%,90%)] shadow-sm">
										<Mail className="h-4 w-4 text-primary" />
									</div>
									<div>
										<p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
											Email
										</p>
										<p className="text-sm text-gray-800 font-medium">
											{invitation?.email}
										</p>
									</div>
								</div>

								<div className="flex items-center gap-3">
									<div className="p-2 bg-white rounded-lg border border-[hsl(268,30%,90%)] shadow-sm">
										<Shield className="h-4 w-4 text-primary" />
									</div>
									<div>
										<p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
											Role
										</p>
										<p className="text-sm text-gray-800 font-medium">
											{invitation?.role?.name || 'Member'}
										</p>
									</div>
								</div>

								{invitation?.teams &&
									invitation.teams.length > 0 && (
										<div className="flex items-start gap-3">
											<div className="p-2 bg-white rounded-lg border border-[hsl(268,30%,90%)] shadow-sm">
												<Users className="h-4 w-4 text-primary" />
											</div>
											<div>
												<p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
													Teams ({invitation.teams.length})
												</p>
												<ul className="mt-1 space-y-0.5">
													{invitation.teams.map((team) => (
														<li
															key={team.id}
															className="text-sm text-gray-800 font-medium"
														>
															• {team.name}
														</li>
													))}
												</ul>
											</div>
										</div>
									)}
							</div>
						</div>

						<div className="mt-8 pt-6 border-t border-[hsl(268,30%,90%)] text-gray-400 text-xs flex items-center gap-2">
							<Calendar className="h-3 w-3" />
							<span>
								Expires: {formatExpiry(invitation?.expires_at)}
							</span>
						</div>
					</div>

					{/* Right Section: Actions/Form */}
					<div className="p-8 lg:p-10 flex flex-col justify-center">
						{/* Progress Stepper */}
						<div className="mb-8">
							<div className="flex justify-between items-center mb-2">
								<span className="text-xs font-bold uppercase tracking-widest text-primary">
									Step{' '}
									{viewState === 'READY_TO_ACCEPT' ? '2' : '1'} of
									2
								</span>
								<span className="text-xs text-gray-400">
									{viewState === 'READY_TO_ACCEPT'
										? '100%'
										: '50%'}{' '}
									complete
								</span>
							</div>
							<div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
								<div
									className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
									style={{
										width:
											viewState === 'READY_TO_ACCEPT'
												? '100%'
												: '50%',
									}}
								></div>
							</div>
						</div>

						<div className="space-y-6">
							<div>
								<h3 className="text-2xl font-bold text-gray-900 mb-1">
									{viewState === 'READY_TO_ACCEPT'
										? 'Accept Invitation'
										: 'Create Account'}
								</h3>
								<p className="text-gray-400 text-sm">
									{viewState === 'READY_TO_ACCEPT'
										? `You're one click away from joining ${tenant?.name || authConfig?.tenant_name || 'the organisation'}.`
										: 'Set up your login to continue with the invitation.'}
								</p>
							</div>

							{error && (
								<Alert
									variant="destructive"
									className="bg-red-50 border-red-100 text-red-800"
								>
									<AlertCircle className="h-4 w-4" />
									<AlertTitle>Error</AlertTitle>
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							)}

							<div>
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
											className="w-full h-11 text-sm font-semibold"
										>
											{processing ? (
												<Loader2 className="animate-spin" />
											) : (
												'Join Workspace'
											)}
										</Button>
										<Button
											onClick={handleDecline}
											variant="ghost"
											disabled={processing}
											className="w-full text-sm text-gray-400 hover:text-red-500 hover:bg-red-50"
										>
											Decline Invitation
										</Button>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</Card>
		</div>
	);
};

export default AcceptInvitationPage;
