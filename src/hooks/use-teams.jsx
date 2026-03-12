import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getTeams } from '@/api/gatekeeper/team.service';

export const useTeams = (params) => {
	return useQuery({
		queryKey: ['teams', params],
		queryFn: () => getTeams(params),
		// In TanStack Query v5, keepPreviousData was renamed to placeholderData.
		// Using the old v4 `keepPreviousData: true` is silently ignored in v5 and
		// causes the table to flash empty between page/refetch transitions.
		placeholderData: keepPreviousData,
		staleTime: 60000, // 60 seconds
		refetchOnWindowFocus: false,
	});
};
