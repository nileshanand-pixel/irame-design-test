import { useQuery } from '@tanstack/react-query';
import { userService } from '@/api/gatekeeper/user.service';

export const useUsers = (params) => {
	return useQuery({
		queryKey: ['users', params],
		queryFn: () => userService.getUsers(params),
		keepPreviousData: true,
		staleTime: 30000, // 30 seconds
	});
};
