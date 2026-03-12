/**
 * Normalizes graph data to ensure csv_url exists
 *
 * @param {Object} graph - Graph data object
 * @param {string} graph.csv_url - CSV URL from API
 * @returns {Object|null} Normalized graph with csv_url, or null if graph is invalid
 */
export const normalizeGraphData = (graph) => {
	if (!graph) return null;

	return {
		...graph,
		csv_url: graph.csv_url,
	};
};

/**
 * Supports both graph and table data structures
 *
 * @param {Object} data - Data object (graph or table)
 * @param {string} type - Type of data: 'graph' | 'table' (default: 'graph')
 * @param {string|null} priorityKey - Optional key to check first with highest priority
 * @returns {string|null} CSV URL or null if not found
 */
export const extractCsvUrl = (data, type = 'graph', priorityKey = null) => {
	if (!data) return null;

	// If priority key is specified and exists, use it first
	if (priorityKey && data[priorityKey]) {
		return data[priorityKey];
	}

	if (type === 'graph') {
		return data.csv_url || null;
	}

	if (type === 'table') {
		return data.sample_url || data.csv_url || null;
	}

	return null;
};
