import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { capitalizeFirstLetterFullText } from './utils';

export const resetCookies = () => {
	const allCookies = Cookies.get();

	for (let cookieName in allCookies) {
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

export const getUserDetailsFromToken = () => {
	const idToken = Cookies.get('id_token');

	if (!idToken) {
		return null;
	}

	try {
		const decodedToken = jwtDecode(idToken);

		const userDetails = {
			userName: capitalizeFirstLetterFullText(decodedToken?.name) || '',
			email: decodedToken.email || '',
			userId: decodedToken['cognito:username'] || '',
			avatar: '',
		};

		return userDetails;
	} catch (error) {
		console.error('Failed to decode token', error);
		return null;
	}
};
