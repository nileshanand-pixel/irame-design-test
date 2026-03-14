import { useQuery } from '@tanstack/react-query';
import { permissionService } from '@/api/gatekeeper/permission.service';

const HIDDEN_PERMISSIONS = {
	approval: '*',
	team: ['delete'],
	business_process: ['edit', 'delete', 'clone'],
	workflow: ['edit', 'delete'],
};

const filterHiddenPermissions = (response) => {
	if (!response?.data) return response;

	const filtered = Object.entries(response.data).reduce(
		(acc, [resource, perms]) => {
			const rule = HIDDEN_PERMISSIONS[resource];
			if (rule === '*') return acc;

			if (Array.isArray(rule)) {
				const kept = perms.filter((p) => !rule.includes(p.action));
				if (kept.length > 0) acc[resource] = kept;
			} else {
				acc[resource] = perms;
			}
			return acc;
		},
		{},
	);

	return { ...response, data: filtered };
};

/**
 * Hook to fetch permissions grouped by resource
 * @returns {Object} React Query result with permissions data
 */
export const usePermissions = () => {
	return useQuery({
		queryKey: ['permissions-by-resource'],
		queryFn: () => permissionService.getPermissionsByResource(),
		select: filterHiddenPermissions,
		staleTime: 10 * 60 * 1000, // 10 minutes - permissions rarely change
		cacheTime: 30 * 60 * 1000, // 30 minutes
	});
};
