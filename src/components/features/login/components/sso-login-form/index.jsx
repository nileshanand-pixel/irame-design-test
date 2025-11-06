import { Button } from '@/components/ui/button';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { trackEvent } from '@/lib/mixpanel';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { getOAuthProviders } from '../../service/auth.service';
import { useRouter } from '@/hooks/useRouter';
import { logError } from '@/lib/logger';

export default function SSOLoginForm() {
	const [showTeamInput, setShowTeamInput] = useState(false);
	const [team, setTeam] = useState('');
	const [oauthProviders, setOAuthProviders] = useState([]);

	const router = useRouter();

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
