import { axiosGatekeeper } from '@/lib/axios';

/**
 * Permission Service for Gatekeeper API
 */
export const permissionService = {
	/**
	 * Get all permissions grouped by resource
	 * @returns {Promise<Object>} Permissions grouped by resource type
	 */
	getPermissionsByResource: async () => {
		const response = await axiosGatekeeper.get('/permissions/by-resource');
		return response.data;
	},
};
