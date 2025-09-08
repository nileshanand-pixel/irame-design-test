import { useDatasourceId } from '@/hooks/use-datasource-id';
import { useQuery } from '@tanstack/react-query';
import { getDatasourceById } from '../datasource.service';
import { getDatasourceDetailsQueryKey } from '../datasource.query-key';

export default function useDatasourceDetails({
	queryOptions = {},
	datasourceId,
} = {}) {
	const id = useDatasourceId() || datasourceId;

	const data = useQuery({
		queryKey: getDatasourceDetailsQueryKey(id),
		queryFn: getDatasourceById,
		enabled: !!id,
		...queryOptions,
	});

	return data;
}
