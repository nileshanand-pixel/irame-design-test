import { useQuery } from '@tanstack/react-query';
import { getTeams } from '@/api/gatekeeper/team.service';

export const useTeams = (params) => {
	return useQuery({
		queryKey: ['teams', params],
		queryFn: () => getTeams(params),
		keepPreviousData: true,
		staleTime: 30000, // 30 seconds
	});
};
