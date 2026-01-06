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
