import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useEffect, useRef } from 'react';
import { getDataSourcesV2 } from '@/components/features/configuration/service/configuration.service';

/**
 * Custom hook to fetch datasources with proper team-based caching
 *
 * This hook ensures that when team changes:
 * 1. The query key changes (includes selectedTeamId)
 * 2. React Query re-fetches data (invalidates old cache)
 * 3. UI updates with new team's datasources
 *
 * @param {Object} options - React Query options
 * @param {string} [teamId] - Optional teamId from parent (preferred to avoid Redux circular deps)
 * @returns {Object} { dataSources, isLoading, error, refetch }
 */
export const useDataSources = (options = {}, teamId) => {
	// Get teamId from parent if provided, otherwise from Redux
	const auth = useSelector((state) => state.authStoreReducer);
	const selectedTeamId = teamId || auth?.selectedTeamId;

	// Track previous teamId to detect actual changes
	const prevTeamIdRef = useRef(null);

	// Only refetch when teamId actually changes (not on every Redux update)
	const shouldRefetch = prevTeamIdRef.current !== selectedTeamId;
	prevTeamIdRef.current = selectedTeamId;

	const { data, isLoading, error, refetch } = useQuery({
		queryKey: ['data-sources', selectedTeamId || 'initial'],
		queryFn: async () => {
			const response = await getDataSourcesV2();
			return Array.isArray(response) ? response : [];
		},
		enabled: !options.enabled || shouldRefetch, // Only refetch when team changes or enabled
		staleTime: 1000 * 60, // Cache for 1 minute by default
		...options,
	});

	// Return dataSources for backward compatibility
	return { dataSources: data || [], isLoading, error, refetch };
};
