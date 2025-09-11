import { useDatasourceId } from '@/hooks/use-datasource-id';
import { useQuery } from '@tanstack/react-query';
import { getDatasourceById } from '../datasource.service';
import { getDatasourceDetailsQueryKey } from '../datasource.query-key';
import { getDatasourceV2 } from '@/components/features/configuration/service/configuration.service';

export default function useDatasourceDetails({
	queryOptions = {},
	datasourceId,
	version = 'v1',
} = {}) {
	const id = datasourceId || useDatasourceId();

	const queryFn = async (ctx) => {
		if (version === 'v1') {
			return await getDatasourceById({ id });
		}
		return await getDatasourceV2(id);
	};

	const data = useQuery({
		queryKey: getDatasourceDetailsQueryKey(id, version),
		queryFn,
		enabled: !!id,
		...queryOptions,
	});

	return data;
}
