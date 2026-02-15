import { useMutation, useQueryClient } from '@tanstack/react-query';
import { roleService } from '@/api/gatekeeper/role.service';
import { toast } from 'react-toastify';

/**
 * Hook for creating a role with permissions
 */
export const useRoleCreate = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ name, description, permissionIds }) => {
			// Step 1: Create role
			const roleResult = await roleService.createRole({ name, description });
			const newRoleId = roleResult.data.id;

			// Step 2: Add permissions if provided
			if (permissionIds && permissionIds.length > 0) {
				await roleService.updateRolePermissions(newRoleId, {
					add: permissionIds,
					remove: [],
				});
			}

			return roleResult;
		},
		onSuccess: () => {
			queryClient.invalidateQueries(['roles']);
			toast.success('Role created successfully');
		},
		onError: (error) => {
			const message = error.response?.data?.message || 'Failed to create role';
			toast.error(message);
		},
	});
};
