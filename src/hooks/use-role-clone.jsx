import { useMutation, useQueryClient } from '@tanstack/react-query';
import { roleService } from '@/api/gatekeeper/role.service';
import { toast } from 'react-toastify';

/**
 * Hook for cloning a role
 */
export const useRoleClone = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ roleId, name, description }) => {
			return await roleService.cloneRole(roleId, { name, description });
		},
		onSuccess: () => {
			queryClient.invalidateQueries(['roles']);
			toast.success('Role cloned successfully');
		},
		onError: (error) => {
			const message = error.response?.data?.message || 'Failed to clone role';
			toast.error(message);
		},
	});
};
