import { useMutation, useQueryClient } from '@tanstack/react-query';
import { roleService } from '@/api/gatekeeper/role.service';
import { toast } from 'react-toastify';

/**
 * Hook for deleting a role
 */
export const useRoleDelete = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (roleId) => {
			const response = await roleService.deleteRole(roleId);
			return response;
		},
		onSuccess: () => {
			queryClient.invalidateQueries(['roles']);
			toast.success('Role deleted successfully');
		},
		onError: (error) => {
			const message = error.response?.data?.message || 'Failed to delete role';
			toast.error(message);
		},
	});
};
