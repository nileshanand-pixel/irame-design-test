import axios from 'axios';
import { toast } from 'react-toastify';
import { ensureCleanup } from '@/components/features/login/service/auth.service';
import { serviceUrlMap } from '@/config/url.config';
import { STAGE_APP_TOKEN, ENABLE_RBAC } from '@/config';
import { logError } from './logger';

let isLoggingOut = false;

const headers = {
	'Content-Type': 'application/json',
};

if (STAGE_APP_TOKEN) {
	headers['x-app-token'] = STAGE_APP_TOKEN;
}

// Client for the data manager service v1
const axiosClientV1 = axios.create({
	baseURL: serviceUrlMap.DATA_MANAGER_SERVICE_V1,
	headers: headers,
	withCredentials: true,
});

// Client for the data manager service v2
const axiosClientV2 = axios.create({
	baseURL: serviceUrlMap.DATA_MANAGER_SERVICE_V2,
	headers: headers,
	withCredentials: true,
});

// Client for the data manager service v3
const axiosClientV3 = axios.create({
	baseURL: serviceUrlMap.DATA_MANAGER_SERVICE_V3,
	headers: headers,
	withCredentials: true,
});

// Client for the gatekeeper service v1
const axiosGatekeeper = axios.create({
	baseURL: serviceUrlMap.GATEKEEPER_SERVICE_V1,
	headers: headers,
	withCredentials: true,
});

const setupInterceptors = (axiosClient) => {
	// Request interceptor: attach X-TENANT-ID, X-USER-ID, and X-TEAM-ID when RBAC enabled
	axiosClient.interceptors.request.use(
		(config) => {
			try {
				// Skip auth headers for public invitation routes
				const isInvitationRoute =
					config.url?.includes('/invitations/') &&
					config.url?.match(/\/(validate|accept|decline)$/);

				if (ENABLE_RBAC && config && !isInvitationRoute) {
					const raw = localStorage.getItem('userDetails');
					const user = raw ? JSON.parse(raw) : null;
					const userId =
						user && (user.user_id || user.id || user.sub || user.userId);
					const tenantId = user && (user.tenant_id || user.tenantId);

					if (userId) {
						config.headers = config.headers || {};
						config.headers['X-USER-ID'] = userId;

						// Add X-TEAM-ID if available in localStorage
						const teamId = localStorage.getItem(`team_${userId}`);
						if (teamId) {
							config.headers['X-TEAM-ID'] = teamId;
						}
					}

					if (tenantId) {
						config.headers = config.headers || {};
						config.headers['X-TENANT-ID'] = tenantId;
					}
				}
			} catch (e) {
				// ignore and continue without headers
			}
			return config;
		},
		(error) => Promise.reject(error),
	);
	axiosClient.interceptors.response.use(
		(response) => {
			return response;
		},
		async (error) => {
			// Log HTTP errors to Sentry (except 401 as they're expected for auth flow)
			if (error.response && error.response.status !== 401) {
				logError(error, {
					feature: 'http_client',
					action: 'api_request_failed',
					extra: {
						status: error.response?.status,
						statusText: error.response?.statusText,
						method: error.config?.method,
						baseURL: error.config?.baseURL,
					},
				});
			}

			// Check if this is an invitation endpoint
			const isInvitationRoute =
				error.config?.url?.includes('/invitations/') &&
				error.config?.url?.match(/\/(validate|accept|decline)$/);

			// Show a user-visible toast for non-401 errors (avoid double toasts for auth flow)
			try {
				if (error.response && error.response.status !== 401) {
					const msg =
						error.response?.data?.message ||
						error.message ||
						'API request failed';
					toast.error(msg);
				}
			} catch (e) {
				// ignore toast errors
			}

			// Only log out on 401 if NOT an invitation route
			if (
				error.response &&
				error.response.status === 401 &&
				!isLoggingOut &&
				!isInvitationRoute
			) {
				isLoggingOut = true;
				await ensureCleanup();
			}

			return Promise.reject(error);
		},
	);
};

// Attach interceptors to all clients
setupInterceptors(axiosClientV1);
setupInterceptors(axiosClientV2);
setupInterceptors(axiosClientV3);
setupInterceptors(axiosGatekeeper);

export default axiosClientV1;
export { axiosClientV2, axiosClientV3, axiosGatekeeper };
