import PropTypes from 'prop-types';
import { useRouter } from '@/hooks/useRouter';
import { resetAllStores } from '@/redux/GlobalStore';
import { logError } from '@/lib/logger';

const ErrorFallback = ({ error, resetErrorBoundary }) => {
	const { pathname, navigate } = useRouter();
	const IMAGE_SRC = '/assets/bgs/error-boundary-image.png';

	// Log the error to Sentry with context
	logError(error, {
		feature: 'error_boundary',
		action: 'react_error_caught',
		extra: {
			pathname,
			componentStack: error.componentStack,
			errorBoundary: 'global',
		},
	});

	console.log(error.message);

	return (
		<div className="flex items-center justify-center h-screen p-10 gap-4">
			<div className="text-left w-2/5">
				<p className="font-semibold text-[#26064A99] ">Error 500</p>
				<h2 className="text-[44px] font-bold text-[#26064A] my-2">
					Oops! Something went wrong
				</h2>
				<p className="text-xl text-[#26064ACC] mb-4">
					We couldn't find what you were looking for. Let's try again.
				</p>
				<button
					className="px-5 mt-5 py-2 border border-gray-500 text-[#26064ACC] rounded-lg hover:text-white hover:bg-[#26064aca] transition"
					onClick={() => {
						navigate('/', { replace: true });
						resetErrorBoundary();
						resetAllStores();
					}}
				>
					Reset
				</button>
			</div>
			<div className="w-1/3">
				<img
					src={IMAGE_SRC}
					alt="Error 404 Illustration"
					className="w-full"
				/>
			</div>
		</div>
	);
};

ErrorFallback.propTypes = {
	error: PropTypes.object.isRequired,
	resetErrorBoundary: PropTypes.func.isRequired,
};

export default ErrorFallback;
