import { COGNITO_CLIENT_ID } from '@/config';
import { serviceUrlMap } from '@/config/url.config';
import { authAxiosClient } from '@/lib/axios';
import { resetCookies } from '@/lib/cookies';

export const logout = async () => {
	window.location.href = `${serviceUrlMap.AUTH_SERVICE}/logout?client_id=${COGNITO_CLIENT_ID}&logout_uri=${window.location.origin}`;
	localStorage.clear();
	resetCookies();
};

export const loginWithEmailPassword = async (data) => {
	const response = await authAxiosClient.post('/authorize', data);
	return response.data;
};

export const loginWithGoogle = async (data) => {
	const response = await authAxiosClient.post('/authorize', data);
	return response.data;
};

export const getUserDetailsFromToken = () => {
	const accessToken = Cookies.get('access_token');
	const idToken = Cookies.get('id_token');
}
