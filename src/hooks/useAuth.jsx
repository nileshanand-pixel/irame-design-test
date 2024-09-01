import { getToken } from '@/lib/utils';
import { useState, useEffect } from 'react';

const useAuth = () => {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const token = getToken();
		setIsAuthenticated(!!token);
		setIsLoading(false); // Set loading to false once the auth check is done
	}, []);

	return { isAuthenticated, isLoading };
};

export default useAuth;
