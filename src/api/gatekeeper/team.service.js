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
 * @returns {Promise<Object>} Paginated teams
 */
export const getTeams = async (params = {}) => {
	const response = await axiosGatekeeper.get('/teams', { params });
	return response.data;
};
