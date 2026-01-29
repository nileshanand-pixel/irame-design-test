import { axiosGatekeeper } from '@/lib/axios';
import { logError } from '@/lib/logger';

/**
 * Get all users with access to a dashboard
 * @param {string} dashboardId - Dashboard ID
 * @returns {Promise<Object>} { dashboard_id, owner, shared_users }
 */
export const getDashboardAccessUsers = async (dashboardId) => {
	try {
		const response = await axiosGatekeeper.get(
			`/api/resources/dashboard/${dashboardId}/access-users`,
		);
		return response.data;
	} catch (error) {
		logError(error, {
			feature: 'dashboard',
			action: 'get-access-users',
			dashboardId,
		});
		throw error;
	}
};
