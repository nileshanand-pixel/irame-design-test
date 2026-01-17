import React, { useMemo, useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
	getDashboardById,
	shareDashboard,
	revokeDashboardAccess,
	updateDashboardVisibility,
} from '../service/dashboard.service';
import { getDashboardAccessUsers } from '@/api/gatekeeper/dashboardAccess.service';
import { userService } from '@/api/gatekeeper/user.service';
import { ShareModal } from '@/components/elements/share-modal';
import { toast } from '@/lib/toast';
import { Globe, Lock } from 'lucide-react';
import { logError } from '@/lib/logger';
import { useDebounce } from '@/hooks/use-debounce';
import { FiUser, FiUsers } from 'react-icons/fi';

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

	// User search and selection state
	const [searchQuery, setSearchQuery] = useState('');
	const debouncedSearch = useDebounce(searchQuery, 300);
	const [selectedUsers, setSelectedUsers] = useState([]);
	const [inviteAccessLevel, setInviteAccessLevel] = useState('viewer');

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

	// Fetch users for search suggestions
	const { data: usersData, isLoading: isSearching } = useQuery({
		queryKey: ['users-search', debouncedSearch],
		queryFn: () =>
			userService.getUsers({
				search: debouncedSearch,
				type: 'active',
				limit: 10,
			}),
		enabled: debouncedSearch.length > 0 && open,
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
			// toast.error('Failed to share dashboard'); // Removed to avoid double toasts
		},
	});

	const revokeMutation = useMutation({
		mutationFn: async ({ dashboardId: targetDashboardId, userId }) => {
			await revokeDashboardAccess(targetDashboardId, userId);
		},
		onSuccess: () => {
			toast.success('Access removed successfully');
			// Invalidate and refetch access users
			queryClient.invalidateQueries(['dashboard-access-users', dashboardId]);
			queryClient.invalidateQueries(['dashboard', dashboardId]);
			queryClient.invalidateQueries(['my-dashboards']);
		},
		onError: (err) => {
			logError(err, {
				feature: 'dashboard',
				action: 'revoke-dashboard-access',
				dashboardId,
			});
			// toast.error('Failed to remove access'); // Removed to avoid double toasts
		},
	});

	const visibilityMutation = useMutation({
		mutationFn: async ({ dashboardId: targetId, visibility }) => {
			await updateDashboardVisibility(targetId, visibility);
		},
		onSuccess: () => {
			toast.success('Visibility updated successfully');
			// Invalidate and refetch access users and dashboard
			queryClient.invalidateQueries(['dashboard-access-users', dashboardId]);
			queryClient.invalidateQueries(['dashboard', dashboardId]);
			queryClient.invalidateQueries(['my-dashboards']);
			queryClient.invalidateQueries(['shared-dashboards']);
		},
		onError: (err) => {
			logError(err, {
				feature: 'dashboard',
				action: 'update-visibility',
				dashboardId,
			});
		},
	});

	const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

	const handleInvite = useCallback(() => {
		if (selectedUsers.length === 0) {
			toast.error('Please select at least one user to invite');
			return;
		}

		if (selectedUsers.length > 3) {
			toast.error('Cannot invite more than 3 users at once');
			return;
		}

		// Defensive: ensure accessLevel is set and include snake_case for API compatibility
		const level = inviteAccessLevel || 'viewer';
		const accesses = selectedUsers.map((user) => ({
			email: user.email,
			access_level: level,
		}));

		shareMutation.mutate({ dashboardId, accesses });
	}, [dashboardId, selectedUsers, inviteAccessLevel, shareMutation]);

	const handleRoleChange = useCallback(
		(userId, email, newRole) => {
			if (newRole === 'remove') {
				revokeMutation.mutate({ dashboardId, userId });
				return;
			}

			// Defensive: include both casing variants
			shareMutation.mutate({
				dashboardId,
				accesses: [{ email, access_level: newRole }],
			});
		},
		[dashboardId, shareMutation, revokeMutation],
	);

	const handleUserSelect = useCallback(
		(user) => {
			if (selectedUsers.length >= 3) {
				toast.error('Maximum 3 users can be invited at once');
				return;
			}

			if (selectedUsers.some((u) => u.userId === user.userId)) {
				return; // Already selected
			}

			setSelectedUsers((prev) => [...prev, user]);
			setSearchQuery(''); // Clear search after selection
		},
		[selectedUsers],
	);

	const handleUserRemove = useCallback((userId) => {
		setSelectedUsers((prev) => prev.filter((u) => u.userId !== userId));
	}, []);

	// Filter suggestions: exclude already selected and existing members
	const suggestions = useMemo(() => {
		if (!usersData?.data) return [];

		const selectedUserIds = new Set(selectedUsers.map((u) => u.userId));
		const existingUserIds = new Set();

		if (accessData?.owner) {
			existingUserIds.add(accessData.owner.user_id);
		}

		if (accessData?.shared_users) {
			accessData.shared_users.forEach((u) => existingUserIds.add(u.user_id));
		}

		return usersData.data.filter(
			(user) =>
				!selectedUserIds.has(user.userId) &&
				!existingUserIds.has(user.userId),
		);
	}, [usersData, selectedUsers, accessData]);

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

	const generalAccessConfig = useMemo(() => {
		const currentVisibility = accessData?.visibility || 'restricted';
		const teamName = accessData?.team_name || 'Team';
		const tenantName = accessData?.tenant_name || 'Organization';

		const icons = {
			restricted: <Lock className="h-4 w-4 text-purple-80" />,
			team: <FiUsers className="h-4 w-4 text-purple-80" />,
			tenant: <Globe className="h-4 w-4 text-purple-80" />,
		};

		return {
			value: currentVisibility,
			icon: icons[currentVisibility] || icons.restricted,
			options: [
				{
					label: 'Only Invited Users',
					value: 'restricted',
					icon: icons.restricted,
					description: 'Only users explicitly invited can access.',
				},
				{
					label: `Everyone at ${teamName}`,
					value: 'team',
					icon: icons.team,
					description: `All members of ${teamName} can view.`,
				},
				{
					label: `Everyone at ${tenantName}`,
					value: 'tenant',
					icon: icons.tenant,
					description: `All users in ${tenantName} can view.`,
				},
			],
			onChange: (newVisibility) => {
				visibilityMutation.mutate({
					dashboardId,
					visibility: newVisibility,
				});
			},
		};
	}, [accessData, dashboardId, visibilityMutation]);

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
					searchQuery,
					onSearchChange: setSearchQuery,
					selectedUsers,
					onUserSelect: handleUserSelect,
					onUserRemove: handleUserRemove,
					suggestions,
					isSearching,
					accessLevel: inviteAccessLevel,
					onAccessLevelChange: setInviteAccessLevel,
					onInvite: handleInvite,
					accessLevelOptions: [
						{ ...ACCESS_LEVELS.viewer, value: 'viewer' },
						{ ...ACCESS_LEVELS.editor, value: 'editor' },
						{ ...ACCESS_LEVELS.deleter, value: 'deleter' },
					],
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
