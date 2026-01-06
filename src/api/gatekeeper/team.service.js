import { axiosGatekeeper } from '@/lib/axios';

/**
 * Get teams for the authenticated user
 * @returns {Promise<Array>} List of user's teams
 */
export const getUserTeams = async () => {
	const response = await axiosGatekeeper.get('/teams/user/teams');
	return response.data;
};

/**
 * Get all teams for the tenant
 * @param {Object} params - Query parameters (id, name, page, limit, sortBy, sortOrder)
 * @returns {Promise<Object>} Paginated teams
 */
export const getTeams = async (params = {}) => {
	const response = await axiosGatekeeper.get('/teams/tenant', { params });
	return response.data;
};

/**
 * Create a new team
 * @param {Object} data - Team data (name, memberIds)
 * @returns {Promise<Object>} Created team
 */
export const createTeam = async (data) => {
	const response = await axiosGatekeeper.post('/teams', data);
	return response.data;
};

/**
 * Update team information
 * @param {string} teamId - Team ID
 * @param {Object} data - Update data (name)
 * @returns {Promise<Object>} Updated team
 */
export const updateTeam = async (teamId, data) => {
	const response = await axiosGatekeeper.put(`/teams/${teamId}`, data);
	return response.data;
};

/**
 * Get team members with roles
 * @param {string} teamId
 * @returns {Promise<Object>} Team members with roles
 */
export const getTeamMembersWithRoles = async (teamId) => {
	const response = await axiosGatekeeper.get(`/teams/${teamId}/members`, {
		params: { includeTeamRoles: true },
	});
	return response.data;
};

/**
 * Get available users to add to a team
 * @param {string} teamId
 * @param {number} limit
 * @returns {Promise<Object>} Available users
 */
export const getAvailableUsers = async (teamId, limit = 100) => {
	const response = await axiosGatekeeper.get(`/teams/${teamId}/available-users`, {
		params: { limit },
	});
	return response.data;
};

/**
 * Add members to a team (bulk)
 * @param {string} teamId
 * @param {string[]} memberIds
 * @returns {Promise<Object>} Added result
 */
export const addTeamMembers = async (teamId, memberIds) => {
	const response = await axiosGatekeeper.post(`/teams/${teamId}/members`, {
		memberIds,
	});
	return response.data;
};

/**
 * Remove a single member from a team
 * @param {string} teamId
 * @param {string} userId
 * @returns {Promise<Object>} Removal result
 */
export const removeTeamMember = async (teamId, userId) => {
	const response = await axiosGatekeeper.delete(`/teams/${teamId}/members`, {
		data: { memberIds: [userId] },
	});
	return response.data;
};

/**
 * Promote a user to team admin
 * @param {string} teamId
 * @param {string} userId
 * @returns {Promise<Object>} Promotion result
 */
export const promoteToAdmin = async (teamId, userId) => {
	const response = await axiosGatekeeper.post(`/teams/${teamId}/admins/${userId}`);
	return response.data;
};

/**
 * Demote a user from team admin
 * @param {string} teamId
 * @param {string} userId
 * @returns {Promise<Object>} Demotion result
 */
export const demoteFromAdmin = async (teamId, userId) => {
	const response = await axiosGatekeeper.delete(
		`/teams/${teamId}/admins/${userId}`,
	);
	return response.data;
};
