import { useState, useEffect } from 'react';

const useAuth = () => {
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	useEffect(() => {
		const cookieExists = (name) => {
			return document.cookie
				.split(';')
				.some((cookie) => cookie.trim().startsWith(`${name}=`));
		};

		if (cookieExists('userId') && cookieExists('token')) {
			setIsAuthenticated(true);
		} else {
			setIsAuthenticated(false);
		}
	}, []);

	return { isAuthenticated };
};

export default useAuth;
