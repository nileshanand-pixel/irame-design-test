import { toast } from '@/lib/toast';
import { ERROR_CODES } from '../constants';

/**
 * Handles errors from add-to-dashboard API calls
 *
 * @param {Error} error - Error object from API call
 * @param {Object} options - Error handling options
 * @param {Function} options.logError - Logging function
 * @param {Object} options.extra - Extra data for logging
 * @returns {void}
 */
export const handleAddToDashboardError = (error, { logError, extra = {} }) => {
	const errorData = error.response?.data || {};
	const errorMessage = errorData.message || error.message;
	const errorCode = errorData.error_code;

	// Log error for debugging
	if (logError) {
		logError(error, {
			feature: 'add-to-dashboard',
			action: 'add-widgets-to-dashboard',
			extra: {
				errorMessage,
				errorCode,
				status: error.response?.status,
				...extra,
			},
		});
	}

	// Show user-friendly error message based on error code
	if (errorCode === ERROR_CODES.INVALID_REQUEST) {
		toast.error(errorMessage || 'Invalid request. Please check your selection.');
	} else if (errorCode === ERROR_CODES.GRAPH_NOT_FOUND) {
		toast.error(errorMessage || 'Selected graph not found');
	} else if (errorCode === ERROR_CODES.TABLE_NOT_FOUND) {
		toast.error(errorMessage || 'Selected table not found');
	} else if (errorCode === ERROR_CODES.DASHBOARD_NOT_FOUND) {
		toast.error(errorMessage || 'Dashboard not found');
	} else {
		// Generic error message
		const userMessage =
			errorMessage ||
			errorData?.error ||
			errorData?.detail ||
			'Failed to add widgets to dashboard. Please try again.';
		toast.error(userMessage);
	}
};
