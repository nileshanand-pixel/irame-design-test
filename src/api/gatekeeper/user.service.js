import { axiosGatekeeper } from '@/lib/axios';

/**
 * User Service for Gatekeeper API
 */
export const userService = {
	/**
	 * Get all users for the current tenant
	 * @param {Object} params - Query parameters (status, page, limit)
	 * @returns {Promise<Object>} Paginated users
	 */
	getUsers: async (params = {}) => {
		const response = await axiosGatekeeper.get('/users', { params });
		return response.data;
	},

	/**
	 * Get user details by ID
	 * @param {string} userId - User ID
	 * @returns {Promise<Object>} User details
	 */
	getUserById: async (userId) => {
		const response = await axiosGatekeeper.get(`/users/${userId}`);
		return response.data;
	},

	/**
	 * Suspend a user
	 * @param {string} userId - User ID
	 * @returns {Promise<Object>} Result
	 */
	suspendUser: async (userId) => {
		const response = await axiosGatekeeper.post(`/users/${userId}/suspend`);
		return response.data;
	},

	/**
	 * Disable a user
	 * @param {string} userId - User ID
	 * @returns {Promise<Object>} Result
	 */
	disableUser: async (userId) => {
		const response = await axiosGatekeeper.post(`/users/${userId}/disable`);
		return response.data;
	},

	/**
	 * Enable a user
	 * @param {string} userId - User ID
	 * @returns {Promise<Object>} Result
	 */
	enableUser: async (userId) => {
		const response = await axiosGatekeeper.post(`/users/${userId}/enable`);
		return response.data;
	},

	/**
	 * Update user details (role, teams, name)
	 * @param {string} userId - User ID
	 * @param {Object} data - Update data (name, roleId, teamIds)
	 * @returns {Promise<Object>} Result
	 */
	updateUser: async (userId, data) => {
		const response = await axiosGatekeeper.patch(`/users/${userId}`, data);
		return response.data;
	},

	/**
	 * Invite a new user
	 * @param {Object} data - Invitation data (fullName, email, roleId, teamIds)
	 * @returns {Promise<Object>} Result
	 */
	inviteUser: async (data) => {
		const response = await axiosGatekeeper.post('/invitations', data);
		return response.data;
	},
};
