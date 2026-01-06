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
	 * Get roles with user count
	 * @param {Object} params - Query parameters
	 * @returns {Promise<Object>} Paginated roles with user counts
	 */
	getRolesWithUserCount: async (params = {}) => {
		const response = await axiosGatekeeper.get('/roles/with-user-count', {
			params,
		});
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

	/**
	 * Get permissions for a specific role
	 * @param {string} roleId - Role ID
	 * @returns {Promise<Object>} Role permissions
	 */
	getRolePermissions: async (roleId) => {
		const response = await axiosGatekeeper.get(`/roles/${roleId}/permissions`);
		return response.data;
	},
};
