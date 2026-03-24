import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getProcessingStatus } from '@/components/features/configuration/service/configuration.service';

const useProcessingStatus = () => {
	const queryClient = useQueryClient();
	const prevItemsRef = useRef([]);

	const { data, isLoading } = useQuery({
		queryKey: ['datasource-processing-status'],
		queryFn: getProcessingStatus,
		refetchInterval: (query) => {
			const items = query?.state?.data?.items || [];
			return items.length > 0 ? 3000 : false;
		},
		staleTime: 0,
	});

	const items = data?.items || [];

	// Detect transitions: if a previously-processing datasource disappears from the list,
	// it means it completed (active/failed). Invalidate main datasource list.
	useEffect(() => {
		const prevIds = new Set(prevItemsRef.current.map((i) => i.datasource_id));
		const currentIds = new Set(items.map((i) => i.datasource_id));

		if (prevIds.size > 0) {
			const completed = [...prevIds].filter((id) => !currentIds.has(id));
			if (completed.length > 0) {
				queryClient.invalidateQueries({ queryKey: ['data-sources'] });
			}
		}

		prevItemsRef.current = items;
	}, [items, queryClient]);

	// Build a map for easy lookup: datasource_id -> processing counters
	const processingMap = {};
	items.forEach((item) => {
		processingMap[item.datasource_id] = item;
	});

	return {
		processingItems: items,
		processingMap,
		isLoading,
		hasProcessing: items.length > 0,
	};
};

export default useProcessingStatus;
