import { useQuery } from '@tanstack/react-query';
import { roleService } from '@/api/gatekeeper/role.service';

export const useRoles = (params) => {
	return useQuery({
		queryKey: ['roles', params],
		queryFn: () => roleService.getRolesWithUserCount(params),
		keepPreviousData: true,
		staleTime: 30000, // 30 seconds
	});
};
