import React from 'react';
import ErrorFallback from '@/components/error/ErrorFallback';
import { ErrorBoundary } from 'react-error-boundary';
import { BrowserRouter as Router } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Toaster } from '@/components/ui/sonner';
import { Provider } from 'react-redux';
import reduxStore from '@/redux/GlobalStore';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function AppProvider({ children }) {
	return (
		<QueryClientProvider client={queryClient}>
			<Provider store={reduxStore}>
				<Router>
					<ErrorBoundary FallbackComponent={ErrorFallback}>
						{children}
						<Toaster
							toastOptions={{
								classNames: {
									toast: 'py-2 px-4 bg-white text-primary100',
								},
							}}
							position = {"bottom-left"}
						/>
					</ErrorBoundary>
				</Router>
			</Provider>
			<ReactQueryDevtools initialIsOpen={false} />
		</QueryClientProvider>
	);
}

AppProvider.propTypes = {
	children: PropTypes.node.isRequired,
};

export default AppProvider;
