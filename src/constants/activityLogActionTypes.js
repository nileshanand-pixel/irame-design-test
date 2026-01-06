/**
 * Activity Log Action Types
 * Human-readable labels for activity log action types
 */

export const ACTION_TYPE_OPTIONS = [
	{ label: 'All Actions', value: 'all' },
	// Team actions - using underscore notation to match database
	{ label: 'Team Created', value: 'team_created' },
	{ label: 'Team Updated', value: 'team_updated' },
	{ label: 'Team Deleted', value: 'team_deleted' },
	{ label: 'Member Added to Team', value: 'team_member_added' },
	{ label: 'Member Removed from Team', value: 'team_member_removed' },
	{ label: 'Admin Promoted', value: 'team_admin_promoted' },
	{ label: 'Admin Demoted', value: 'team_admin_demoted' },
	// User actions - using dot notation as stored in database
	{ label: 'User Created', value: 'user.created' },
	{ label: 'User Updated', value: 'user.updated' },
	{ label: 'User Deleted', value: 'user.deleted' },
	{ label: 'User Invited', value: 'user.invited' },
	{ label: 'User Added Directly', value: 'user.added_directly' },
	{ label: 'User Suspended', value: 'user.suspended' },
	{ label: 'User Disabled', value: 'user.disabled' },
	{ label: 'User Enabled', value: 'user.enabled' },
	{ label: 'User Reactivated', value: 'user.reactivated' },
	// Invitation actions - using dot notation as stored in database
	{ label: 'Invitation Created', value: 'invitation.created' },
	{ label: 'Invitation Accepted', value: 'invitation.accepted' },
	{ label: 'Invitation Declined', value: 'invitation.declined' },
	{ label: 'Invitation Rejected', value: 'invitation.rejected' },
	{ label: 'Invitation Revoked', value: 'invitation.revoked' },
	{ label: 'Invitation Cancelled', value: 'invitation.cancelled' },
	{ label: 'Invitation Expired', value: 'invitation.expired' },
	// Role actions - using underscore notation to match database
	{ label: 'Role Created', value: 'role_created' },
	{ label: 'Role Updated', value: 'role_updated' },
	{ label: 'Role Deleted', value: 'role_deleted' },
	{ label: 'Role Cloned', value: 'role_cloned' },
	{ label: 'Role Status Updated', value: 'role_status_updated' },
	{ label: 'Role Permissions Updated', value: 'role_permissions_updated' },
	{ label: 'Role Assigned', value: 'role_assigned' },
	// Role-user relationship actions - using dot notation as stored in database
	{ label: 'Assign Role to User', value: 'role.assigned_to_user' },
	{ label: 'Remove Role from User', value: 'role.removed_from_user' },
	{ label: 'Change Role for User', value: 'role.changed_for_user' },
	// Permission actions
	{ label: 'Permission Created', value: 'permission.created' },
	{ label: 'Permission Updated', value: 'permission.updated' },
	{ label: 'Permission Deleted', value: 'permission.deleted' },
	{ label: 'Permissions Updated for Role', value: 'permission.updated_for_role' },
	// Tenant actions
	{ label: 'Tenant Onboarded', value: 'tenant.onboarded' },
	// Approval actions
	{ label: 'Approval Request Created', value: 'approval_request_created' },
	{ label: 'Approval Request Approved', value: 'approval_request_approved' },
	{ label: 'Approval Request Rejected', value: 'approval_request_rejected' },
	{ label: 'Approval Request Cancelled', value: 'approval_request_cancelled' },
	// Security actions
	{ label: 'Access Denied', value: 'security.access_denied' },
	{ label: 'Unauthorized Access', value: 'security.unauthorized_access' },
];

export const CATEGORY_OPTIONS = [
	{ label: 'All Categories', value: 'all' },
	{ label: 'Team', value: 'team' },
	{ label: 'Membership', value: 'membership' },
	{ label: 'User', value: 'user' },
	{ label: 'Role', value: 'role' },
	{ label: 'Permission', value: 'permission' },
	{ label: 'Invitation', value: 'invitation' },
	{ label: 'Tenant', value: 'tenant' },
	{ label: 'Approval', value: 'approval' },
	{ label: 'Security', value: 'security' },
	{ label: 'System', value: 'system' },
];

/**
 * Get action type options filtered by category
 * @param {string} category - Selected category (or 'all')
 * @returns {Array} Filtered action type options
 */
