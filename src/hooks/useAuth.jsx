import { useState, useEffect } from 'react';
import { authUserDetails } from '@/components/features/login/service/auth.service';
import { toast } from '@/lib/toast';

const useAuth = () => {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [userDetails, setUserDetails] = useState(null);

	useEffect(() => {
		const checkAuth = async () => {
			try {
				const response = await authUserDetails();
				setIsAuthenticated(true);
				setUserDetails(response);
			} catch (error) {
				if (error.response?.status === 401) {
					setIsAuthenticated(false);
					setUserDetails(null);
				} else {
					// toast.error('Failed to check authentication status');
				}
			} finally {
				setIsLoading(false);
			}
		};

		checkAuth();
	}, []);

	return { isAuthenticated, isLoading, userDetails };
};

export default useAuth;
