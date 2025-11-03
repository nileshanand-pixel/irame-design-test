import { useState, useCallback, useMemo } from 'react';
import { toast } from '@/lib/toast';

/**
 * Workspace Manager Hook
 *
 * Manages workspace panel state and behavior with clear separation of concerns.
 *
 * IMPORTANT: This hook manages workspaceQueryId which is INDEPENDENT from the
 * currentQueryId (conversation position). This allows users to view any query's
 * workspace while being at a different position in the conversation tree.
 *
 * State Management:
 * - workspaceQueryId: Which query's workspace content to display
 * - isExpanded: Whether workspace panel is expanded or collapsed
 * - activeTab: Which tab (planner/reference/coder) is active
 * - visitedTabs: Which tabs user has opened (for UI indicators)
 *
 * @param {Object} config - Configuration object
 * @param {Array} config.answers - All conversation answers
 * @param {string} config.currentQueryId - Current query in conversation tree
 * @returns {Object} Workspace state and control functions
 *
 * @example
 * const {
 *   isExpanded,
 *   workspaceQueryId,
 *   toggleWorkspace,
 *   expandWorkspace,
 *   collapseWorkspace
 * } = useWorkspaceManager({ answers, currentQueryId });
 */
export const useWorkspaceManager = ({ answers, currentQueryId }) => {
	const [state, setState] = useState({
		isExpanded: false,
		workspaceQueryId: null, // Which query's workspace is displayed (independent from currentQueryId)
		activeTab: 'planner', // Which tab (planner/reference/coder)
		visitedTabs: { planner: true },
	});

	/**
	 * Check if a query has any workspace content available
	 * @param {string} queryId - Query ID to check
	 * @returns {boolean} True if query has workspace content
	 */
	const hasWorkspaceContent = useCallback(
		(queryId) => {
			if (!queryId) return false;

			const answer = answers.find((a) => a.query_id === queryId);
			if (!answer?.answer) return false;

			return !!(
				answer.answer.planner ||
				answer.answer.reference ||
				answer.answer.coder
			);
		},
		[answers],
	);

	/**
	 * Get available tabs for a specific query
	 * Only returns tabs that have content and are marked as secondary tool space
	 * @param {string} queryId - Query ID to check
	 * @returns {Array<string>} Array of available tab names
	 */
	const getAvailableTabs = useCallback(
		(queryId) => {
			if (!queryId) return [];

			const answer = answers.find((a) => a.query_id === queryId);
			if (!answer?.answer) return [];

			return ['planner', 'reference', 'coder'].filter(
				(tab) => answer.answer[tab]?.tool_space === 'secondary',
			);
		},
		[answers],
	);

	/**
	 * Expand workspace for a specific query with validation
	 * @param {string} queryId - Query ID to display workspace for (defaults to currentQueryId)
	 * @param {string} tab - Tab to open (defaults to 'planner')
	 * @returns {boolean} True if expansion was successful
	 */
	const expandWorkspace = useCallback(
		(queryId = null, tab = 'planner') => {
			const targetQueryId = queryId || currentQueryId;

			// Find the answer to check status
			const answer = answers.find((a) => a.query_id === targetQueryId);
			const isQueryDone = answer?.status === 'done';
			const hasContent = hasWorkspaceContent(targetQueryId);

			// Only show error if query is done but has no content
			if (isQueryDone && !hasContent) {
				toast.error('No workspace content available for this query');
				return false;
			}

			// Get available tabs for this query
			const availableTabs = getAvailableTabs(targetQueryId);

			// Determine target tab (use requested tab if available, otherwise first available, or default to 'planner')
			const targetTab = availableTabs.includes(tab)
				? tab
				: availableTabs[0] || 'planner';

			// Update state
			setState({
				isExpanded: true,
				workspaceQueryId: targetQueryId,
				activeTab: targetTab,
				visitedTabs: { ...state.visitedTabs, [targetTab]: true },
			});

			return true;
		},
		[
			currentQueryId,
			hasWorkspaceContent,
			getAvailableTabs,
			state.visitedTabs,
			answers,
		],
	); /**
	 * Collapse workspace panel
	 * Keeps workspaceQueryId for potential re-expansion
	 */
	const collapseWorkspace = useCallback(() => {
		setState((prev) => ({ ...prev, isExpanded: false }));
	}, []);

	/**
	 * Toggle workspace with smart behavior:
	 * - If collapsed: expand for target query
	 * - If expanded & same query: collapse
	 * - If expanded & different query: switch to that query's workspace
	 *
	 * @param {string} queryId - Query ID to toggle (defaults to currentQueryId)
	 * @param {string} tab - Tab to open if expanding (defaults to 'planner')
	 * @returns {boolean} True if workspace is now expanded
	 */
	const toggleWorkspace = useCallback(
		(queryId = null, tab = null) => {
			const targetQueryId = queryId || currentQueryId;
			if (!state.isExpanded) {
				// Case 1: Workspace is collapsed -> expand for target query
				const success = expandWorkspace(targetQueryId, tab);
				return success;
			} else if (state.workspaceQueryId === targetQueryId) {
				// Case 2: Same query clicked -> collapse workspace
				collapseWorkspace();
				return false;
			} else {
				// Case 3: Different query clicked -> switch workspace content
				const success = expandWorkspace(targetQueryId, tab);
				return success;
			}
		},
		[
			state.isExpanded,
			state.workspaceQueryId,
			currentQueryId,
			expandWorkspace,
			collapseWorkspace,
		],
	);

	/**
	 * Switch to a different tab within the workspace
	 * @param {string} tab - Tab name to switch to
	 */
	const switchTab = useCallback((tab) => {
		setState((prev) => ({
			...prev,
			activeTab: tab,
			visitedTabs: { ...prev.visitedTabs, [tab]: true },
		}));
	}, []);

	/**
	 * Switch workspace to display a different query's content
	 * Maintains current tab if available, otherwise switches to first available tab
	 * @param {string} queryId - Query ID to switch workspace to
	 */
	const switchWorkspaceQuery = useCallback(
		(queryId) => {
			if (!queryId) {
				return;
			}

			const availableTabs = getAvailableTabs(queryId);
			const targetTab = availableTabs.includes(state.activeTab)
				? state.activeTab
				: availableTabs[0] || 'planner';

			setState((prev) => ({
				...prev,
				workspaceQueryId: queryId,
				activeTab: targetTab,
				visitedTabs: { ...prev.visitedTabs, [targetTab]: true },
			}));
		},
		[getAvailableTabs, state.activeTab, state.visitedTabs],
	);

	/**
	 * Get the complete answer object for the currently displayed workspace
	 * @returns {Object|null} Answer object or null if not found
	 */
	const workspaceAnswer = useMemo(() => {
		if (!state.workspaceQueryId) {
			return null;
		}
		const answer = answers.find((a) => a.query_id === state.workspaceQueryId);
		return answer || null;
	}, [answers, state.workspaceQueryId]);

	return {
		// State
		isExpanded: state.isExpanded,
		workspaceQueryId: state.workspaceQueryId,
		activeTab: state.activeTab,
		visitedTabs: state.visitedTabs,
		workspaceAnswer,

		// Actions
		expandWorkspace,
		collapseWorkspace,
		toggleWorkspace,
		switchTab,
		switchWorkspaceQuery,

		// Utilities
		hasWorkspaceContent,
		getAvailableTabs,
	};
};
