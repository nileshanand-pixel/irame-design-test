import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDashboardById, shareDashboard } from '../service/dashboard.service';
import { ShareModal } from '@/components/elements/ShareModal';
import { toast } from '@/lib/toast';
import { Globe, Lock } from 'lucide-react';
import { logError } from '@/lib/logger';

export const ShareDashboardDialog = ({ open, onClose, dashboardId }) => {
	const queryClient = useQueryClient();

	const { data: dashboardResponse, isLoading } = useQuery({
		queryKey: ['dashboard', dashboardId],
		queryFn: () => getDashboardById(dashboardId),
		enabled: !!dashboardId && open,
	});

	const dashboard = dashboardResponse?.data || dashboardResponse; // Adapter wrapper check

	const shareMutation = useMutation({
		mutationFn: async ({ dashboardId, accesses }) => {
			await shareDashboard(dashboardId, { recipients: accesses });
		},
		onSuccess: () => {
			toast.success('Dashboard shared successfully');
			queryClient.invalidateQueries(['dashboard', dashboardId]);
			queryClient.invalidateQueries(['my-dashboards']); // Refresh list if needed
		},
		onError: (err) => {
			logError(err, {
				feature: 'dashboard',
				action: 'share-dashboard',
				dashboardId,
			});
			toast.error('Failed to share dashboard');
		},
	});

	const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

	const handleInvite = (inputValue) => {
		const emails = inputValue
			.split(',')
			.map((e) => e.trim())
			.filter((e) => e);
		const validEmails = emails.filter(isValidEmail);

		if (validEmails.length === 0) {
			toast.error('Please enter valid email addresses');
			return;
		}

		const accesses = validEmails.map((email) => ({
			email,
			accessLevel: 'view', // Default to view
		}));

		shareMutation.mutate({ dashboardId, accesses });
	};

	const handleRoleChange = (email, newRole) => {
		// newRole maps to accessLevel
		shareMutation.mutate({
			dashboardId,
			accesses: [{ email, accessLevel: newRole }],
		});
	};

	const members = useMemo(() => {
		if (!dashboard) return [];

		// dashboardData should have createdBy and sharedWith
		// Normalize structure
		const owner = dashboard.createdBy
			? {
					name: dashboard.createdBy.name,
					email: dashboard.createdBy.email,
					role: 'owner',
					isOwner: true,
					avatar: dashboard.createdBy.avatar,
				}
			: null;

		const sharedWith = dashboard.sharedWith || [];
		const sharedMembers = sharedWith.map((s) => ({
			name: s.name || s.email, // fallback
			email: s.email,
			role: s.accessLevel || 'view',
			isOwner: false,
			options: [
				{
					label: 'Can Edit',
					value: 'edit',
					description: 'Edit, comment, and share',
				},
				{
					label: 'Can View',
					value: 'view',
					description: 'Comment & View only',
				},
				{ label: 'Remove', value: 'remove' },
			],
			onRoleChange: (val) => handleRoleChange(s.email, val),
		}));

		return owner ? [owner, ...sharedMembers] : sharedMembers;
	}, [dashboard]);

	const generalAccessConfig = {
		value: 'restricted',
		icon: <Lock className="h-4 w-4 text-gray-500" />,
		options: [
			{
				label: 'Only Invited Users',
				value: 'restricted',
				icon: <Lock className="h-4 w-4" />,
			},
			{
				label: 'Everyone at Irame',
				value: 'everyone',
				icon: <Globe className="h-4 w-4" />,
			},
			{
				label: 'Everyone at Team',
				value: 'everyone',
				icon: <Globe className="h-4 w-4" />,
			},
		],
		onChange: (val) => {},
	};

	return (
		<ShareModal
			open={open}
			onOpenChange={(isOpen) => !isOpen && onClose()}
			config={{
				title: 'Share this dashboard',
				invite: {
					placeholder: 'Search by name or email',
					buttonText: 'Invite',
					onInvite: handleInvite,
				},
				members,
				generalAccess: generalAccessConfig,
				footer: {
					// link: window.location.href, // Or dashboard link construction
					onCopy: () => {
						const link = `${window.location.origin}/app/dashboard/content?id=${dashboardId}`;
						navigator.clipboard.writeText(link);
						toast.success('Link copied');
					},
				},
			}}
		/>
	);
};
