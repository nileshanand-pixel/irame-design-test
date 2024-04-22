import PropTypes from 'prop-types';

const ErrorFallback = ({ error, resetErrorBoundary }) => {
    return (
        <div>
            <h2>Oops! Something went wrong.</h2>
            <p>{error.message}</p>
            <button onClick={resetErrorBoundary}>Try Again</button>
        </div>
    );
};

ErrorFallback.propTypes = {
    error: PropTypes.object.isRequired,
    resetErrorBoundary: PropTypes.func.isRequired,
};

export default ErrorFallback;