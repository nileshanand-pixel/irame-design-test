import { isMobileOnly } from 'react-device-detect';
import AppRoutes from './routes';
import { ThemeProvider } from './providers/ThemeProvider';
import { useMemo } from 'react';
import { initAnalytics } from './lib/mixpanel';

export default function App() {
	useMemo(() => {
		initAnalytics();
	}, []);

	if (isMobileOnly) {
		console.log('Not supported');
		return (
			<div className="flex items-center justify-center w-full h-100vh text-6xl">
				Not supported for mobile devices yet
			</div>
		);
	}
	return (
		<ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
			<AppRoutes />
		</ThemeProvider>
	);
}
