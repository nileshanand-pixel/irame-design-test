import { useSearchParams } from 'react-router-dom';

/**
 * hook to retrieve the 'datasourceId' or 'datasource_id' query parameter from the URL.
 *
 * @returns {string | null} The value of the 'datasourceId' query parameter, or null if not present.
 */
export const useDatasourceId = () => {
	const [searchParams] = useSearchParams();
	let datasourceId = null;
	for (const [key, value] of searchParams.entries()) {
		if (
			key.toLowerCase() === 'datasourceid' ||
			key.toLowerCase() === 'datasource_id'
		) {
			datasourceId = value;
			break;
		}
	}
	console.log(datasourceId);
	return datasourceId;
};
