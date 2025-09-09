import axiosClientV1 from '@/lib/axios';
import { logError } from '@/lib/logger';
import { resetCookies } from '@/lib/cookies';
import { resetAllStores } from '@/redux/GlobalStore';
import { untrackUser } from '@/lib/mixpanel';
import { toast } from '@/lib/toast';
import { grantType } from '@/config/auth.config';

export const ensureCleanup = async () => {
	try {
		storageLogoutCleanup();
		if (window.location.pathname !== '/') {
			toast.error('Session expired. Logging out...');
			window.location.href = '/';
		}
	} catch (error) {
		logError(error, { feature: 'login', action: 'ensureCleanup' });
	}
};

export const logout = async () => {
	try {
		const response = await axiosClientV1.post('/users/logout');
		if (response.status === 200) {
			toast.success('Successfully logged out');
		} else {
			toast.error('Something went wrong');
		}
	} catch (error) {
		logError(error, { feature: 'login', action: 'logout' });
		toast.error('Something went wrong');
	} finally {
		localStorage.removeItem('userDetails');
		// resetCookies();
		resetAllStores();
		if (window.location.pathname !== '/') {
			window.location.href = '/';
		}
	}
};

export const fullLogout = async () => {
	await logout();
	mixpanelLogoutCleanup();
	storageLogoutCleanup();
};

const storageLogoutCleanup = () => {
	localStorage.removeItem('userDetails');
	resetCookies();
	resetAllStores();
};

const mixpanelLogoutCleanup = () => {
	untrackUser();
};

export const login = async (data) => {
	const response = await axiosClientV1.post('/users/authenticate', {
		username: data.email,
		password: data.password,
		grant_type: grantType.USER_PASS_AUTH,
		redirect_uri: window.location.origin,
	});
	return [response.data, response.status];
};

export const ssoLogin = async (data) => {
	const response = await axiosClientV1.post('/users/authenticate', {
		code: data.code,
		grant_type: grantType.AUTH_CODE,
		redirect_uri: window.location.origin,
	});
	return [response.data, response.status];
};

export const getOAuthProviders = async () => {
	const response = await axiosClientV1.get('/users/oauth-providers');
	return response.data;
};

export const authUserDetails = async () => {
	const response = await axiosClientV1.get('/users/details');
	const data = response.data;
	data['user_name'] = data['name'];
	return data;
};
