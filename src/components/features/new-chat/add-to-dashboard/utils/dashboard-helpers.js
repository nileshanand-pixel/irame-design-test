/**
 * Utility functions for dashboard operations
 */

/**

 * @param {Object} dashboard - Dashboard object
 * @returns {string|null} Dashboard ID or null
 */
export const getDashboardId = (dashboard) => {
	if (!dashboard) return null;
	return dashboard.dashboard_id || dashboard.id || null;
};

/**
 * @param {Object} dashboard - Dashboard object
 * @param {string} fallback - Fallback title
 * @returns {string} Dashboard title
 */
export const getDashboardTitle = (dashboard, fallback = 'Untitled Dashboard') => {
	return dashboard?.title || fallback;
};

/**
 * Checks if a dashboard is in a list of dashboards
 *
 * @param {Object} dashboard - Dashboard to check
 * @param {Array} dashboardList - List of dashboards
 * @returns {boolean} True if dashboard exists in list
 */
export const isDashboardInList = (dashboard, dashboardList) => {
	if (!dashboard || !dashboardList || !Array.isArray(dashboardList)) {
		return false;
	}

	const dashboardId = getDashboardId(dashboard);
	if (!dashboardId) return false;

	return dashboardList.some((d) => getDashboardId(d) === dashboardId);
};

/**
 * Finds a dashboard by ID in a list
 *
 * @param {string} dashboardId - Dashboard ID to find
 * @param {Array} dashboardList - List of dashboards
 * @returns {Object|null} Dashboard object or null
 */
export const findDashboardById = (dashboardId, dashboardList) => {
	if (!dashboardId || !dashboardList || !Array.isArray(dashboardList)) {
		return null;
	}

	return dashboardList.find((d) => getDashboardId(d) === dashboardId) || null;
};

/**
 * Creates dashboard URL for opening in new tab
 *
 * @param {Object} dashboard - Dashboard object
 * @returns {string|null} Dashboard URL or null
 */
export const createDashboardUrl = (dashboard) => {
	const dashboardId = getDashboardId(dashboard);
	if (!dashboardId) return null;

	const name = encodeURIComponent(getDashboardTitle(dashboard, ''));
	return `${window.location.origin}/app/dashboard/content?id=${dashboardId}&name=${name}`;
};
