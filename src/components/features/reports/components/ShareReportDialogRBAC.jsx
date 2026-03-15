import React, { useMemo, useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector, useDispatch } from 'react-redux';
import {
	shareReportV3,
	revokeReportAccess,
	updateReportVisibility,
} from '../service/reports.service';
import { getReportAccessUsers } from '@/api/gatekeeper/reportAccess.service';
import { userService } from '@/api/gatekeeper/user.service';
import { ShareModal } from '@/components/elements/share-modal';
import { toast } from '@/lib/toast';
import { Globe, Lock } from 'lucide-react';
import { logError } from '@/lib/logger';
import { useDebounce } from '@/hooks/use-debounce';
import { useMyPermissions } from '@/hooks/use-my-permissions';
import { FiUser, FiUsers } from 'react-icons/fi';
import { closeModal } from '@/redux/reducer/modalReducer';
import { updateReportStoreProp } from '@/redux/reducer/reportReducer';
import { useReportId } from '../hooks/useReportId';

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
		description: 'Edit and comment',
		canChange: true,
	},
	sharer: {
		label: 'Can Share',
		description: 'Share with others',
		canChange: true,
	},
	viewer: {
		label: 'Can View',
		description: 'View only',
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

const ShareReportDialogRBAC = React.memo(() => {
	const dispatch = useDispatch();
	const queryClient = useQueryClient();
	const modalState = useSelector((state) => state.modalReducer);
	const reportReducer = useSelector((state) => state.reportStoreReducer);

	const { data: myPermissions } = useMyPermissions();
	const canShare = myPermissions?.some(
		(p) =>
			p.resource === 'report' &&
			['share', 'delete', 'admin_manage'].includes(p.action),
	);

	// User search and selection state
	const [searchQuery, setSearchQuery] = useState('');
	const debouncedSearch = useDebounce(searchQuery, 300);
	const [selectedUsers, setSelectedUsers] = useState([]);
	const [inviteAccessLevel, setInviteAccessLevel] = useState('viewer');

	const reportIdFromRoute = useReportId();
	const selectedReport = reportReducer?.selectedReport;
	const reportId = reportIdFromRoute || selectedReport?.report_id;

	const handleClose = useCallback(() => {
		dispatch(closeModal('shareReport'));
		dispatch(updateReportStoreProp([{ key: 'selectedReport', value: null }]));
		setSelectedUsers([]);
		setSearchQuery('');
	}, [dispatch]);

	// Fetch access users from Permify via Gatekeeper
	const { data: accessData, isLoading: isAccessLoading } = useQuery({
		queryKey: ['report-access-users', reportId],
		queryFn: () => getReportAccessUsers(reportId),
		enabled: !!reportId && !!modalState.shareReport,
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
		enabled: debouncedSearch.length > 0 && !!modalState.shareReport,
	});

	const shareMutation = useMutation({
		mutationFn: async ({ reportId: targetReportId, accesses }) => {
			await shareReportV3(targetReportId, { recipients: accesses });
		},
		onSuccess: () => {
			toast.success('Report shared successfully');
			// Invalidate and refetch access users
			queryClient.invalidateQueries({
				queryKey: ['report-access-users', reportId],
			});
			queryClient.invalidateQueries({ queryKey: ['unified-reports'] });
			setSelectedUsers([]);
		},
		onError: (err) => {
			const raw = err?.response?.data?.message || '';
			const LABELS = {
				deleter: 'Full Access',
				editor: 'Can Edit',
				viewer: 'Can View',
				sharer: 'Can Share',
			};
			const maxMatch = raw.match(
				/Maximum available access level for this user is '(\w+)'/,
			);
			const requestedMatch = raw.match(/access level '(\w+)'/);

			let message;
			if (raw.includes('role capability') && maxMatch) {
				const maxLabel = LABELS[maxMatch[1]] || maxMatch[1];
				const requestedLabel =
					LABELS[requestedMatch?.[1]] || requestedMatch?.[1] || '';
				message = `Cannot share with '${requestedLabel}'. This user's role supports up to '${maxLabel}'. Try selecting a lower access level.`;
			} else if (raw.includes('role capability')) {
				message =
					"Cannot share — this user's role does not include any report permissions. Contact an admin to update their role.";
			} else {
				message = raw || 'Failed to share report';
			}

			toast.error(message);
			logError(err, {
				feature: 'report',
				action: 'share-report',
				reportId,
			});
		},
	});

	const revokeMutation = useMutation({
		mutationFn: async ({ reportId: targetReportId, userId }) => {
			await revokeReportAccess(targetReportId, userId);
		},
		onSuccess: () => {
			toast.success('Access removed successfully');
			// Invalidate and refetch access users
			queryClient.invalidateQueries({
				queryKey: ['report-access-users', reportId],
			});
			queryClient.invalidateQueries({ queryKey: ['unified-reports'] });
		},
		onError: (err) => {
			logError(err, {
				feature: 'report',
				action: 'revoke-report-access',
				reportId,
			});
		},
	});

	const visibilityMutation = useMutation({
		mutationFn: async ({ reportId: targetId, visibility }) => {
			await updateReportVisibility(targetId, visibility);
		},
		onSuccess: () => {
			toast.success('Visibility updated successfully');
			// Invalidate and refetch access users
			queryClient.invalidateQueries({
				queryKey: ['report-access-users', reportId],
			});
			queryClient.invalidateQueries({ queryKey: ['unified-reports'] });
		},
		onError: (err) => {
			logError(err, {
				feature: 'report',
				action: 'update-visibility',
				reportId,
			});
		},
	});

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

		shareMutation.mutate({ reportId, accesses });
	}, [reportId, selectedUsers, inviteAccessLevel, shareMutation]);

	const handleRoleChange = useCallback(
		(userId, email, newRole) => {
			if (newRole === 'remove') {
				revokeMutation.mutate({ reportId, userId });
				return;
			}

			// Defensive: include both casing variants
			shareMutation.mutate({
				reportId,
				accesses: [{ email, access_level: newRole }],
			});
		},
		[reportId, shareMutation, revokeMutation],
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
		} else if (selectedReport?.created_by) {
			// Fallback to report created_by if no owner in access data
			membersList.push({
				name: selectedReport.created_by.name,
				email: selectedReport.created_by.email,
				role: 'owner',
				isOwner: true,
				avatar: null,
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
	}, [accessData, selectedReport, handleRoleChange]);

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
			disabled: !canShare,
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
					reportId,
					visibility: newVisibility,
				});
			},
		};
	}, [accessData, reportId, visibilityMutation, canShare]);

	const isLoading = isAccessLoading;

	return (
		<ShareModal
			open={!!modalState.shareReport}
			onOpenChange={(isOpen) => !isOpen && handleClose()}
			config={{
				title: 'Share this report',
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
					isLoading: shareMutation.isPending,
					accessLevelOptions: [
						{ ...ACCESS_LEVELS.viewer, value: 'viewer' },
						{ ...ACCESS_LEVELS.editor, value: 'editor' },
						{ ...ACCESS_LEVELS.deleter, value: 'deleter' },
					],
				},
				members,
				isLoading,
				generalAccess: generalAccessConfig,
				footer: {},
			}}
		/>
	);
});

export default ShareReportDialogRBAC;
