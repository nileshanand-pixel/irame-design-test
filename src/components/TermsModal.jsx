import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import { Button } from './ui/button';
import { trackEvent } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';

const TermsModal = () => {
	const [isVisible, setIsVisible] = useState(false);
	const location = useLocation();

	useEffect(() => {
		// Don't show T&C modal on invitation pages (they're public and don't require T&C acceptance)
		const isInvitationPage =
			location.pathname.startsWith('/accept-invitation') ||
			location.pathname.startsWith('/decline-invitation');

		if (isInvitationPage) {
			return;
		}

		const termsAccepted = Cookies.get('termsAccepted');
		if (!termsAccepted) {
			setIsVisible(true);
		}
	}, [location]);

	const handleAgree = () => {
		Cookies.set('termsAccepted', 'true', { expires: 365 });
		trackEvent(EVENTS_ENUM.TNC_ACCEPTED, EVENTS_REGISTRY.TNC_ACCEPTED, () => ({
			tnc_version: '1.0',
		}));
		setIsVisible(false);
	};

	if (!isVisible) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full">
				<h2 className="text-2xl text-center font-semibold mb-4">
					Please review our terms
				</h2>
				<p className="mb-4">
					We encourage you to review our
					<a
						href="https://www.irame.ai/terms-of-use"
						target="_blank"
						className="text-blue-600 mx-1 underline"
					>
						Terms of Use
					</a>
					and
					<a
						href="https://www.irame.ai/privacy-policy"
						target="_blank"
						className="text-blue-600 underline mx-1"
					>
						Privacy Policy
					</a>
					. By continuing, you agree to the terms listed here.
				</p>
				<Button
					onClick={handleAgree}
					className="w-full text-white bg-primary hover:bg-purple-80/80 font-medium rounded-lg text-sm px-5 py-2.5 mt-4 text-center"
				>
					Continue
				</Button>
			</div>
		</div>
	);
};

export default TermsModal;
