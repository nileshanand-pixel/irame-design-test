import { axiosGatekeeper } from '@/lib/axios';

/**
 * Activity Log Service for Gatekeeper API
 */
export const activityLogService = {
	/**
	 * Get activity logs with filters
	 * @param {Object} params - Query parameters
	 * @param {string} params.userId - Filter by user UUID
	 * @param {string} params.actionType - Specific action type
	 * @param {string} params.resourceType - Resource type filter
	 * @param {string} params.resourceId - Specific resource UUID
	 * @param {string} params.category - Event category
	 * @param {string} params.severity - Severity level
	 * @param {string} params.actorName - Actor name (ILIKE search)
	 * @param {string} params.startDate - ISO date-time start
	 * @param {string} params.endDate - ISO date-time end
	 * @param {number} params.page - Page number (0-indexed, default 0)
	 * @param {number} params.limit - Items per page (min 1, max 100, default 50)
	 * @returns {Promise<Object>} Paginated activity logs
	 */
	getActivityLogs: async (params = {}) => {
		const response = await axiosGatekeeper.get('/activity-logs', {
			params,
		});
		return response.data;
	},

	/**
	 * Export activity logs as CSV
	 * @param {Object} params - Query parameters (same as getActivityLogs)
	 * @returns {Promise<void>} Triggers CSV download
	 */
	exportActivityLogs: async (params = {}) => {
		try {
			const response = await axiosGatekeeper.get('/activity-logs/export', {
				params,
				responseType: 'blob',
			});

			// Create blob and trigger download
			const blob = response.data;
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Export failed:', error);
			throw error;
		}
	},

	/**
	 * Get single activity log by ID with enriched data
	 * @param {string} logId - Activity log ID (UUID)
	 * @returns {Promise<Object>} Enriched activity log
	 */
	getActivityLogById: async (logId) => {
		const response = await axiosGatekeeper.get(`/activity-logs/${logId}`);
		return response.data;
	},
};
