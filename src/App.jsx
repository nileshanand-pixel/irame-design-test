import { isMobileOnly } from 'react-device-detect';
import AppProvider from './providers/AppProvider';
import AppRoutes from './routes';
import { ThemeProvider } from './providers/ThemeProvider';
import { useMemo } from 'react';
import { initAnalytics } from './lib/mixpanel';
import useAuth from './hooks/useAuth';
import UserSessionManager from './components/features/user-session-manager';

export default function App() {
	const { isAuthenticated, isLoading } = useAuth();

	useMemo(() => {
		initAnalytics();
	}, []);

	if (isMobileOnly) {
		console.log('Not supported');
		return (
			<div className="flex items-center justify-center w-full h-100vh">
				Not supported for mobile devices yet
			</div>
		);
	}
	return (
		<AppProvider>
			{!isLoading && isAuthenticated && <UserSessionManager />}
			<ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
				<AppRoutes />
			</ThemeProvider>
		</AppProvider>
	);
}
