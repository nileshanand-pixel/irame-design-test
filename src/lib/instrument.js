import * as Sentry from '@sentry/react';

// Initialize Sentry only if DSN is available
if (import.meta.env.VITE_SENTRY_DSN) {
	Sentry.init({
		dsn: import.meta.env.VITE_SENTRY_DSN,
		sendDefaultPii: false,
		environment: import.meta.env.MODE,
		// React Router integration will be added separately
	});
}
