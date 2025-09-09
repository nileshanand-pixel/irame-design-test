import { useSearchParams } from 'react-router-dom';

/**
 * hook to retrieve the 'sessionId' query parameter from the URL.
 *
 * @returns {string | null} The value of the 'sessionId' query parameter, or null if not present.
 */
export const useDatasourceId = () => {
	const [searchParams] = useSearchParams();
	let datasourceId = null;
	for (const [key, value] of searchParams.entries()) {
		if (key.toLowerCase() === 'datasourceid') {
			datasourceId = value;
			break;
		}
	}
	return datasourceId;
};
