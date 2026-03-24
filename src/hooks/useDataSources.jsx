import { useSelector } from 'react-redux';
import { getDataSourcesV2 } from '@/components/features/configuration/service/configuration.service';
import useInfiniteScroll from '@/hooks/useInfiniteScroll';

export const useDataSources = (options = {}, teamId) => {
	const auth = useSelector((state) => state.authStoreReducer);
	const selectedTeamId = teamId || auth?.selectedTeamId;

	const { limit = 100, search, ...queryOptions } = options;

	const {
		data,
		isLoading,
		error,
		Sentinel,
		isFetchingNextPage,
		hasNextPage,
		fetchNextPage,
	} = useInfiniteScroll({
		queryKey: ['data-sources', selectedTeamId || 'initial', search],
		queryFn: (params) => getDataSourcesV2({ limit, search, ...params }),
		paginationType: 'cursor',
		options: {
			limit,
			staleTime: 1000 * 60,
			...queryOptions,
		},
	});

	return {
		dataSources: data || [],
		isLoading,
		error,
		Sentinel,
		isFetchingNextPage,
		hasNextPage,
		fetchNextPage,
	};
};
