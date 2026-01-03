import { removeQueryString } from '@/utils/url';

/**
 * Extracts table URL from dashboard content item
 * Handles various API response formats and removes query parameters
 * to match the base URL stored in the database
 *
 * @param {Object} item - Dashboard content item
 * @param {Object} tableData - Table data object (optional, will extract from item if not provided)
 * @returns {string|null} Base table URL without query parameters, or null if not found
 */
export const extractTableUrl = (item, tableData = null) => {
	const table = tableData || item?.content?.table;

	if (!table && !item?.content) {
		return null;
	}

	// Try to extract URL from various possible locations in the API response
	const url =
		// Check if table_urls is an array (most likely format from API)
		(Array.isArray(table?.table_urls) && table.table_urls.length > 0
			? table.table_urls[0]
			: null) ||
		// Check array at content level
		(Array.isArray(item?.content?.table_urls) &&
		item.content.table_urls.length > 0
			? item.content.table_urls[0]
			: null) ||
		// Check object properties in tableData
		table?.url ||
		table?.table_url ||
		table?.tableUrl ||
		table?.csv_url ||
		table?.sample_url ||
		// Check tool_data structure (from query response)
		table?.tool_data?.sample_url ||
		table?.tool_data?.csv_url ||
		// Check if it's stored at content level
		item?.table_url ||
		item?.tableUrl ||
		null;

	// Remove query parameters (presigned URL params) to match what was stored in DB
	// When we create dashboard content, we store the base URL without query params
	// But when we fetch CSV data, we might get a presigned URL with query params
	return url ? removeQueryString(url) : null;
};
