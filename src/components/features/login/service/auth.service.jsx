import Cookies from 'js-cookie';
import { COGNITO_CLIENT_ID } from '@/config';
import { grantType } from '@/config/auth.config';
import { serviceUrlMap } from '@/config/url.config';
import { authAxiosClient } from '@/lib/axios';
import axiosClientV1 from '@/lib/axios';
import { resetCookies } from '@/lib/cookies';
import { resetAllStores } from '@/redux/GlobalStore';
import { trackEvent, untrackUser } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';

export const refreshFailureLogout = async () => {
	storageLogoutCleanup();
};

export const fullLogout = async () => {
	await revokeToken();
	mixpanelLogoutCleanup();
	window.location.href = `${serviceUrlMap.AUTH_SERVICE}/logout?client_id=${COGNITO_CLIENT_ID}&logout_uri=${window.location.origin}`;
	storageLogoutCleanup();
};

const storageLogoutCleanup = () => {
	localStorage.removeItem('auth-user-data');
	localStorage.removeItem('userDetails');
	resetCookies();
	resetAllStores();
};
const mixpanelLogoutCleanup = () => {
	trackEvent(EVENTS_ENUM.SUCCESSFUL_LOGOUT, EVENTS_REGISTRY.SUCCESSFUL_LOGOUT);
	untrackUser();
};

export const login = async (data) => {
	const response = await axiosClientV1.post('users/authenticate', data);
	return response.data;
};

export const LoginWithRefreshToken = async (refreshToken) => {
	const payload = {
		grant_type: grantType.REFRESH_TOKEN,
		client_id: COGNITO_CLIENT_ID,
		redirect_uri: window.location.href,
		refresh_token: refreshToken,
	};
	const response = await login(payload);
	return response;
};

export const revokeToken = async () => {
	const refreshToken = Cookies.get('refresh_token');
	const idToken = Cookies.get('id_token');
	if (!refreshToken || !idToken) return;

	const data = {
		refresh_token: refreshToken,
		id_token: idToken,
	};
	try {
		const response = await axiosClientV1.post('users/logout', data);
	} catch (error) {
		console.error('Failed to revoke token while logging out');
	}
};
export const authUserDetails = async (token) => {
	const response = await axiosClientV1.get(`/users/details`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return response.data;
};
