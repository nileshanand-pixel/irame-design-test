import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { invitationService } from '@/api/gatekeeper/invitation.service';
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
	const autoAccept = searchParams.get('action') === 'accept'; // Check if coming from email accept link

	const [loading, setLoading] = useState(true);
	const [processing, setProcessing] = useState(false);
	const [invitation, setInvitation] = useState(null);
	const [error, setError] = useState(null);
	const [accepted, setAccepted] = useState(false);

	// Validate token on mount
	useEffect(() => {
		if (!token) {
			setError('Invalid invitation link. Token is missing.');
			setLoading(false);
			return;
		}

		validateInvitation();
	}, [token]);

	// Auto-accept if coming from email accept link
	useEffect(() => {
		if (autoAccept && invitation && !error && !accepted && !processing) {
			handleAccept();
		}
	}, [autoAccept, invitation, error, accepted, processing]);

	const validateInvitation = async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await invitationService.validateToken(token);
			setInvitation(data);
		} catch (err) {
			setError(
				err.response?.data?.message ||
					'Failed to validate invitation. The link may be invalid or expired.',
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

			// Redirect to dashboard after 2 seconds
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

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-50">
				<Card className="w-full max-w-md">
					<CardContent className="flex flex-col items-center justify-center py-12">
						<Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
						<p className="text-gray-600">
							{autoAccept
								? 'Accepting invitation...'
								: 'Validating invitation...'}
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (error && !invitation) {
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
							<AlertDescription>{error}</AlertDescription>
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

	if (accepted) {
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
							your dashboard...
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
						You've been invited by{' '}
						<strong>{invitation?.invitedBy?.name || 'Unknown'}</strong>
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

						{invitation?.fullName && (
							<div>
								<label className="text-sm font-medium text-gray-700">
									Name
								</label>
								<p className="text-gray-900">
									{invitation?.fullName}
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
									invitation?.expiresAt,
								).toLocaleDateString()}
							</p>
						</div>
					</div>
				</CardContent>
				<CardFooter className="flex gap-3">
					<Button
						onClick={handleDecline}
						variant="outline"
						disabled={processing}
						className="flex-1"
					>
						{processing ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Processing...
							</>
						) : (
							'Decline'
						)}
					</Button>
					<Button
						onClick={handleAccept}
						disabled={processing}
						className="flex-1"
					>
						{processing ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Accepting...
							</>
						) : (
							'Accept Invitation'
						)}
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
};

export default AcceptInvitationPage;
