import { Navigate } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';

const ProtectedRoute = ({ element }) => {
	const { isAuthenticated, isLoading } = useAuth();

	if (isLoading) {
		// Optionally, return a loading spinner or nothing while the auth check is loading
		return null;
	}

	return isAuthenticated ? element : <Navigate to="/" replace />;
};

export default ProtectedRoute;
