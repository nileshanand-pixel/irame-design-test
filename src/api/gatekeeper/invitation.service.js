import { axiosGatekeeper } from '@/lib/axios';

/**
 * Invitation Service for Gatekeeper API
 */
export const invitationService = {
	/**
	 * Validate invitation token
	 * @param {string} token - Invitation token
	 * @returns {Promise<Object>} Invitation details
	 */
	validateToken: async (token) => {
		const response = await axiosGatekeeper.get(`/invitations/${token}/validate`);
		return response.data;
	},

	/**
	 * Accept invitation
	 * @param {string} token - Invitation token
	 * @returns {Promise<Object>} Result
	 */
	acceptInvitation: async (token) => {
		const response = await axiosGatekeeper.post(`/invitations/${token}/accept`);
		return response.data;
	},

	/**
	 * Decline invitation
	 * @param {string} token - Invitation token
	 * @returns {Promise<Object>} Result
	 */
	declineInvitation: async (token) => {
		const response = await axiosGatekeeper.post(`/invitations/${token}/decline`);
		return response.data;
	},

	/**
	 * Get all invitations for the current tenant
	 * @param {Object} params - Query parameters (status, page, limit, search)
	 * @returns {Promise<Object>} Paginated invitations
	 */
	getInvitations: async (params = {}) => {
		const response = await axiosGatekeeper.get('/invitations', { params });
		return response.data;
	},

	/**
	 * Resend invitation email
	 * @param {string} invitationId - Invitation ID
	 * @returns {Promise<Object>} Result
	 */
	resendInvitation: async (invitationId) => {
		const response = await axiosGatekeeper.post(
			`/invitations/${invitationId}/resend`,
		);
		return response.data;
	},

	/**
	 * Revoke invitation
	 * @param {string} invitationId - Invitation ID
	 * @returns {Promise<Object>} Result
	 */
	revokeInvitation: async (invitationId) => {
		const response = await axiosGatekeeper.delete(
			`/invitations/${invitationId}`,
		);
		return response.data;
	},
};
