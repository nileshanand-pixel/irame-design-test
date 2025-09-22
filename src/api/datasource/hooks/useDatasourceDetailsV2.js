import { useDatasourceId } from '@/hooks/use-datasource-id';
import { useQuery } from '@tanstack/react-query';
import { getDatasourceByIdV2 } from '../datasource.service';
import { getDatasourceDetailsQueryKey } from '../datasource.query-key';

export default function useDatasourceDetailsV2({
	queryOptions = {},
	datasourceId,
} = {}) {
	const id = datasourceId || useDatasourceId();

	const data = useQuery({
		queryKey: getDatasourceDetailsQueryKey(id),
		queryFn: getDatasourceByIdV2,
		enabled: !!id,
		...queryOptions,
	});

	return data;
}
