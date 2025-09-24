import * as Sentry from '@sentry/react';

// Initialize Sentry only if DSN is available
if (import.meta.env.VITE_SENTRY_DSN) {
	Sentry.init({
		dsn: import.meta.env.VITE_SENTRY_DSN,
		sendDefaultPii: false,
		environment: import.meta.env.MODE,
		integrations: [
			// React Router v6 integration for routing breadcrumbs
			Sentry.reactRouterV6BrowserTracingIntegration(),
		],
	});
}

/**
 * Centralized error logger for the app.
 * @param {Error|any} error - The error object or message.
 * @param {Object} context - Additional context (feature, action, user, extra, etc).
 */
export function logError(error, context = {}) {
	// Only send to Sentry if it's initialized (DSN is available)
	if (import.meta.env.VITE_SENTRY_DSN) {
		// Attach extra context for Sentry
		Sentry.captureException(error, {
			tags: {
				feature: context.feature,
				action: context.action,
				...context.tags,
			},
			extra: {
				...context.extra,
			},
			user: context.user,
			level: context.level || 'error',
		});
	}

	// Always log to console in development
	if (import.meta.env.DEV) {
		// eslint-disable-next-line no-console
		console.error('[logError]', error, context);
	}
}
