import { useState, useEffect } from 'react';

const useGetCookie = (name) => {
	const [cookieValue, setCookieValue] = useState(null);

	useEffect(() => {
		// Function to get the value of a cookie by name
		const getCookieValue = (name) => {
			const cookies = document.cookie.split(';');
			console.log(cookies, 'cookies===inside');
			for (let cookie of cookies) {
				const [cookieName, cookieVal] = cookie.split('=');
				if (cookieName.trim() === name) {
					return decodeURIComponent(cookieVal);
				}
			}
			return null;
		};

		// Fetch the value of the cookie
		const value = getCookieValue(name);
		setCookieValue(value);
	}, [name]); // Re-run effect whenever the name changes

	return cookieValue;
};

export default useGetCookie;
