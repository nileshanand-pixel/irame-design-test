import { COGNITO_CLIENT_ID } from '@/config';
import { grantType } from '@/config/auth.config';
import { serviceUrlMap } from '@/config/url.config';
import { authAxiosClient } from '@/lib/axios';
import { resetCookies } from '@/lib/cookies';
import { resetAllStores } from '@/redux/GlobalStore';

export const logout = async () => {
	window.location.href = `${serviceUrlMap.AUTH_SERVICE}/logout?client_id=${COGNITO_CLIENT_ID}&logout_uri=${window.location.origin}`;
	const ignoreRefreshToken = true
	resetCookies(ignoreRefreshToken);
};

export const fullLogout = () => {
	window.location.href = `${serviceUrlMap.AUTH_SERVICE}/logout?client_id=${COGNITO_CLIENT_ID}&logout_uri=${window.location.origin}`;
	resetCookies();
	resetAllStores();
}

export const login = async (data) => {
	const response = await authAxiosClient.post('/authorize', data);
	return response.data;
};

export const LoginWithRefreshToken = async(refreshToken) => {
	const payload = {
		grant_type: grantType.REFRESH_TOKEN,
		client_id: COGNITO_CLIENT_ID,
		redirect_uri: window.location.href,
		refresh_token: refreshToken,
	};
	const response = await login(payload);
	return response; 
}
