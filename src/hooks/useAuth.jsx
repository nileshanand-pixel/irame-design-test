import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authUserDetails } from '@/components/features/login/service/auth.service';
import { logError } from '@/lib/logger';
import { useDispatch } from 'react-redux';
import { syncAuthIdentity } from '@/redux/reducer/authReducer';

const useAuth = ({ skip = false } = {}) => {
	const dispatch = useDispatch();

	const {
		data: userDetails,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['user-details'],
		queryFn: authUserDetails,
		enabled: !skip,
		staleTime: 5 * 60 * 1000, // 5 min
		refetchInterval: 45000, // 45s — role changes need to reflect (notifications moved to separate API)
	});

	const isAuthenticated = !!userDetails && !error;

	useEffect(() => {
		if (userDetails) {
			dispatch(syncAuthIdentity(userDetails));
		}
	}, [userDetails, dispatch]);

	useEffect(() => {
		if (error) {
			logError(error, {
				feature: 'auth',
				action: 'checkAuth',
				extra: {
					errorMessage: error.message,
					status: error.response?.status,
				},
			});
		}
	}, [error]);

	return { isAuthenticated, isLoading, userDetails, error };
};

export default useAuth;
