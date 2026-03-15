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
			logError(new Error('Session expired - forcing logout'), {
				feature: 'login',
				action: 'session-expired',
			});
			toast.error('Session expired. Logging out...');
			window.location.href = '/';
		}
	} catch (error) {
		logError(error, { feature: 'login', action: 'ensureCleanup' });
	}
};

export const logout = async (redirectUrl = '/') => {
	try {
		const response = await axiosClientV1.post('/users/logout');
		if (response.status === 200) {
			toast.success('Successfully logged out');
		} else {
			logError(new Error(`Logout failed with status ${response.status}`), {
				feature: 'login',
				action: 'logout',
			});
			toast.error('Something went wrong');
		}
	} catch (error) {
		logError(error, { feature: 'login', action: 'logout' });
		toast.error('Something went wrong');
	} finally {
		localStorage.removeItem('userDetails');
		// resetCookies();
		resetAllStores();
		if (window.location.pathname !== redirectUrl) {
			window.location.href = redirectUrl;
		}
	}
};

export const fullLogout = async (redirectUrl = '/') => {
	await logout(redirectUrl);
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
		captcha_token: data?.captchaToken,
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

export const sendOtpToEmail = async (data) => {
	const response = await axiosClientV1.post(
		'/users/reset-password/request-otp',
		data,
	);
	return response.data;
};

export const verifyOtp = async (data) => {
	const response = await axiosClientV1.post(
		'/users/reset-password/verify-otp',
		data,
	);
	return response.data;
};

export const resendOtp = async (data) => {
	const response = await axiosClientV1.post(
		'/users/reset-password/resend-otp',
		data,
	);
	return response.data;
};

export const resetPassword = async (data) => {
	const response = await axiosClientV1.post('/users/reset-password/reset', data);
	return response.data;
};
