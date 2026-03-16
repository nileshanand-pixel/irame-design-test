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
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const DeclineInvitationPage = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const token = searchParams.get('token');

	const [loading, setLoading] = useState(true);
	const [processing, setProcessing] = useState(false);
	const [invitation, setInvitation] = useState(null);
	const [error, setError] = useState(null);
	const [declined, setDeclined] = useState(false);

	// Validate token on mount
	useEffect(() => {
		if (!token) {
			setError('Invalid invitation link. Token is missing.');
			setLoading(false);
			return;
		}

		validateInvitation();
	}, [token]);

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

	const handleConfirmDecline = async () => {
		try {
			setProcessing(true);
			setError(null);
			await invitationService.declineInvitation(token);
			setDeclined(true);

			// Redirect after declining
			setTimeout(() => {
				navigate('/');
			}, 3000);
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
						<p className="text-gray-600">Loading invitation...</p>
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

	if (declined) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-50">
				<Card className="w-full max-w-md">
					<CardHeader>
						<div className="flex items-center space-x-2">
							<CheckCircle2 className="h-6 w-6 text-gray-600" />
							<CardTitle>Invitation Declined</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						<Alert className="border-gray-200 bg-gray-50">
							<AlertCircle className="h-4 w-4 text-gray-600" />
							<AlertTitle className="text-gray-800">
								Declined
							</AlertTitle>
							<AlertDescription className="text-gray-700">
								You have declined the invitation. Redirecting to home
								page...
							</AlertDescription>
						</Alert>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-2xl">Decline Invitation</CardTitle>
					<CardDescription>
						Are you sure you want to decline this invitation?
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
								Invited by
							</label>
							<p className="text-gray-900">
								{invitation?.inviterName}
							</p>
						</div>

						<div>
							<label className="text-sm font-medium text-gray-700">
								Email
							</label>
							<p className="text-gray-900">{invitation?.email}</p>
						</div>

						{invitation?.teams && invitation.teams.length > 0 && (
							<div>
								<label className="text-sm font-medium text-gray-700">
									Teams ({invitation.teams.length})
								</label>
								<ul className="mt-2 space-y-1">
									{invitation.teams.map((team, idx) => (
										<li
											key={idx}
											className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded"
										>
											• {team}
										</li>
									))}
								</ul>
							</div>
						)}
					</div>

					<Alert className="border-yellow-200 bg-yellow-50">
						<AlertCircle className="h-4 w-4 text-yellow-600" />
						<AlertTitle className="text-yellow-800">Warning</AlertTitle>
						<AlertDescription className="text-yellow-700">
							Once you decline, you won't be able to accept this
							invitation. You'll need to request a new invitation.
						</AlertDescription>
					</Alert>
				</CardContent>
				<CardFooter className="flex gap-3">
					<Button
						onClick={() => navigate(`/accept-invitation?token=${token}`)}
						variant="outline"
						disabled={processing}
						className="flex-1"
					>
						Go Back
					</Button>
					<Button
						onClick={handleConfirmDecline}
						disabled={processing}
						variant="destructive"
						className="flex-1"
					>
						{processing ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Processing...
							</>
						) : (
							'Confirm Decline'
						)}
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
};

export default DeclineInvitationPage;
