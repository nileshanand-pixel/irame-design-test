import { axiosGatekeeper } from '@/lib/axios';

/**
 * Get teams for the authenticated user
 * @returns {Promise<Array>} List of user's teams
 */
export const getUserTeams = async () => {
	const response = await axiosGatekeeper.get('/teams/user/teams');
	return response.data;
};
