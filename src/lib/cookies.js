import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { capitalizeFirstLetterFullText } from './utils';
import { grantType } from '@/config/auth.config';

export const resetCookies = (ignoreRefreshToken=false) => {
	const allCookies = Cookies.get();

	const alwaysIgnoredCookies = ['termsAccepted'];

	for (let cookieName in allCookies) {
		if(ignoreRefreshToken && cookieName === grantType.REFRESH_TOKEN)continue;
		if(alwaysIgnoredCookies.includes(cookieName))continue;
		Cookies.remove(cookieName);
	}
};

export const setupAuthCookies = (cookiesData) => {
	const { id_token, access_token, refresh_token, expires_in } = cookiesData;
	Cookies.set('id_token', id_token, { expires: expires_in / 3600 });
	Cookies.set('access_token', access_token, {
		expires: expires_in / 3600,
	});
	if (refresh_token) Cookies.set('refresh_token', refresh_token, { expires: 7 });
};

export const getUserDetailsFromToken = (token) => {
	const idToken = Cookies.get('id_token') || token;

	if (!idToken) {
		return null;
	}

	try {
		const decodedToken = jwtDecode(idToken);

		const userDetails = {
			user_name: capitalizeFirstLetterFullText(decodedToken?.name) || '',
			email: decodedToken.email || '',
			user_id: decodedToken['sub'] || '',
		};

		return userDetails;
	} catch (error) {
		console.error('Failed to decode token', error);
		return null;
	}
};
