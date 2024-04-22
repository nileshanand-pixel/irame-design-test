import ErrorFallback from '@/components/error/ErrorFallback';
import { ErrorBoundary } from 'react-error-boundary';
import { BrowserRouter as Router } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Toaster } from '@/components/ui/sonner';

function AppProvider({ children }) {
	return (
		<Router>
			<ErrorBoundary FallbackComponent={ErrorFallback}>
				{children}
				<Toaster
					toastOptions={{
						classNames: { toast: 'py-2 px-4 bg-white text-primary100' },
					}}
				/>
			</ErrorBoundary>
		</Router>
	);
}

AppProvider.propTypes = {
	children: PropTypes.node.isRequired,
};

export default AppProvider;
