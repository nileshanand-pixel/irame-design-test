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