export const getActionTypesByCategory = (category) => {
	if (!category || category === 'all') {
		return ACTION_TYPE_OPTIONS;
	}

	// Category to action type prefix mapping
	const categoryPrefixMap = {
		team: ['team_', 'team.'],
		membership: ['membership.', 'team_member_'],
		user: ['user.'],
		role: ['role_', 'role.'],
		permission: ['permission.'],
		invitation: ['invitation.'],
		tenant: ['tenant.'],
		approval: ['approval_request_'],
		security: ['security.'],
		system: [], // System category typically doesn't have specific actions
	};

	const prefixes = categoryPrefixMap[category] || [];

	if (prefixes.length === 0) {
		return [{ label: 'All Actions', value: 'all' }];
	}

	const filtered = ACTION_TYPE_OPTIONS.filter((option) => {
		if (option.value === 'all') return true;
		return prefixes.some((prefix) => option.value.startsWith(prefix));
	});

	return filtered.length > 1 ? filtered : [{ label: 'All Actions', value: 'all' }];
};

/**
 * Format action type to human-readable text
 * @param {string} actionType - The action type key
 * @returns {string} Human-readable action label
 */
export const formatActionType = (actionType) => {
	if (!actionType) return '';

	const option = ACTION_TYPE_OPTIONS.find((opt) => opt.value === actionType);
	if (option) {
		return option.label;
	}

	// Fallback: convert snake_case to Title Case
	return actionType.replace(/[._]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

/**
 * Generate human-readable description from log details
 * @param {Object} log - The activity log object
 * @returns {string} Human-readable description
 */
export const generateDescription = (log) => {
	const details = log.details || log.action_metadata || {};
	const actorName = log.actor_name || 'User';
	const targetName = log.target_name || details.targetName;

	// Role-related actions
	if (log.action_type?.includes('role')) {
		const roleName =
			details.roleName ||
			log.after_state?.name ||
			log.after_state?.roleName ||
			'Unknown Role';
		const userName = targetName || details.userName || 'user';

		if (
			log.action_type === 'role.assigned_to_user' ||
			log.action_type === 'role.assigned'
		) {
			return `Assigned role "${roleName}" to ${userName}`;
		}
		if (
			log.action_type === 'role.removed_from_user' ||
			log.action_type === 'role.removed'
		) {
			return `Removed role "${roleName}" from ${userName}`;
		}
		if (log.action_type === 'role.changed_for_user') {
			const oldRole =
				log.before_state?.name ||
				log.before_state?.roleName ||
				'previous role';
			return `Changed role from "${oldRole}" to "${roleName}" for ${userName}`;
		}
		if (
			log.action_type === 'role_permissions_updated' ||
			log.action_type === 'role.permissions_updated'
		) {
			return `Updated permissions for role "${roleName}"`;
		}
		if (
			log.action_type === 'role_created' ||
			log.action_type === 'role.created'
		) {
			return `Created role "${roleName}"`;
		}
		if (
			log.action_type === 'role_updated' ||
			log.action_type === 'role.updated'
		) {
			return `Updated role "${roleName}"`;
		}
		if (
			log.action_type === 'role_deleted' ||
			log.action_type === 'role.deleted'
		) {
			const deletedRole =
				log.before_state?.name || log.before_state?.roleName || roleName;
			return `Deleted role "${deletedRole}"`;
		}
		if (log.action_type === 'role_cloned' || log.action_type === 'role.cloned') {
			const sourceRole = log.before_state?.name || 'existing role';
			return `Cloned role from "${sourceRole}" to "${roleName}"`;
		}
		if (
			log.action_type === 'role_assigned' ||
			log.action_type === 'role.assigned'
		) {
			return `Assigned role "${roleName}" to ${userName}`;
		}
		if (
			log.action_type === 'role_status_updated' ||
			log.action_type === 'role.status_updated'
		) {
			return `Updated status for role "${roleName}"`;
		}
	}

	// Team membership actions
	if (
		log.action_type?.includes('team') ||
		log.category === 'team' ||
		log.category === 'membership'
	) {
		const teamName =
			details.teamName || log.target_name || log.after_state?.name || 'team';
		const userName =
			details.addedUserName ||
			details.removedUserName ||
			details.userName ||
			targetName ||
			'user';

		if (
			log.action_type === 'team_member_added' ||
			log.action_type === 'team.member_added' ||
			log.action_type === 'membership.added_to_team'
		) {
			return `${userName} added to team "${teamName}"`;
		}
		if (
			log.action_type === 'team_member_removed' ||
			log.action_type === 'team.member_removed' ||
			log.action_type === 'membership.removed_from_team'
		) {
			return `${userName} removed from team "${teamName}"`;
		}
		if (
			log.action_type === 'team_created' ||
			log.action_type === 'team.created'
		) {
			return `Created team "${teamName}"`;
		}
		if (
			log.action_type === 'team_updated' ||
			log.action_type === 'team.updated'
		) {
			return `Updated team "${teamName}"`;
		}
		if (
			log.action_type === 'team_deleted' ||
			log.action_type === 'team.deleted'
		) {
			const deletedTeam = log.before_state?.name || teamName;
			return `Deleted team "${deletedTeam}"`;
		}
		if (
			log.action_type === 'team_admin_promoted' ||
			log.action_type === 'team.admin_promoted'
		) {
			return `${userName} promoted to admin in team "${teamName}"`;
		}
		if (
			log.action_type === 'team_admin_demoted' ||
			log.action_type === 'team.admin_demoted'
		) {
			return `${userName} demoted from admin in team "${teamName}"`;
		}
	}

	// Invitation actions
	if (log.category === 'invitation' || log.action_type?.includes('invitation')) {
		const email =
			details.email || targetName || details.recipientEmail || 'recipient';
		const roleName = details.roleName || details.role || '';

		if (log.action_type === 'invitation.created') {
			return roleName
				? `Invitation sent to ${email} for role "${roleName}"`
				: `Invitation sent to ${email}`;
		}
		if (log.action_type === 'invitation.accepted') {
			return `Invitation accepted by ${email}`;
		}
		if (log.action_type === 'invitation.revoked') {
			return `Invitation revoked for ${email}`;
		}
		if (log.action_type === 'invitation.expired') {
			return `Invitation expired for ${email}`;
		}
		if (
			log.action_type === 'invitation.declined' ||
			log.action_type === 'invitation.rejected'
		) {
			return `Invitation declined by ${email}`;
		}
	}

	// User actions
	if (log.category === 'user' || log.action_type?.includes('user.')) {
		const userName =
			targetName ||
			details.name ||
			details.userName ||
			details.email ||
			'user';

		if (log.action_type === 'user.created') {
			return `Created user "${userName}"`;
		}
		if (log.action_type === 'user.updated') {
			return `Updated user "${userName}"`;
		}
		if (log.action_type === 'user.invited') {
			return `Sent invitation to ${details.email || userName}`;
		}
		if (log.action_type === 'user.deleted') {
			return `Deleted user "${userName}"`;
		}
		if (log.action_type === 'user.suspended') {
			return `Suspended user "${userName}"`;
		}
		if (
			log.action_type === 'user.enabled' ||
			log.action_type === 'user.reactivated'
		) {
			return `Enabled user "${userName}"`;
		}
		if (log.action_type === 'user.disabled') {
			return `Disabled user "${userName}"`;
		}
	}

	// Permission actions
	if (log.category === 'permission' || log.action_type?.includes('permission')) {
		const permissionName =
			details.permissionName || details.permission || 'permission';
		const action =
			log.action_type?.replace('permission.', '').replace(/_/g, ' ') ||
			'modified';

		if (log.action_type === 'permission.created') {
			return `Created permission "${permissionName}"`;
		}
		if (
			log.action_type === 'permission.updated' ||
			log.action_type === 'permission.updated_for_role'
		) {
			const roleName = details.roleName || '';
			return roleName
				? `Updated permission "${permissionName}" for role "${roleName}"`
				: `Updated permission "${permissionName}"`;
		}
		if (log.action_type === 'permission.deleted') {
			return `Deleted permission "${permissionName}"`;
		}
	}

	// Approval actions
	if (log.category === 'approval' || log.action_type?.includes('approval')) {
		const requestType = details.requestType || details.type || 'access';

		if (log.action_type === 'approval_request_created') {
			return `Created ${requestType} approval request`;
		}
		if (log.action_type === 'approval_request_approved') {
			return `Approved ${requestType} request`;
		}
		if (log.action_type === 'approval_request_rejected') {
			return `Rejected ${requestType} request`;
		}
		if (log.action_type === 'approval_request_cancelled') {
			return `Cancelled ${requestType} request`;
		}
	}

	// Tenant actions
	if (log.category === 'tenant' || log.action_type?.includes('tenant')) {
		const tenantName = details.tenantName || details.name || 'tenant';

		if (log.action_type === 'tenant.onboarded') {
			return `Onboarded tenant "${tenantName}"`;
		}
	}

	// Security actions
	if (log.category === 'security' || log.action_type?.includes('security')) {
		const resource = details.resource || details.resourceType || 'resource';

		if (log.action_type === 'security.access_denied') {
			return `Access denied to ${resource}`;
		}
		if (log.action_type === 'security.unauthorized_access') {
			return `Unauthorized access attempt to ${resource}`;
		}
	}

	// Fallback: create a readable sentence from action type
	if (log.action_type) {
		const readable = formatActionType(log.action_type).toLowerCase();
		return `${readable.charAt(0).toUpperCase()}${readable.slice(1)}`;
	}

	return 'Activity logged';
};
