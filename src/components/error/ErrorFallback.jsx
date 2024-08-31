import PropTypes from 'prop-types';
import { Button } from '../ui/button';
import { useRouter } from '@/hooks/useRouter';
import { resetAllStores } from '@/redux/GlobalStore';

const ErrorFallback = ({ error, resetErrorBoundary }) => {
    const { pathname, navigate } = useRouter();
	return (
		<div className='flex justify-center items-center h-screen flex-col gap-4'>
			<h2>Oops! Something went wrong.</h2>
			<Button
				className="rounded-lg hover:bg-purple-100 hover:text-white hover:opacity-80"
				onClick={() => {
                    navigate('/app/new-chat', {replace: true})
                    resetErrorBoundary();
                    resetAllStores();
				}}
			>
				Reset
			</Button>
		</div>
	);
};

ErrorFallback.propTypes = {
	error: PropTypes.object.isRequired,
	resetErrorBoundary: PropTypes.func.isRequired,
};

export default ErrorFallback;