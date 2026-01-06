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
	 * @returns {Promise<Blob>} CSV file blob
	 */
	exportActivityLogs: async (params = {}) => {
		const response = await axiosGatekeeper.get('/activity-logs/export', {
			params,
			responseType: 'blob',
		});
		return response.data;
	},
};
