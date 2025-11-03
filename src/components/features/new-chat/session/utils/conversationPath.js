/**
 * Utility functions for managing conversation path and branching
 */

/**
 * Get all children of a parent query, sorted by created_at
 * @param {Array} queries - All queries
 * @param {string|null} parentId - Parent query ID
 * @returns {Array} Sorted children
 */
export function getChildren(queries, parentId) {
	const children = queries.filter((q) => q.parent_query_id === parentId);
	// Sort by created_at (oldest first)
	return children.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

/**
 * Get sibling information for a query
 * @param {Array} queries - All queries
 * @param {string} queryId - Target query ID
 * @returns {Object} { current, total, hasSiblings, siblings }
 */
export function getSiblingInfo(queries, queryId) {
	const query = queries.find((q) => q.query_id === queryId);
	if (!query) {
		return { current: 1, total: 1, hasSiblings: false, siblings: [] };
	}

	const siblings = getChildren(queries, query.parent_query_id);

	const currentIndex = siblings.findIndex((q) => q.query_id === queryId);

	return {
		current: currentIndex + 1, // 1-based index
		total: siblings.length,
		hasSiblings: siblings.length > 1,
		siblings: siblings,
		currentIndex: currentIndex, // 0-based for state
	};
}

/**
 * Get the active child index for a parent
 * @param {string} parentId - Parent query ID
 * @param {Object} activePath - Active path state
 * @returns {number} Index of active child (0-based)
 */
export function getActiveChildIndex(parentId, activePath) {
	// Check if user explicitly selected a child
	if (activePath.hasOwnProperty(parentId)) {
		return activePath[parentId];
	}

	// Default: return 0 (first child)
	return 0;
}

/**
 * Get path from root to a specific query (tracing back)
 * Used for in-progress queries
 * @param {Array} queries - All queries
 * @param {string} targetQueryId - Target query ID
 * @returns {Array} Path of queries from root to target
 */
export function getPathToQuery(queries, targetQueryId) {
	const path = [];
	let currentId = targetQueryId;

	while (currentId) {
		const query = queries.find((q) => q.query_id === currentId);
		if (!query) break;

		path.unshift(query); // Add to beginning
		currentId = query.parent_query_id;
	}

	return path;
}

/**
 * Extract active path based on user selections
 * Walks from root following activePath selections
 * @param {Array} queries - All queries
 * @param {Object} activePath - Active path state
 * @returns {Array} Path of queries to display
 */
export function getPathFromActivePath(queries, activePath) {
	// Handle multi-root: gather all roots and select via activePath[null]
	const roots = getChildren(queries, null);
	if (!roots || roots.length === 0) return [];

	const rootIndex = getActiveChildIndex(null, activePath);
	const rootQuery = roots[rootIndex] || roots[0];
	if (!rootQuery) return [];

	const path = [rootQuery];
	let currentQuery = rootQuery;

	// Follow the active path down
	while (currentQuery) {
		const children = getChildren(queries, currentQuery.query_id);
		if (children.length === 0) break;

		// Pick the active child (default to first)
		const activeIndex = getActiveChildIndex(currentQuery.query_id, activePath);
		const nextQuery = children[activeIndex];

		if (!nextQuery) break;

		path.push(nextQuery);
		currentQuery = nextQuery;
	}

	return path;
}

/**
 * Extract the active path to display
 * Auto-shows in-progress path unless user has navigated
 * @param {Array} queries - All queries
 * @param {Object} activePath - Active path state
 * @param {boolean} userHasNavigated - Whether user has manually navigated
 * @returns {Array} Path of queries to display
 */
export function extractActivePath(queries, activePath, userHasNavigated) {
	if (!queries || queries.length === 0) return [];

	// Find in-progress queries (prefer the most recently created)
	const inProgressList = queries
		.filter((q) => q.status !== 'done' && q.status !== 'failed')
		.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

	const inProgressQuery = inProgressList.length
		? inProgressList[inProgressList.length - 1]
		: null;

	// If any query is in progress and user hasn't navigated, default to that path
	if (inProgressQuery && !userHasNavigated) {
		return getPathToQuery(queries, inProgressQuery.query_id);
	}

	// Otherwise, respect user's explicit choices
	return getPathFromActivePath(queries, activePath);
}

/**
 * Get all descendant query IDs of a given query
 * @param {Array} queries - All queries
 * @param {string} ancestorId - Ancestor query ID
 * @returns {Array} Array of descendant query IDs
 */
export function getAllDescendants(queries, ancestorId) {
	const descendants = [];
	const queue = [ancestorId];

	while (queue.length > 0) {
		const currentId = queue.shift();
		const children = queries.filter((q) => q.parent_query_id === currentId);

		children.forEach((child) => {
			descendants.push(child.query_id);
			queue.push(child.query_id);
		});
	}

	return descendants;
}

/**
 * Remove descendant choices from activePath when switching branches
 * @param {Object} activePath - Active path state (will be mutated)
 * @param {Array} queries - All queries
 * @param {string} oldChildId - Old child query ID whose descendants should be removed
 */
export function removeDescendantChoices(activePath, queries, oldChildId) {
	const descendants = getAllDescendants(queries, oldChildId);

	descendants.forEach((descId) => {
		delete activePath[descId];
	});
}
