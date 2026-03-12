import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { logError } from '@/lib/logger';
import { generateTableColumns, normalizeColumnNameToKey } from '@/utils/table.utils';
import { createSignedUrlFromS3Url } from '@/utils/file';

/**
 * Custom hook for fetching and managing CSV data
 * Handles CSV fetching, column generation, loading states, and error handling
 *
 * @param {string|null} csvUrl - URL to fetch CSV from
 * @param {Object} options - Configuration options
 * @param {string} options.feature - Feature name for logging (default: 'dashboard')
 * @param {string} options.action - Action name for logging (default: 'load-csv-data')
 * @param {Object} options.extra - Extra data for error logging
 * @param {boolean} options.autoFetch - Whether to fetch automatically (default: true)
 * @param {boolean} options.enabled - Whether fetching is enabled (default: true)
 * @param {number|null} options.fileSizeLimit - File size limit in bytes (e.g., 5*1024*1024 for 5MB). If set, fetches only the first N bytes via Range header
 * @returns {Object} Hook return object
 * @returns {Object[]} returns.data - Parsed CSV data (array of objects)
 * @returns {Object[]} returns.columns - Generated column definitions
 * @returns {boolean} returns.isLoading - Loading state
 * @returns {Error|null} returns.error - Error object if fetch failed
 * @returns {Function} returns.refetch - Function to manually refetch data
 * @returns {boolean} returns.isPartialData - Whether the data was truncated due to file size limit
 */
export const useCsvData = (csvUrl, options = {}) => {
	const {
		feature = 'dashboard',
		action = 'load-csv-data',
		extra = {},
		autoFetch = true,
		enabled = true,
		fileSizeLimit,
	} = options;

	const [data, setData] = useState([]);
	const [columns, setColumns] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const hasFetchedRef = useRef(false);
	const [isPartialData, setIsPartialData] = useState(false);

	const isS3Url = (url) => {
		if (!url || typeof url !== 'string') return false;
		return url.includes('amazonaws.com') || url.includes('s3.');
	};

	const fetchData = async () => {
		if (!csvUrl || hasFetchedRef.current || !enabled) return;

		hasFetchedRef.current = true;
		setIsLoading(true);
		setError(null);
		setIsPartialData(false);

		try {
			let urlToFetch = csvUrl;

			// If it's an S3 URL, get a presigned URL first
			if (isS3Url(csvUrl)) {
				try {
					urlToFetch = await createSignedUrlFromS3Url(csvUrl);
					if (!urlToFetch) {
						throw new Error('Failed to get presigned URL for S3 file');
					}
				} catch (s3Error) {
					// If getting presigned URL fails, log and throw
					logError(s3Error, {
						feature,
						action: `${action}-presigned-url`,
						extra: {
							originalUrl: csvUrl,
							errorMessage: s3Error.message,
							...extra,
						},
					});
					throw new Error(
						`Failed to access file: ${s3Error.message || 'Access denied'}`,
					);
				}
			}

			let csvText;

			// Fetch with size limit if specified
			if (fileSizeLimit && fileSizeLimit > 0) {
				try {
					const response = await fetch(urlToFetch, {
						headers: {
							Range: `bytes=0-${fileSizeLimit - 1}`,
						},
					});

					// Check if server supports range requests
					if (response.status === 206 || response.status === 200) {
						const partialText = await response.text();

						// If we got a partial response, mark it
						if (response.status === 206) {
							setIsPartialData(true);
						}

						// Ensure we have complete rows by finding the last complete line
						const lastNewlineIndex = partialText.lastIndexOf('\n');
						csvText =
							lastNewlineIndex > 0
								? partialText.substring(0, lastNewlineIndex)
								: partialText;
					} else {
						// Server doesn't support range requests, fall back to d3.csv
						throw new Error('Range requests not supported');
					}
				} catch (rangeError) {
					// Fall back to regular fetch if range request fails
					console.warn(
						'Range request failed, falling back to full fetch:',
						rangeError.message,
					);
					csvText = null; // Will use d3.csv below
				}
			}

			// Parse CSV data
			let csvData;
			if (csvText) {
				// Parse the fetched text manually
				csvData = d3.csvParse(csvText);
			} else {
				// Use d3.csv for full file fetch
				csvData = await d3.csv(urlToFetch);
			}

			if (csvData.length > 0) {
				// Get original column names from the first row
				const originalColumnNames = Object.keys(csvData[0]);

				// Normalize data keys to match normalized accessorKeys
				// d3.csv uses original column names as keys, but we normalize them for consistency
				const normalizedData = csvData.map((row) => {
					const normalizedRow = {};
					originalColumnNames.forEach((originalKey) => {
						const normalizedKey = normalizeColumnNameToKey(originalKey);
						normalizedRow[normalizedKey] = row[originalKey];
					});
					return normalizedRow;
				});

				setData(normalizedData);

				// Generate columns using original column names for proper header display
				// but the data will use normalized keys
				setColumns(generateTableColumns(originalColumnNames));
			} else {
				setData([]);
				setColumns([]);
			}
		} catch (err) {
			setError(err);
			logError(err, {
				feature,
				action,
				extra: {
					url: csvUrl,
					errorMessage: err.message,
					...extra,
				},
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Reset fetch flag when URL changes
	useEffect(() => {
		if (csvUrl) {
			hasFetchedRef.current = false;
		}
	}, [csvUrl]);

	// Auto-fetch when URL is available
	useEffect(() => {
		if (autoFetch && csvUrl && !hasFetchedRef.current && enabled) {
			fetchData();
		}
	}, [csvUrl, autoFetch, enabled]);

	const refetch = () => {
		hasFetchedRef.current = false;
		fetchData();
	};

	return {
		data,
		columns,
		isLoading,
		error,
		refetch,
		isPartialData,
	};
};
