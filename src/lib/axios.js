import axios from 'axios';
import { ensureCleanup } from '@/components/features/login/service/auth.service';
import { serviceUrlMap } from '@/config/url.config';
import { STAGE_APP_TOKEN } from '@/config';
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

const setupInterceptors = (axiosClient) => {
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

// Attach interceptors to both clients
setupInterceptors(axiosClientV1);
setupInterceptors(axiosClientV2);

export default axiosClientV1;
export { axiosClientV2 };
