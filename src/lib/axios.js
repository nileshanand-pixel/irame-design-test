import axios from 'axios';
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

// Client for the gatekeeper service v1
const axiosGatekeeper = axios.create({
	baseURL: serviceUrlMap.GATEKEEPER_SERVICE_V1,
	headers: headers,
	withCredentials: true,
});

const setupInterceptors = (axiosClient) => {
	// Request interceptor: attach X-TEAM-ID for GET calls when RBAC enabled
	axiosClient.interceptors.request.use(
		(config) => {
			try {
				if (
					ENABLE_RBAC &&
					config &&
					config.method &&
					config.method.toLowerCase() === 'get'
				) {
					const raw = localStorage.getItem('userDetails');
					const user = raw ? JSON.parse(raw) : null;
					const userId =
						user && (user.user_id || user.id || user.sub || user.userId);
					if (userId) {
						const teamId = localStorage.getItem(`team_${userId}`);
						if (teamId) {
							config.headers = config.headers || {};
							config.headers['X-TEAM-ID'] = teamId;
						}
					}
				}
			} catch (e) {
				// ignore and continue without team header
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

			if (error.response && error.response.status === 401 && !isLoggingOut) {
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
setupInterceptors(axiosGatekeeper);

export default axiosClientV1;
export { axiosClientV2, axiosGatekeeper };
