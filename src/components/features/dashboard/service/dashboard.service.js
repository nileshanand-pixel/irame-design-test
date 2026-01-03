// Service layer for dashboard operations
// Uses adapter pattern for API data access

import { getDashboardAdapter } from './dashboard.adapter';
import { logError } from '@/lib/logger';

const adapter = getDashboardAdapter();

export const getMyDashboards = async (params = {}) => {
	try {
		const response = await adapter.getMyDashboards(params);
		const dashboards = response.data || [];
		if (response.dashboardsContainingQuery !== undefined) {
			dashboards.dashboardsContainingQuery =
				response.dashboardsContainingQuery;
		}
		return dashboards;
	} catch (error) {
		logError(error, {
			feature: 'live-dashboard',
			action: 'fetch-my-dashboards',
			extra: {
				errorMessage: error.message,
				status: error.response?.status,
			},
		});
		throw error;
	}
};

/**
 * Get all dashboards shared with the current user
 */
export const getSharedDashboards = async () => {
	try {
		const response = await adapter.getSharedDashboards();
		return response.data || [];
	} catch (error) {
		logError(error, {
			feature: 'live-dashboard',
			action: 'fetch-shared-dashboards',
			extra: {
				errorMessage: error.message,
				status: error.response?.status,
			},
		});
		throw error;
	}
};

/**
 * Create a new dashboard
 */
export const createDashboard = async (dashboardData) => {
	try {
		const response = await adapter.createDashboard(dashboardData);
		return response.data;
	} catch (error) {
		logError(error, {
			feature: 'live-dashboard',
			action: 'create-dashboard',
			extra: {
				errorMessage: error.message,
				status: error.response?.status,
				dashboardData,
			},
		});
		throw error;
	}
};

/**
 * Update an existing dashboard
 */
export const updateDashboard = async (id, dashboardData) => {
	try {
		const response = await adapter.updateDashboard(id, dashboardData);
		return response.data;
	} catch (error) {
		logError(error, {
			feature: 'live-dashboard',
			action: 'update-dashboard',
			extra: {
				errorMessage: error.message,
				status: error.response?.status,
				dashboardId: id,
				dashboardData,
			},
		});
		throw error;
	}
};

/**
 * Get a single dashboard by ID
 */
export const getDashboardById = async (id) => {
	try {
		const response = await adapter.getDashboardById(id);
		return response.data;
	} catch (error) {
		logError(error, {
			feature: 'live-dashboard',
			action: 'fetch-dashboard-by-id',
			extra: {
				errorMessage: error.message,
				status: error.response?.status,
				dashboardId: id,
			},
		});
		throw error;
	}
};

/**
 * Create dashboard content
 * @param {string} dashboardId - Dashboard ID
 * @param {Object} contentData - Content data
 * @returns {Promise<Object>} Created dashboard content
 */
export const createDashboardContent = async (dashboardId, contentData) => {
	try {
		const response = await adapter.createDashboardContent(
			dashboardId,
			contentData,
		);
		return response.data;
	} catch (error) {
		logError(error, {
			feature: 'live-dashboard',
			action: 'create-dashboard-content',
			extra: {
				errorMessage: error.message,
				status: error.response?.status,
				dashboardId,
				contentData,
			},
		});
		throw error;
	}
};

/**
 * Delete dashboard content items
 * @param {string} dashboardId - Dashboard ID
 * @param {string} contentId - Content ID
 * @param {Object} data - Data with graph and table ids
 * @returns {Promise<Object>} Updated dashboard content
 */
export const deleteDashboardContentItems = async (dashboardId, contentId, data) => {
	try {
		const response = await adapter.deleteDashboardContentItems(
			dashboardId,
			contentId,
			data,
		);
		return response.data;
	} catch (error) {
		logError(error, {
			feature: 'live-dashboard',
			action: 'delete-dashboard-content-items',
			extra: {
				errorMessage: error.message,
				status: error.response?.status,
				dashboardId,
				contentId,
				data,
			},
		});
		throw error;
	}
};

