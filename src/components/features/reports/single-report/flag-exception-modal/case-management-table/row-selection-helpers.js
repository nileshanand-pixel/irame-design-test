// Selection scope options for the case management table.
export const SELECTION_SCOPE_OPTIONS = [
	// {
	// 	value: 'all',
	// 	label: 'All Cases',
	// },
	{
		value: 'page',
		label: 'This Page',
	},
];

// Select all states
export const SELECT_ALL_STATES = {
	NONE: false,
	ALL: true,
	INDETERMINATE: 'indeterminate',
};

// For single selection, toggles a single ID in the current selection array, returning a new array.
export function toggleIdInArraySelection(prev, id) {
	const next = new Set(prev);
	if (next.has(id)) next.delete(id);
	else next.add(id);
	return Array.from(next);
}

// Adds all IDs between two row indexes (inclusive) into the selection array.
// Existing selections outside the range are preserved.
export function addIndexRangeToArraySelection(
	prev,
	idsByIndex,
	startIndex,
	endIndex,
) {
	const next = new Set(prev);
	const start = Math.min(startIndex, endIndex);
	const end = Math.max(startIndex, endIndex);
	for (let idx = start; idx <= end; idx += 1) {
		const idInRange = idsByIndex[idx];
		if (idInRange != null) next.add(idInRange);
	}
	return Array.from(next);
}
