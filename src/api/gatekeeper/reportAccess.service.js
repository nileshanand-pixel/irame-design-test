import { axiosGatekeeper } from '@/lib/axios';
import { logError } from '@/lib/logger';

/**
 * Get all users with access to a report
 * @param {string} reportId - Report ID
 * @returns {Promise<Object>} { report_id, owner, shared_users }
 */
export const getReportAccessUsers = async (reportId) => {
	try {
		const response = await axiosGatekeeper.get(
			`/resources/report/${reportId}/access-users`,
		);
		return response.data;
	} catch (error) {
		logError(error, {
			feature: 'report',
			action: 'get-access-users',
			reportId,
		});
		throw error;
	}
};
