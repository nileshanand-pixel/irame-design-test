// Permissions hidden from all UI displays
export const HIDDEN_PERMISSIONS = {
	approval: '*',
	team: ['delete'],
	business_process: ['edit', 'delete', 'clone'],
	workflow: ['edit', 'delete'],
};

// Filter for grouped API response { success, data: { resource: [perms] } }
// Used by usePermissions hook
export const filterHiddenPermissions = (response) => {
	if (!response?.data) return response;

	const filtered = Object.entries(response.data).reduce(
		(acc, [resource, perms]) => {
			const rule = HIDDEN_PERMISSIONS[resource];
			if (rule === '*') return acc;

			if (Array.isArray(rule)) {
				const kept = perms.filter((p) => !rule.includes(p.action));
				if (kept.length > 0) acc[resource] = kept;
			} else {
				acc[resource] = perms;
			}
			return acc;
		},
		{},
	);

	return { ...response, data: filtered };
};

// Filter for flat permission array where items have `name` like "team-delete"
// Used by edit-user-drawer, invite-user-drawer
export const filterHiddenPermissionsList = (permissions) => {
	if (!permissions) return permissions;
	return permissions.filter((p) => {
		const separatorIndex = p.name.indexOf('-');
		if (separatorIndex === -1) return true;
		const resource = p.name.substring(0, separatorIndex);
		const action = p.name.substring(separatorIndex + 1);
		const rule = HIDDEN_PERMISSIONS[resource];
		if (rule === '*') return false;
		if (Array.isArray(rule) && rule.includes(action)) return false;
		return true;
	});
};
