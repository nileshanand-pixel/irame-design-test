import { useEffect, useRef } from 'react';

// Selection scope options for the case management table.
export const CASE_SELECTION_SCOPES = {
	ALL: 'all',
	PAGE: 'page',
};

export const DEFAULT_CASE_SELECTION_SCOPE_OPTIONS = [
	// {
	// 	value: CASE_SELECTION_SCOPES.ALL,
	// 	label: 'All Cases',
	// },
	{
		value: CASE_SELECTION_SCOPES.PAGE,
		label: 'This Page',
	},
];

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

// Tracks whether the Shift key is currently pressed using global listeners.
export function useShiftKeyPressedRef() {
	const shiftKeyPressedRef = useRef(false);

	useEffect(() => {
		if (typeof window === 'undefined') return undefined;

		const handleKeyDown = (event) => {
			if (event.key === 'Shift') shiftKeyPressedRef.current = true;
		};
		const handleKeyUp = (event) => {
			if (event.key === 'Shift') shiftKeyPressedRef.current = false;
		};
		const handleBlur = () => {
			shiftKeyPressedRef.current = false;
		};

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);
		window.addEventListener('blur', handleBlur);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
			window.removeEventListener('blur', handleBlur);
		};
	}, []);

	return shiftKeyPressedRef;
}
