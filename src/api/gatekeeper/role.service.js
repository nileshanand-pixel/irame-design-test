import { axiosGatekeeper } from '@/lib/axios';

/**
 * Role Service for Gatekeeper API
 */
export const roleService = {
	/**
	 * Get all roles for the tenant
	 * @param {Object} params - Query parameters
	 * @returns {Promise<Object>} Paginated roles
	 */
	getRoles: async (params = {}) => {
		const response = await axiosGatekeeper.get('/roles', { params });
		return response.data;
	},

	/**
	 * Get role details by ID
	 * @param {string} roleId - Role ID
	 * @returns {Promise<Object>} Role details
	 */
	getRoleById: async (roleId) => {
		const response = await axiosGatekeeper.get(`/roles/${roleId}`);
		return response.data;
	},
};
