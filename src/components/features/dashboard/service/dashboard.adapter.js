import axiosClientV1, { axiosClientV2 } from '@/lib/axios';
import { getTimeAgo } from '@/utils/common';
import { ENABLE_RBAC } from '@/config';

/**
 * Abstract adapter interface
 * All dashboard data operations should go through this interface
 */
export class DashboardAdapter {
	async getMyDashboards() {
		throw new Error('getMyDashboards must be implemented');
	}

	async getSharedDashboards() {
		throw new Error('getSharedDashboards must be implemented');
	}

	async createDashboard(data) {
		throw new Error('createDashboard must be implemented');
	}

	async updateDashboard(id, data) {
		throw new Error('updateDashboard must be implemented');
	}

	async getDashboardById(id) {
		throw new Error('getDashboardById must be implemented');
	}

	async createDashboardContent(dashboardId, data) {
		throw new Error('createDashboardContent must be implemented');
	}

	async deleteDashboardContentItems(dashboardId, contentId, data) {
		throw new Error('deleteDashboardContentItems must be implemented');
	}

	async getUserDashboardsForDashboard(params) {
		throw new Error('getUserDashboardsForDashboard must be implemented');
	}

	async getDashboardContent(id) {
		throw new Error('getDashboardContent must be implemented');
	}

	async deleteUserDashboard(id) {
		throw new Error('deleteUserDashboard must be implemented');
	}

	async updateDashboardRefreshSettings(id, data) {
		throw new Error('updateDashboardRefreshSettings must be implemented');
	}

	async refreshDashboard(id) {
		throw new Error('refreshDashboard must be implemented');
	}

	async shareDashboard(id, data) {
		throw new Error('shareDashboard must be implemented');
	}

	async revokeDashboardAccess(id, userId) {
		throw new Error('revokeDashboardAccess must be implemented');
	}

	async updateDashboardVisibility(id, visibility) {
		throw new Error('updateDashboardVisibility must be implemented');
	}
}

/**
 * Transform API dashboard data to match expected format
 */
const transformDashboard = (apiDashboard, isShared = false) => {
	const dashboardId = apiDashboard.dashboard_id || apiDashboard.id;
	return {
		id: dashboardId,
		dashboard_id: dashboardId, // Include for backward compatibility
		title: apiDashboard.title || 'Untitled Dashboard',
		description: apiDashboard.description || '',
		type: apiDashboard.type || null,
		createdAt:
			apiDashboard.created_at ||
			apiDashboard.createdAt ||
			new Date().toISOString(),
		updatedAt:
			apiDashboard.updated_at ||
			apiDashboard.updatedAt ||
			new Date().toISOString(),
		createdBy: {
			id:
				apiDashboard.created_by?.id ||
				apiDashboard.createdBy?.id ||
				'user-1',
			name: isShared
				? apiDashboard.created_by?.name ||
					apiDashboard.createdBy?.name ||
					'Unknown User'
				: 'You',
			email:
				apiDashboard.created_by?.email ||
				apiDashboard.createdBy?.email ||
				'',
			avatar:
				apiDashboard.created_by?.avatar ||
				apiDashboard.createdBy?.avatar ||
				null,
		},
		isShared,
		sharedWith: apiDashboard.shared_with || apiDashboard.sharedWith || [],
		tags: apiDashboard.tags || [],
		timeAgo: getTimeAgo(
			apiDashboard.updated_at ||
				apiDashboard.updatedAt ||
				apiDashboard.created_at ||
				apiDashboard.createdAt,
		),
	};
};

/**
 * API adapter implementation
 */
export class APIDashboardAdapter extends DashboardAdapter {
	constructor(apiClient, options = {}) {
		super();
		this.api = apiClient;
		this.useSpaceParam = options.useSpaceParam ?? true;
	}

	async getMyDashboards(params = {}) {
		try {
			// Build query parameters
			const queryParams = {};
			if (this.useSpaceParam) {
				queryParams.space = 'personal';
			}
			if (params.limit) queryParams.limit = params.limit;
			if (params.cursor) queryParams.cursor = params.cursor;
			if (params.start_date) queryParams.start_date = params.start_date;
			if (params.end_date) queryParams.end_date = params.end_date;
			if (params.query_id) queryParams.query_id = params.query_id;

			const response = await this.api.get('/dashboards', {
				params: queryParams,
			});

			const dashboardList = response.data?.dashboard_list || [];
			const dashboardsContainingQueryList =
				response.data?.dashboards_containing_query_list || [];

			const transformedDashboards = dashboardList.map((dashboard) =>
				transformDashboard(dashboard, false),
			);

			const transformedQueryDashboards = dashboardsContainingQueryList.map(
				(dashboard) => transformDashboard(dashboard, false),
			);

			return {
				success: true,
				data: transformedDashboards,
				dashboardsContainingQuery: transformedQueryDashboards,
			};
		} catch (error) {
			throw error;
		}
	}

	async getSharedDashboards(params = {}) {
		try {
			// Build query parameters
			const queryParams = {
				space: 'shared',
			};
			if (params.limit) queryParams.limit = params.limit;
			if (params.cursor) queryParams.cursor = params.cursor;
			if (params.start_date) queryParams.start_date = params.start_date;
			if (params.end_date) queryParams.end_date = params.end_date;
			if (params.query_id) queryParams.query_id = params.query_id;

			const response = await this.api.get('/dashboards', {
				params: queryParams,
			});

			const dashboards = response.data?.dashboard_list || [];

			// Transform API data using transformDashboard
			const transformedDashboards = dashboards.map((dashboard) =>
				transformDashboard(dashboard, true),
			);

			return {
				success: true,
				data: transformedDashboards,
			};
		} catch (error) {
			throw error;
		}
	}

