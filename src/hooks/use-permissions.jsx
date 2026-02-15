import { useQuery } from '@tanstack/react-query';
import { permissionService } from '@/api/gatekeeper/permission.service';

/**
 * Hook to fetch permissions grouped by resource
 * @returns {Object} React Query result with permissions data
 */
export const usePermissions = () => {
	return useQuery({
		queryKey: ['permissions-by-resource'],
		queryFn: () => permissionService.getPermissionsByResource(),
		staleTime: 10 * 60 * 1000, // 10 minutes - permissions rarely change
		cacheTime: 30 * 60 * 1000, // 30 minutes
	});
};
