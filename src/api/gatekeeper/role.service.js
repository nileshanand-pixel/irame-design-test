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

	/**
	 * Create a new role
	 * @param {Object} roleData - { name, description }
	 * @returns {Promise<Object>}
	 */
	createRole: async (roleData) => {
		const response = await axiosGatekeeper.post('/roles', roleData);
		return response.data;
	},

	/**
	 * Update role details
	 * @param {string} roleId
	 * @param {Object} roleData - { name?, description? }
	 * @returns {Promise<Object>}
	 */
	updateRole: async (roleId, roleData) => {
		const response = await axiosGatekeeper.put(`/roles/${roleId}`, roleData);
		return response.data;
	},

	/**
	 * Update role permissions
	 * @param {string} roleId
	 * @param {Object} changes - { add: string[], remove: string[] }
	 * @returns {Promise<Object>}
	 */
	updateRolePermissions: async (roleId, changes) => {
		const response = await axiosGatekeeper.put(
			`/roles/${roleId}/permissions`,
			changes,
		);
		return response.data;
	},

	/**
	 * Clone a role
	 * @param {string} roleId
	 * @param {Object} cloneData - { name?, description? }
	 * @returns {Promise<Object>}
	 */
	cloneRole: async (roleId, cloneData) => {
		const response = await axiosGatekeeper.post(
			`/roles/${roleId}/clone`,
			cloneData,
		);
		return response.data;
	},

	/**
	 * Delete a role
	 * @param {string} roleId
	 * @returns {Promise<Object>}
	 */
	deleteRole: async (roleId) => {
		const response = await axiosGatekeeper.delete(`/roles/${roleId}`);
		return response.data;
	},
};
