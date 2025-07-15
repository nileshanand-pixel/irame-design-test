import { useEffect } from 'react';
import { createOrUpdateUserSession } from './helper';

export default function UserSessionManager() {
	useEffect(() => {
		const events = ['click', 'mousemove', 'keydown', 'scroll'];
		function eventHandler() {
			createOrUpdateUserSession();
		}
		function handleVisibilityChange() {
			if (document.visibilityState === 'visible') {
				createOrUpdateUserSession();
			}
		}
		function addEventHandlers() {
			events.forEach((event) => {
				document.addEventListener(event, eventHandler);
			});
			document.addEventListener('visibilitychange', handleVisibilityChange);
		}
		function removeEventHandlers() {
			events.forEach((event) => {
				document.removeEventListener(event, eventHandler);
			});
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		}
		createOrUpdateUserSession();
		addEventHandlers();

		return () => {
			removeEventHandlers();
		};
	}, []);

	return null;
}
