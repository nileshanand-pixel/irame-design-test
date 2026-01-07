export const COLUMN_WIDTH = '12.5rem';

export const PRE_DEFINED_COLUMN_KEYS = {
	CASE_ID: 'case_id',
	FLAGGING: 'flagging',
	SEVERITY: 'severity',
	DUE_DATE: 'due_date',
	STATUS: 'status',
	ASSIGNED_TO: 'assigned_to',
	COMMENTS: 'comments',
	FLAGGED_BY: 'flagged_by',
};

export const createColumnsConfig = (casesData, cellComponents) => {
	const {
		TextCell,
		FlaggingCell,
		SeverityCell,
		DateCell,
		StatusCell,
		UsersCell,
		CommentsCell,
		UserCell,
	} = cellComponents;

	const columns = [];

	// Add static columns first - Case ID
	columns.push({
		key: PRE_DEFINED_COLUMN_KEYS.CASE_ID,
		label: 'Case ID',
		type: 'text',
		width: '3.75rem',
		Component: TextCell,
	});

	// Add remaining static columns
	columns.push(
		{
			key: PRE_DEFINED_COLUMN_KEYS.FLAGGING,
			label: 'Flagging',
			width: COLUMN_WIDTH,
			isDynamic: false,
			Component: FlaggingCell,
		},
		{
			key: PRE_DEFINED_COLUMN_KEYS.SEVERITY,
			label: 'Severity',
			width: '7.5rem',
			isDynamic: false,
			Component: SeverityCell,
		},
		{
			key: PRE_DEFINED_COLUMN_KEYS.DUE_DATE,
			label: 'Due Date',
			width: COLUMN_WIDTH,
			isDynamic: false,
			Component: DateCell,
		},
		{
			key: PRE_DEFINED_COLUMN_KEYS.STATUS,
			label: 'Review Status',
			width: COLUMN_WIDTH,
			isDynamic: false,
			Component: StatusCell,
		},
		{
			key: PRE_DEFINED_COLUMN_KEYS.ASSIGNED_TO,
			label: 'Assigned to',
			width: COLUMN_WIDTH,
			isDynamic: false,
			Component: UsersCell,
		},
		{
			key: PRE_DEFINED_COLUMN_KEYS.COMMENTS,
			label: 'Resolution Trail',
			width: COLUMN_WIDTH,
			isDynamic: false,
			Component: CommentsCell,
		},
		{
			key: PRE_DEFINED_COLUMN_KEYS.FLAGGED_BY,
			label: 'Flagged by',
			width: COLUMN_WIDTH,
			isDynamic: false,
			Component: UserCell,
		},
	);

	// Add dynamic columns from API
	if (casesData?.columns) {
		casesData.columns.forEach((col) => {
			if (col.is_dynamic) {
				columns.push({
					key: col.column_name,
					label: col.column_name
						.split('_')
						.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
						.join(' '),
					width: COLUMN_WIDTH,
					isDynamic: true,
					Component: TextCell,
				});
			}
		});
	}

	return columns;
};

export const getColumnOptionsForFilters = (casesData) => {
	const options = [];

	// Add Case ID first
	options.push({
		value: PRE_DEFINED_COLUMN_KEYS.CASE_ID,
		label: 'Case ID',
	});

	// Add dynamic columns from API
	if (casesData?.columns) {
		casesData.columns.forEach((col) => {
			if (col.is_dynamic) {
				options.push({
					value: col.column_name,
					label: col.column_name
						.split('_')
						.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
						.join(' '),
				});
			}
		});
	}

	// Add remaining static columns
	options.push(
		{
			value: PRE_DEFINED_COLUMN_KEYS.FLAGGING,
			label: 'Flagging',
		},
		{
			value: PRE_DEFINED_COLUMN_KEYS.SEVERITY,
			label: 'Severity',
		},
		{
			value: PRE_DEFINED_COLUMN_KEYS.DUE_DATE,
			label: 'Due Date',
		},
		{
			value: PRE_DEFINED_COLUMN_KEYS.STATUS,
			label: 'Status',
		},
		{
			value: PRE_DEFINED_COLUMN_KEYS.ASSIGNED_TO,
			label: 'Assigned To',
		},
		{
			value: PRE_DEFINED_COLUMN_KEYS.COMMENTS,
			label: 'Comments',
		},
		{
			value: PRE_DEFINED_COLUMN_KEYS.FLAGGED_BY,
			label: 'Flagged By',
		},
	);

	return options;
};

export const transformCasesDataToTableRows = (cases) => {
	if (!cases || !Array.isArray(cases)) {
		return [];
	}

	return cases.map((caseItem) => {
		// Map assigned_to to the format expected by the component
		const assignedUsers =
			caseItem.assigned_to?.map((user) => ({
				user_id: user.user_id,
				name: user.username,
			})) || [];

		// Build the row data
		const rowData = {
			case_id: caseItem.case_id,
			flagging: caseItem.flagging,
			severity: caseItem.severity,
			due_date: caseItem.due_date,
			status: caseItem.status,
			assigned_to: assignedUsers,
			comments: caseItem.comments,
			flagged_by: caseItem.flagged_by,
			flagged_on: caseItem.flagged_on,
			description: caseItem.description,
		};

		// Add dynamic columns data
		if (caseItem.dynamic_columns) {
			Object.keys(caseItem.dynamic_columns).forEach((key) => {
				rowData[key] = caseItem.dynamic_columns[key];
			});
		}

		return rowData;
	});
};
