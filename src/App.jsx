import { isMobileOnly } from 'react-device-detect';
import AppProvider from './providers/AppProvider';
import AppRoutes from './routes';
import { ThemeProvider } from './providers/ThemeProvider';
import { useEffect } from 'react';
import { initAnalytics } from './lib/mixpanel';

export default function App() {
	useEffect(() => {
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
			<ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
				<AppRoutes />
			</ThemeProvider>
		</AppProvider>
	);
}
