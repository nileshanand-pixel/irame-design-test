import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for managing widget selection state
 * @param {Object} options - Hook options
 * @param {string|null} options.initialGraphId - Initial graph ID to select
 * @param {string|null} options.initialTableId - Initial table ID to select
 * @returns {Object} Widget selection state and handlers
 */
export const useWidgetSelection = ({
	initialGraphId = null,
	initialTableId = null,
} = {}) => {
	const [selectedGraph, setSelectedGraph] = useState(initialGraphId);
	const [selectedTable, setSelectedTable] = useState(initialTableId);

	// Update selections when initial values change (e.g., when dashboard changes)
	useEffect(() => {
		setSelectedGraph(initialGraphId);
	}, [initialGraphId]);

	useEffect(() => {
		setSelectedTable(initialTableId);
	}, [initialTableId]);

	/**
	 * Toggles widget selection (radio behavior: selecting one deselects previous)
	 */
	const toggleWidget = useCallback((widget, type) => {
		if (type === 'graph') {
			setSelectedGraph((prev) => (prev === widget.id ? null : widget.id));
		} else if (type === 'table') {
			setSelectedTable((prev) => (prev === widget.id ? null : widget.id));
		}
	}, []);

	/**
	 * Resets all selections
	 */
	const resetSelection = useCallback(() => {
		setSelectedGraph(null);
		setSelectedTable(null);
	}, []);

	/**
	 * Checks if at least one widget is selected
	 */
	const hasSelection = useCallback(() => {
		return !!(selectedGraph || selectedTable);
	}, [selectedGraph, selectedTable]);

	return {
		selectedGraph,
		selectedTable,
		toggleWidget,
		resetSelection,
		hasSelection,
	};
};
