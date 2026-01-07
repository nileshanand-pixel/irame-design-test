import { getSupportedGraphs } from '@/lib/utils';
import { removeQueryString } from '@/utils/url';

/**
 * Transforms query data into widgets format for dashboard selection
 *
 * @param {Object} queryData - Query data from API
 * @returns {Object} Widgets object with graphs, tables, and kpis arrays
 */
export const transformQueryDataToWidgets = (queryData) => {
	if (!queryData) {
		return { graphs: [], tables: [], kpis: [] };
	}

	const queryAnswer = queryData.answer || {};
	const graphData = queryAnswer.graph?.tool_data;
	const responseDataframe = queryAnswer.response_dataframe?.tool_data;

	// Extract graphs - only include graphs with valid IDs
	const graphList = graphData?.graphs || [];
	const supportedGraphs = getSupportedGraphs(graphList);
	const graphs = supportedGraphs
		.filter((graph) => graph.id) // Only include graphs with valid IDs
		.map((graph) => ({
			id: graph.id, // Use actual graph ID from API
			title: graph.title || graph.chart_title || 'Untitled Graph',
			graphData: graph, // Full graph data for GraphRenderer
		}));

	// Extract tables - ensure structure matches WidgetCard expectations
	const tables = [];
	if (responseDataframe) {
		// Use same priority as API: csv_url first, then sample_url
		// This ensures widget.id matches what's stored in dashboard
		const rawTableUrl =
			responseDataframe.csv_url || responseDataframe.sample_url;
		if (rawTableUrl) {
			// Normalize table URL by removing query parameters to match stored format
			// This ensures proper matching with existingTableUrl from dashboard
			const normalizedTableUrl = removeQueryString(rawTableUrl);

			tables.push({
				id: normalizedTableUrl, // Use normalized URL as ID for matching
				title: 'Data Table',
				tableUrl: rawTableUrl, // Keep raw URL for actual data fetching
				csv_url: responseDataframe.csv_url, // Top-level for compatibility
				sample_url: responseDataframe.sample_url, // Store both for matching fallback
				tableData: responseDataframe, // Full table data for TableComponent
			});
		}
	}

	return { graphs, tables, kpis: [] };
};
