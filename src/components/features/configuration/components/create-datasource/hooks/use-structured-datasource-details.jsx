import { useQuery } from '@tanstack/react-query';
import { getDatasourceV2 } from '@/components/features/configuration/service/configuration.service';
import { useStructuredDatasourceId } from './datasource-context';

/**
 * Hook to get datasource details specifically for structured connector flow
 * This hook automatically uses the datasource ID from the structured datasource context
 */
export const useStructuredDatasourceDetails = (options = {}) => {
	const { datasourceId, isReady } = useStructuredDatasourceId();

	const queryResult = useQuery({
		queryKey: ['structured-datasource-details', datasourceId],
		queryFn: () => getDatasourceV2(datasourceId),
		enabled: !!(datasourceId && isReady),
		...options,
	});

	return {
		...queryResult,
		datasourceId,
		isReady,
	};
};
