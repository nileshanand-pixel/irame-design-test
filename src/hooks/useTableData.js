import { useState, useEffect } from 'react';
import { useCsvData } from './useCsvData';
import { processTableData } from '@/utils/table.utils';
import { extractCsvUrl } from '@/utils/graph.utils';

/**
 * Custom hook for handling table data (CSV or direct data)
 * Automatically detects data source type and processes accordingly
 *
 * @param {Object} tableData - Table data object
 * @param {string} tableData.sample_url - CSV URL (preferred)
 * @param {string} tableData.csv_url - Alternative CSV URL
 * @param {string[]|Object[]} tableData.columns - Column names or definitions
 * @param {string[]|Object[]} tableData.headers - Alternative column names
 * @param {Array[]|Object[]} tableData.rows - Row data
 * @param {Array[]|Object[]} tableData.data - Alternative row data
 * @param {Object} options - Configuration options for CSV fetching
 * @param {string} options.feature - Feature name for logging
 * @param {string} options.action - Action name for logging
 * @param {Object} options.extra - Extra data for logging
 * @param {string|null} options.csvUrlKey - Optional priority key for CSV URL extraction
 * @param {boolean} options.enabled - Whether data fetching is enabled (default: true)
 * @param {number|null} options.fileSizeLimit - Optional file size limit in bytes
 * @returns {Object} Hook return object
 * @returns {Object[]} returns.data - Processed row data (always objects)
 * @returns {Object[]} returns.columns - Column definitions for TableComponent
 * @returns {boolean} returns.isLoading - Loading state
 * @returns {Error|null} returns.error - Error object if fetch failed
 * @returns {boolean} returns.isPartialData - Whether the data was truncated due to file size limit
 */
export const useTableData = (tableData, options = {}) => {
	const { csvUrlKey = null, enabled = true, ...restOptions } = options;
	const [directData, setDirectData] = useState({ rows: [], columns: [] });
	const [isProcessingDirect, setIsProcessingDirect] = useState(false);

	// Try to get CSV URL with optional priority key
	const csvUrl = extractCsvUrl(tableData, 'table', csvUrlKey);

	// Fetch CSV data if URL exists
	const {
		data: csvData,
		columns: csvColumns,
		isLoading: isCsvLoading,
		error: csvError,
		isPartialData,
	} = useCsvData(csvUrl, {
		...restOptions,
		autoFetch: !!csvUrl,
		enabled: enabled,
		fileSizeLimit: restOptions.fileSizeLimit,
	});

	// Process direct data if no CSV URL
	useEffect(() => {
		if (!csvUrl && tableData) {
			setIsProcessingDirect(true);
			const processed = processTableData(tableData);
			setDirectData(processed);
			setIsProcessingDirect(false);
		}
	}, [csvUrl, tableData]);

	// Return CSV data if available, otherwise direct data
	if (csvUrl) {
		return {
			data: csvData,
			columns: csvColumns,
			isLoading: isCsvLoading,
			error: csvError,
			isPartialData,
		};
	}

	return {
		data: directData.rows,
		columns: directData.columns,
		isLoading: isProcessingDirect,
		error: null,
		isPartialData: false,
	};
};