/**
 * Delete dashboard content item (wrapper for backward compatibility)
 * Converts singular function signature to plural API format
 * @param {string} dashboardId - Dashboard ID
 * @param {string} contentId - Content ID
 * @param {string} itemId - Item ID (graph ID or table URL)
 * @param {string} itemType - Item type ('graph' or 'table')
 * @returns {Promise<Object>} Updated dashboard content
 */
export const deleteDashboardContentItem = async (
	dashboardId,
	contentId,
	itemId,
	itemType,
) => {
	const data = {};
	if (itemType === 'graph') {
		data.graph_ids = [String(itemId)];
	} else if (itemType === 'table') {
		data.table_urls = [String(itemId)];
	} else {
		throw new Error(
			`Invalid item type: ${itemType}. Expected 'graph' or 'table'.`,
		);
	}
	return deleteDashboardContentItems(dashboardId, contentId, data);
};

/**
 * Get user dashboards with pagination (for dashboard tab)
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Dashboard list
 */
export const getUserDashboardsForDashboard = async (params = {}) => {
	try {
		const response = await adapter.getUserDashboardsForDashboard(params);
		return response;
	} catch (error) {
		logError(error, {
			feature: 'live-dashboard',
			action: 'fetch-user-dashboards-paginated',
			extra: {
				errorMessage: error.message,
				status: error.response?.status,
				params,
			},
		});
		throw error;
	}
};

/**
 * Get dashboard content
 * @param {string} id - Dashboard ID
 * @returns {Promise<Array>} Dashboard content list
 */
export const getDashboardContent = async (id) => {
	try {
		const response = await adapter.getDashboardContent(id);
		return Array.isArray(response) ? response : [];
	} catch (error) {
		logError(error, {
			feature: 'live-dashboard',
			action: 'fetch-dashboard-content',
			extra: {
				errorMessage: error.message,
				status: error.response?.status,
				dashboardId: id,
			},
		});
		throw error;
	}
};

/**
 * Delete user dashboard
 * @param {string} id - Dashboard ID
 * @returns {Promise<Object>} Success response
 */
export const deleteUserDashboard = async (id) => {
	try {
		await adapter.deleteUserDashboard(id);
		return { success: true };
	} catch (error) {
		logError(error, {
			feature: 'live-dashboard',
			action: 'delete-user-dashboard',
			extra: {
				errorMessage: error.message,
				status: error.response?.status,
				dashboardId: id,
			},
		});
		throw error;
	}
};

/**
 * Update dashboard name (wrapper for backward compatibility)
 * @param {string} id - Dashboard ID
 * @param {string} name - New dashboard name
 * @returns {Promise<Object>} Updated dashboard
 */
export const updateDashboardName = async (id, name) => {
	return updateDashboard(id, { title: name });
};

/**
 * Update dashboard refresh settings
 * @param {string} id - Dashboard ID
 * @param {number} autoRefreshInterval - Auto refresh interval in seconds (0 to disable)
 * @returns {Promise<Object>} Updated dashboard
 */
export const updateDashboardRefreshSettings = async (id, autoRefreshInterval) => {
	try {
		const response = await adapter.updateDashboardRefreshSettings(id, {
			autoRefreshInterval,
		});
		return response.data;
	} catch (error) {
		logError(error, {
			feature: 'live-dashboard',
			action: 'update-dashboard-refresh-settings',
			extra: {
				errorMessage: error.message,
				status: error.response?.status,
				dashboardId: id,
				autoRefreshInterval,
			},
		});
		throw error;
	}
};

/**
 * Refresh dashboard data
 * @param {string} id - Dashboard ID
 * @returns {Promise<Object>} Refresh response
 */
export const refreshDashboard = async (id) => {
	try {
		const response = await adapter.refreshDashboard(id);
		return response.data;
	} catch (error) {
		logError(error, {
			feature: 'live-dashboard',
			action: 'refresh-dashboard',
			extra: {
				errorMessage: error.message,
				status: error.response?.status,
				dashboardId: id,
			},
		});
		throw error;
	}
};
