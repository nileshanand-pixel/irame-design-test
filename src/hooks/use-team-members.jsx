import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
	getTeamMembersWithRoles,
	getAvailableUsers,
	addTeamMembers,
	removeTeamMember,
	promoteToAdmin,
	demoteFromAdmin,
} from '@/api/gatekeeper/team.service';
import { toast } from 'react-toastify';

export const useTeamMembers = (teamId) => {
	console.log('useTeamMembers hook called with teamId:', teamId);
	return useQuery({
		queryKey: ['team-members', teamId],
		queryFn: async () => {
			console.log('Fetching team members with roles for teamId:', teamId);
			const response = await getTeamMembersWithRoles(teamId);
			return response.data;
		},
		enabled: !!teamId,
		staleTime: 0,
		gcTime: 0,
	});
};

export const useAvailableUsers = (teamId) => {
	return useQuery({
		queryKey: ['available-users', teamId],
		queryFn: async () => {
			const response = await getAvailableUsers(teamId);
			return response.data;
		},
		enabled: !!teamId,
	});
};

export const useAddMembers = (teamId) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (memberIds) => addTeamMembers(teamId, memberIds),
		onSuccess: () => {
			queryClient.invalidateQueries(['team-members', teamId]);
			queryClient.invalidateQueries(['available-users', teamId]);
			toast.success('Members added successfully');
		},
		onError: (error) => {
			toast.error(error?.response?.data?.message || 'Failed to add members');
		},
	});
};

export const useRemoveMember = (teamId) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (userId) => removeTeamMember(teamId, userId),
		onSuccess: () => {
			queryClient.invalidateQueries(['team-members', teamId]);
			queryClient.invalidateQueries(['available-users', teamId]);
			toast.success('Member removed successfully');
		},
		onError: (error) => {
			toast.error(error?.response?.data?.message || 'Failed to remove member');
		},
	});
};

export const usePromoteToAdmin = (teamId) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (userId) => promoteToAdmin(teamId, userId),
		onSuccess: () => {
			queryClient.invalidateQueries(['team-members', teamId]);
			toast.success('User promoted to admin');
		},
		onError: (error) => {
			toast.error(error?.response?.data?.message || 'Failed to promote user');
		},
	});
};

export const useDemoteFromAdmin = (teamId) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (userId) => demoteFromAdmin(teamId, userId),
		onSuccess: () => {
			queryClient.invalidateQueries(['team-members', teamId]);
			toast.success('Admin privileges removed');
		},
		onError: (error) => {
			toast.error(
				error?.response?.data?.message ||
					'Failed to remove admin privileges',
			);
		},
	});
};
