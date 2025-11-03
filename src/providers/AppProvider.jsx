import React from 'react';
import ErrorFallback from '@/components/error/ErrorFallback';
import { ErrorBoundary } from 'react-error-boundary';
import { BrowserRouter as Router } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import reduxStore from '@/redux/GlobalStore';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ToastContainer } from '@/lib/toast';
import { logError } from '@/lib/logger';

function AppProvider({ children }) {
	const handleError = (error, errorInfo) => {
		// Log error boundary catches to Sentry
		logError(error, {
			feature: 'app_provider',
			action: 'error_boundary_triggered',
			extra: {
				componentStack: errorInfo.componentStack,
				errorBoundary: 'app_provider',
			},
		});
	};

	return (
		<QueryClientProvider client={queryClient}>
			<Provider store={reduxStore}>
				<Router>
					<ErrorBoundary
						FallbackComponent={ErrorFallback}
						onError={handleError}
					>
						{children}
						<ToastContainer />
					</ErrorBoundary>
				</Router>
			</Provider>
			{/* <ReactQueryDevtools buttonPosition="bottom-left" initialIsOpen={false} /> */}
		</QueryClientProvider>
	);
}

AppProvider.propTypes = {
	children: PropTypes.node.isRequired,
};

export default AppProvider;
