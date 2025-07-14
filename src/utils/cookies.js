export const setCookie = (name, value, durationInMs) => {
	const expires = new Date();
	expires.setTime(expires.getTime() + durationInMs);

	document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/`;
};

export const getCookie = (name) => {
	const cookies = document.cookie.split(';');

	for (let cookie of cookies) {
		const [key, value] = cookie.trim().split('=');
		if (key === name) {
			return decodeURIComponent(value);
		}
	}

	return null; // Cookie not found
};

export const updateCookieExpiration = (name, newDurationMs) => {
	const value = getCookie(name);

	const expires = new Date(Date.now() + newDurationMs);
	document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/`;
};
