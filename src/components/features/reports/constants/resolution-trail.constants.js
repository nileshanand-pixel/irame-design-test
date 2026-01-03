export const USERS_LIST = [
	{ id: 1, name: 'Nisha Desai', email: 'nisha.desai456@gmail.com' },
	{ id: 2, name: 'Aarav Mehta', email: 'aarav.mehta@gmail.com' },
	{ id: 3, name: 'Riya Patel', email: 'riya.patel@sample.com' },
	{ id: 4, name: 'Liam Sharma', email: 'liam.sharma@sample.com' },
	{ id: 5, name: 'Ayush Mehta', email: 'ayush.mehta@gmail.com' },
	{ id: 6, name: 'Sakshi Patel', email: 'sakshi.patel@gmail.com' },
];

// Mapping constants for API to UI
export const STATUS_MAP_TO_UI = {
	in_progress: 'IN_PROGRESS',
	completed: 'COMPLETED',
	resolved: 'COMPLETED',
	pending: 'PENDING',
};

export const SEVERITY_MAP_TO_UI = {
	low: 'LOW',
	medium: 'MEDIUM',
	high: 'HIGH',
};

export const ACTION_MAP_TO_UI = {
	need_action: 'NEED_ACTION',
	business_as_usual: 'BUSINESS_AS_USUAL',
	systematic_exception: 'SYSTEMATIC_EXCEPTION',
	false_positive: 'FALSE_POSITIVE',
	approved: 'APPROVED',
};

export const STATUS_OPTIONS = {
	REVIEW_PENDING: {
		label: 'pending',
		dotClass: 'bg-pill-status-pending',
		bgClass: 'bg-orange-50',
		textClass: 'text-pill-status-pending',
		borderClass: 'border-pill-status-pendingBorder',
	},
	COMPLETED: {
		label: 'done',
		dotClass: 'bg-pill-status-completed',
		bgClass: 'bg-green-50',
		textClass: 'text-pill-status-completed',
		borderClass: 'border-pill-status-completedBorder',
	},
};

export const ACTION_OPTIONS = {
	NEED_ACTION: {
		label: 'Need action',
		dotClass: 'bg-pill-action-needAction',
		bgClass: 'bg-blue-50',
		textClass: 'text-pill-action-needAction',
		borderClass: 'border-pill-action-needActionBorder',
	},
	BUSINESS_AS_USUAL: {
		label: 'Business as usual',
		dotClass: 'bg-pill-action-bau',
		bgClass: 'bg-orange-50',
		textClass: 'text-pill-action-bau',
		borderClass: 'border-pill-action-bauBorder',
	},
	SYSTEMATIC_EXCEPTION: {
		label: 'Systematic exception',
		dotClass: 'bg-pill-action-systematic',
		bgClass: 'bg-purple-50',
		textClass: 'text-pill-action-systematic',
		borderClass: 'border-pill-action-systematicBorder',
	},
	FALSE_POSITIVE: {
		label: 'False positive',
		dotClass: 'bg-pill-action-falsePositive',
		bgClass: 'bg-pink-50',
		textClass: 'text-pill-action-falsePositive',
		borderClass: 'border-pill-action-falsePositiveBorder',
	},
	APPROVED: {
		label: 'Approved',
		dotClass: 'bg-pill-action-approved',
		bgClass: 'bg-green-50',
		textClass: 'text-pill-action-approved',
		borderClass: 'border-pill-action-approvedBorder',
	},
};

export const SEVERITY_OPTIONS = {
	LOW: {
		label: 'Low',
		dotClass: 'bg-pill-severity-low',
		bgClass: 'bg-yellow-50',
		textClass: 'text-pill-severity-low',
		borderClass: 'border-pill-severity-lowBorder',
	},
	MEDIUM: {
		label: 'Medium',
		dotClass: 'bg-pill-severity-medium',
		bgClass: 'bg-orange-50',
		textClass: 'text-pill-severity-medium',
		borderClass: 'border-pill-severity-mediumBorder',
	},
	HIGH: {
		label: 'High',
		dotClass: 'bg-pill-severity-high',
		bgClass: 'bg-red-50',
		textClass: 'text-pill-severity-high',
		borderClass: 'border-pill-severity-highBorder',
	},
};

export const triggerBase =
	'h-12 px-3.5 py-2 rounded-lg border text-sm flex items-center justify-between bg-white';

export const selectContentBase =
	'p-0 gap-0 min-w-[var(--radix-select-trigger-width)]';

export const selectItemBase = `
    p-0 m-0 w-full rounded-none
    flex items-stretch

    [&>span]:w-full
    [&>span]:flex

    hover:bg-purple-2
    data-[state=checked]:bg-purple-4
    focus:bg-purple-2

    cursor-pointer
`;
