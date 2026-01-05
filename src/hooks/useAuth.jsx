import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { authUserDetails } from '@/components/features/login/service/auth.service';
import { toast } from '@/lib/toast';
import { logError } from '@/lib/logger';
import { useDispatch } from 'react-redux';
import { updateAuthStoreProp } from '@/redux/reducer/authReducer';

const useAuth = ({ skip = false } = {}) => {
	const location = useLocation();
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [userDetails, setUserDetails] = useState(null);
	const dispatch = useDispatch();

	useEffect(() => {
		// Skip auth check for public routes
		if (skip) {
			setIsAuthenticated(false);
			setIsLoading(false);
			setUserDetails(null);
			return;
		}

		const checkAuth = async () => {
			try {
				const response = await authUserDetails();
				setIsAuthenticated(true);
				setUserDetails(response);

				// Set user_id in Redux store from user details
				const userId =
					response.user_id ||
					response.id ||
					response.sub ||
					response.userId;
				if (userId) {
					dispatch(
						updateAuthStoreProp([
							{
								key: 'user_id',
								value: userId,
							},
						]),
					);
				}
			} catch (error) {
				if (error.response?.status === 401) {
					setIsAuthenticated(false);
					setUserDetails(null);
				} else {
					logError(error, {
						feature: 'auth',
						action: 'checkAuth',
						extra: {
							errorMessage: error.message,
							status: error.response?.status,
						},
					});
					// toast.error('Failed to check authentication status');
				}
			} finally {
				setIsLoading(false);
			}
		};

		checkAuth();
	}, [skip, location.pathname]); // Re-run if route changes

	return { isAuthenticated, isLoading, userDetails };
};

export default useAuth;
