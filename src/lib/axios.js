import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import {
    fullLogout,
	LoginWithRefreshToken,
} from '@/components/features/login/service/auth.service';
import { serviceUrlMap } from '@/config/url.config';
import { setupAuthCookies } from './cookies';

let isLoggingOut = false;

// Client for the data manager service
const axiosClient = axios.create({
	baseURL: serviceUrlMap.DATA_MANAGER_SERVICE,
	headers: {
		'Content-Type': 'application/json',
	},
});

// Client for the oauth service
const authAxiosClient = axios.create({
	baseURL: serviceUrlMap.OAUTH_SERVICE,
	headers: {
		'Content-Type': 'application/json',
	},
});

const handleTokenRefresh = async () => {
	const refreshToken = Cookies.get('refresh_token');
	if (!refreshToken) return null;

	try {
		const response = await LoginWithRefreshToken(refreshToken);
		if (response.status_code === 200) {
			const { id_token, access_token, expires_in } = response.body;
			const cookiesData = {
				id_token,
				access_token,
				expires_in,
			};

			// Save the new tokens in cookies
			setupAuthCookies(cookiesData);

			return id_token;
		}
	} catch (error) {
		console.error(
			'An error occurred while refreshing the token. Please try again.',
		);
		return null;
	}
};

const setupInterceptors = (axiosClient) => {
	axiosClient.interceptors.response.use(
		(response) => {
			return response;
		},
		async (error) => {
			if (error.response && error.response.status === 401 && !isLoggingOut) {
				const originalRequest = error.config;

				// Try to refresh the token
				const newToken = await handleTokenRefresh();
				if (newToken) {
					// Set the Authorization header with the new token
					originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
					// Retry the original request with the new token
					return axiosClient(originalRequest);
				} else {
					// Token refresh failed, proceed to log out
					toast.error('Session expired. Logging out...');
					isLoggingOut = true;
					fullLogout();
				}
			}
			return Promise.reject(error);
		},
	);
};

// Attach interceptors to both clients
setupInterceptors(axiosClient);
setupInterceptors(authAxiosClient);

export default axiosClient;
export { authAxiosClient };
