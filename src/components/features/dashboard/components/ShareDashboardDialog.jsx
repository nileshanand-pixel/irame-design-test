import React, { useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDashboardById, shareDashboard } from '../service/dashboard.service';
import { getDashboardAccessUsers } from '@/api/gatekeeper/dashboardAccess.service';
import { ShareModal } from '@/components/elements/ShareModal';
import { toast } from '@/lib/toast';
import { Globe, Lock } from 'lucide-react';
import { logError } from '@/lib/logger';

/**
 * Single source of truth for access levels
 */
const ACCESS_LEVELS = {
	owner: {
		label: 'Owner',
		description: 'Full Access',
		canChange: false,
	},
	deleter: {
		label: 'Full Access',
		description: 'Edit, comment, and share with others',
		canChange: true,
	},
	editor: {
		label: 'Can Edit',
		description: 'Edit, comment, and share with others',
		canChange: true,
	},
	sharer: {
		label: 'Can Share',
		description: 'Share with others',
		canChange: true,
	},
	viewer: {
		label: 'Can View',
		description: 'Comment & View only',
		canChange: true,
	},
};

/**
 * Access level configuration - Used for display mapping
 */
const ACCESS_LEVEL_CONFIG = Object.entries(ACCESS_LEVELS).reduce(
	(acc, [key, value]) => ({
		...acc,
		[key]: { ...value, value: key },
	}),
	{},
);

/**
 * Access level options for the dropdown (excluding owner and sharer)
 */
const ACCESS_OPTIONS = [
	{ ...ACCESS_LEVELS.deleter, value: 'deleter' },
	{ ...ACCESS_LEVELS.editor, value: 'editor' },
	{ ...ACCESS_LEVELS.viewer, value: 'viewer' },
	{ label: 'Remove', value: 'remove', isDanger: true },
];

export const ShareDashboardDialog = ({ open, onClose, dashboardId }) => {
	const queryClient = useQueryClient();

	// Fetch dashboard basic info (for title, etc.)
	const { data: dashboardResponse, isLoading: isDashboardLoading } = useQuery({
		queryKey: ['dashboard', dashboardId],
		queryFn: () => getDashboardById(dashboardId),
		enabled: !!dashboardId && open,
	});

	const dashboard = dashboardResponse?.data || dashboardResponse;

	// Fetch access users from Permify via Gatekeeper
	const { data: accessData, isLoading: isAccessLoading } = useQuery({
		queryKey: ['dashboard-access-users', dashboardId],
		queryFn: () => getDashboardAccessUsers(dashboardId),
		enabled: !!dashboardId && open,
	});

	const shareMutation = useMutation({
		mutationFn: async ({ dashboardId: targetDashboardId, accesses }) => {
			await shareDashboard(targetDashboardId, { recipients: accesses });
		},
		onSuccess: () => {
			toast.success('Dashboard shared successfully');
			// Invalidate and refetch access users
			queryClient.invalidateQueries(['dashboard-access-users', dashboardId]);
			queryClient.invalidateQueries(['dashboard', dashboardId]);
			queryClient.invalidateQueries(['my-dashboards']);
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

	const handleInvite = useCallback(
		(inputValue) => {
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
				accessLevel: 'viewer', // Default to viewer
			}));

			shareMutation.mutate({ dashboardId, accesses });
		},
		[dashboardId, shareMutation],
	);

	const handleRoleChange = useCallback(
		(userId, email, newRole) => {
			if (newRole === 'remove') {
				// TODO: Implement remove access when API is ready
				toast.info('Remove access feature coming soon');
				return;
			}

			shareMutation.mutate({
				dashboardId,
				accesses: [{ email, accessLevel: newRole }],
			});
		},
		[dashboardId, shareMutation],
	);

	const members = useMemo(() => {
		const membersList = [];

		if (accessData?.owner) {
			const ownerConfig =
				ACCESS_LEVEL_CONFIG[accessData.owner.access_level] ||
				ACCESS_LEVEL_CONFIG.owner;
			membersList.push({
				name: accessData.owner.name,
				email: accessData.owner.email,
				role: ownerConfig.value,
				isOwner: true,
				avatar: null,
			});
		} else if (dashboard?.createdBy) {
			// Fallback to dashboard createdBy if no owner in access data
			membersList.push({
				name: dashboard.createdBy.name,
				email: dashboard.createdBy.email,
				role: 'owner',
				isOwner: true,
				avatar: dashboard.createdBy.avatar,
			});
		}

		// Add shared users from access data
		if (accessData?.shared_users) {
			accessData.shared_users.forEach((user) => {
				const config =
					ACCESS_LEVEL_CONFIG[user.access_level] ||
					ACCESS_LEVEL_CONFIG.viewer;
				membersList.push({
					name: user.name,
					email: user.email,
					role: config.value,
					isOwner: false,
					avatar: null,
					options: ACCESS_OPTIONS,
					onRoleChange: (val) =>
						handleRoleChange(user.user_id, user.email, val),
				});
			});
		}

		return membersList;
	}, [accessData, dashboard, handleRoleChange]);

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
				value: 'team',
				icon: <Globe className="h-4 w-4" />,
			},
		],
		onChange: () => {
			// TODO: Implement general access change
		},
	};

	const isLoading = isDashboardLoading || isAccessLoading;

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
				isLoading,
				generalAccess: generalAccessConfig,
				footer: {
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