	async createDashboard(data) {
		try {
			const payload = {
				title: data.title,
				description: data.description || '',
			};

			// Add V2 specific fields if present
			if (data.visibility) {
				payload.visibility = data.visibility;
			}

			const response = await this.api.post('/dashboards', payload);

			const newDashboard = transformDashboard(response.data, false);

			return {
				success: true,
				data: newDashboard,
			};
		} catch (error) {
			throw error;
		}
	}

	async updateDashboard(id, data) {
		try {
			const body = {};
			if (data.title !== undefined) {
				body.title = data.title;
			}
			if (data.description !== undefined) {
				if (data.description !== null) {
					body.description = data.description;
				}
			}

			const response = await this.api.put(`/dashboards/${id}`, body);

			const updatedDashboard = transformDashboard(response.data, false);

			return {
				success: true,
				data: updatedDashboard,
			};
		} catch (error) {
			throw error;
		}
	}

	async getDashboardById(id) {
		try {
			const response = await this.api.get(`/dashboards/${id}`);
			// const dashboard = transformDashboard(response.data, false);

			return {
				success: true,
				data: response.data,
			};
		} catch (error) {
			throw error;
		}
	}

	async createDashboardContent(dashboardId, data) {
		try {
			const body = {
				query_id: data.queryId,
			};

			// Add graph_ids if provided (max 1 per API contract)
			if (data.graphIds && data.graphIds.length > 0) {
				body.graph_ids = data.graphIds;
			}

			// Add table_urls if provided (max 1 per API contract)
			if (data.tableUrls && data.tableUrls.length > 0) {
				body.table_urls = data.tableUrls;
			}

			const response = await this.api.post(
				`/dashboards/${dashboardId}/contents`,
				body,
			);

			return {
				success: true,
				data: response.data,
			};
		} catch (error) {
			throw error;
		}
	}

	async deleteDashboardContentItems(dashboardId, contentId, data) {
		try {
			const body = {};

			// Add graph_ids if provided
			if (data.graph_ids && data.graph_ids.length > 0) {
				body.graph_ids = data.graph_ids;
			}

			// Add table_urls if provided
			if (data.table_urls && data.table_urls.length > 0) {
				body.table_urls = data.table_urls;
			}

			const response = await this.api.delete(
				`/dashboards/${dashboardId}/contents/${contentId}/items`,
				{
					data: body,
				},
			);

			return {
				success: true,
				data: response.data,
			};
		} catch (error) {
			throw error;
		}
	}

	async getUserDashboardsForDashboard(params = {}) {
		try {
			const queryParams = {};
			if (params.limit) queryParams.limit = params.limit;
			if (params.cursor) queryParams.cursor = params.cursor;
			if (params.start_date) queryParams.start_date = params.start_date;
			if (params.end_date) queryParams.end_date = params.end_date;

			const response = await this.api.get('/dashboards', {
				params: queryParams,
			});

			return {
				dashboard_list: response.data?.dashboard_list || [],
				cursor: response.data?.cursor,
			};
		} catch (error) {
			throw error;
		}
	}

	async getDashboardContent(id) {
		try {
			const response = await this.api.get(`/dashboards/${id}/contents`);
			return response.data?.dashboard_content_list || [];
		} catch (error) {
			throw error;
		}
	}

	async deleteUserDashboard(id) {
		try {
			await this.api.delete(`/dashboards/${id}`);
			return { success: true };
		} catch (error) {
			throw error;
		}
	}

	async updateDashboardRefreshSettings(id, data) {
		try {
			const body = {
				auto_refresh_interval: data.autoRefreshInterval,
			};

			const response = await this.api.patch(
				`/dashboards/${id}/refresh-settings`,
				body,
			);

			return {
				success: true,
				data: response.data,
			};
		} catch (error) {
			throw error;
		}
	}

	async refreshDashboard(id) {
		try {
			const response = await this.api.post(`/dashboards/${id}/refresh`);

			return {
				success: true,
				data: response.data,
			};
		} catch (error) {
			throw error;
		}
	}

	async shareDashboard(id, data) {
		try {
			await this.api.post(`/dashboards/${id}/share`, data);
			return { success: true };
		} catch (error) {
			throw error;
		}
	}

	async revokeDashboardAccess(id, userId) {
		try {
			await this.api.delete(`/dashboards/${id}/access/${userId}`);
			return { success: true };
		} catch (error) {
			throw error;
		}
	}

	async updateDashboardVisibility(id, visibility) {
		try {
			await this.api.patch(`/dashboards/${id}/visibility`, { visibility });
			return { success: true };
		} catch (error) {
			throw error;
		}
	}
}

/**
 * Factory function to get the appropriate adapter
 */
export const getDashboardAdapter = () => {
	let isRbacActive = false;
	try {
		const raw = localStorage.getItem('userDetails');
		const userDetails = raw ? JSON.parse(raw) : null;
		isRbacActive = ENABLE_RBAC && userDetails?.is_rbac_enabled;
	} catch (e) {
		// fallback to non-RBAC
	}

	if (isRbacActive) {
		return new APIDashboardAdapter(axiosClientV2, { useSpaceParam: true });
	}
	return new APIDashboardAdapter(axiosClientV1, { useSpaceParam: false });
};
