import { useMutation, useQueryClient } from '@tanstack/react-query';
import { roleService } from '@/api/gatekeeper/role.service';
import { toast } from 'react-toastify';

/**
 * Hook for updating role permissions
 */
export const useRolePermissionsUpdate = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ roleId, name, description, add, remove }) => {
			const updates = [];

			// Update name/description if changed
			if (name !== undefined || description !== undefined) {
				const updateData = {};
				if (name !== undefined) updateData.name = name;
				if (description !== undefined) updateData.description = description;
				updates.push(roleService.updateRole(roleId, updateData));
			}

			// Update permissions if changed
			if ((add && add.length > 0) || (remove && remove.length > 0)) {
				updates.push(
					roleService.updateRolePermissions(roleId, {
						add: add || [],
						remove: remove || [],
					}),
				);
			}

			return await Promise.all(updates);
		},
		onSuccess: (data, variables) => {
			queryClient.invalidateQueries({ queryKey: ['roles'] });
			queryClient.invalidateQueries({
				queryKey: ['role-permissions', variables.roleId],
			});
			toast.success('Role updated successfully');
		},
		onError: (error) => {
			const message = error.response?.data?.message || 'Failed to update role';
			toast.error(message);
		},
	});
};
