import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { roleService } from '@/api/gatekeeper/role.service';
import { useRbac } from './useRbac';

export const useMyPermissions = () => {
	const { isRbacActive } = useRbac();
	const userId = useSelector((state) => state.authStoreReducer?.user_id);

	const query = useQuery({
		queryKey: ['my-permissions', userId],
		queryFn: async () => {
			const res = await roleService.getMyRole(userId);
			const rolePermissions = res?.data?.role?.rolePermissions || [];
			const permissions = rolePermissions
				.filter((rp) => rp.permission && rp.status === 'active')
				.map((rp) => rp.permission);
			return permissions;
		},
		enabled: isRbacActive && !!userId,
		staleTime: 5 * 60 * 1000,
		cacheTime: 15 * 60 * 1000,
	});

	return { ...query, data: query.data || [] };
};

/**
 * Filter permissionsByResource to only include permissions the user has.
 * If user has admin_manage for a resource, they get ALL permissions for that resource.
 */
export const filterPermissionsByUserPerms = (
	permissionsByResource,
	myPermissions,
) => {
	if (!permissionsByResource || !myPermissions?.length)
		return permissionsByResource;

	const myPermIds = new Set(myPermissions.map((p) => p.id));
	const adminResources = new Set(
		myPermissions
			.filter((p) => p.action === 'admin_manage')
			.map((p) => p.resource),
	);

	return Object.entries(permissionsByResource).reduce((acc, [resource, perms]) => {
		if (adminResources.has(resource)) {
			acc[resource] = perms;
		} else {
			const kept = perms.filter((p) => myPermIds.has(p.id));
			if (kept.length > 0) acc[resource] = kept;
		}
		return acc;
	}, {});
};
