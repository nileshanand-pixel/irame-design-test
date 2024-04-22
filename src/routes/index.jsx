import { Navigate, Route, Routes } from 'react-router-dom';
import SignInSignUp from '@/components/features/login/page';
import NewChat from '@/components/features/new-chat/page';
import Dashboard from '@/components/features/dashboard/page';
import Help from '@/components/features/help/page';
import Layout from '@/components/Layout';
import Configuration from '@/components/features/configuration/page';
import useAuth from '@/hooks/useAuth';

const ProtectedRoute = ({ element, ...rest }) => {
	const { isAuthenticated } = useAuth();
	return isAuthenticated ? (
		<Route {...rest} element={element} />
	) : (
		// <Navigate to="/" replace />
		<Route {...rest} element={element} />
	);
};

const AppRoutes = () => {
	return (
		<Routes>
			<Route exact path="/" element={<SignInSignUp />} />
			<Route
				path="/app/*"
				element={
					<Layout>
						<Routes>
							<Route path="/" element={<Navigate to="new-chat" />} />
							<Route path="new-chat/*" element={<NewChat />} />
							<Route path="dashboard" element={<Dashboard />} />
							<Route
								path="configuration"
								element={<Configuration />}
							/>
							<Route path="help" element={<Help />} />
						</Routes>
					</Layout>
				}
			/>
		</Routes>
	);
};

export default AppRoutes;
