import * as Sentry from '@sentry/react';

// Initialize Sentry only once, using DSN from .env
Sentry.init({
	dsn: import.meta.env.VITE_SENTRY_DSN,
	sendDefaultPii: true,
	environment: import.meta.env.MODE,
	// You can add more Sentry config here as needed
});

/**
 * Centralized error logger for the app.
 * @param {Error|any} error - The error object or message.
 * @param {Object} context - Additional context (feature, action, user, extra, etc).
 */
export function logError(error, context = {}) {
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

	// Optionally, log to console in development
	if (import.meta.env.DEV) {
		// eslint-disable-next-line no-console
		console.error('[logError]', error, context);
	}
}
