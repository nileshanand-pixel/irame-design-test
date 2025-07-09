import Cookies from 'js-cookie';

export const resetCookies = () => {
	const allCookies = Cookies.get();
	const alwaysIgnoredCookies = ['termsAccepted'];

	for (let cookieName in allCookies) {
		if (alwaysIgnoredCookies.includes(cookieName)) continue;
		Cookies.remove(cookieName);
	}
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
