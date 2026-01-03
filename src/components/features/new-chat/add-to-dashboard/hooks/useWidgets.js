import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryById } from '../../../new-chat/service/new-chat.service';
import { transformQueryDataToWidgets } from '../utils/widget-transformer';
import { QUERY_KEYS } from '../constants';

/**
 * Custom hook for fetching and transforming query widgets
 *
 * @param {Object} options - Hook options
 * @param {boolean} options.enabled - Whether query should be enabled
 * @param {string} options.queryId - Query ID to fetch
 * @returns {Object} Widgets data and loading state
 */
export const useWidgets = ({ enabled = true, queryId = null } = {}) => {
	const queryDataQuery = useQuery({
		queryKey: QUERY_KEYS.QUERY_DATA(queryId),
		queryFn: () => getQueryById(queryId),
		enabled: enabled && !!queryId,
	});

	const widgets = useMemo(() => {
		return transformQueryDataToWidgets(queryDataQuery.data);
	}, [queryDataQuery.data]);

	return {
		widgets,
		isLoading: queryDataQuery.isLoading,
		isError: queryDataQuery.isError,
		error: queryDataQuery.error,
		queryData: queryDataQuery.data,
	};
};
