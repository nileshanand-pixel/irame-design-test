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
 * @returns {Object} Hook return object
 * @returns {Object[]} returns.data - Parsed CSV data (array of objects)
 * @returns {Object[]} returns.columns - Generated column definitions
 * @returns {boolean} returns.isLoading - Loading state
 * @returns {Error|null} returns.error - Error object if fetch failed
 * @returns {Function} returns.refetch - Function to manually refetch data

 */
export const useCsvData = (csvUrl, options = {}) => {
	const {
		feature = 'dashboard',
		action = 'load-csv-data',
		extra = {},
		autoFetch = true,
	} = options;

	const [data, setData] = useState([]);
	const [columns, setColumns] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const hasFetchedRef = useRef(false);

	const isS3Url = (url) => {
		if (!url || typeof url !== 'string') return false;
		return url.includes('amazonaws.com') || url.includes('s3.');
	};

	const fetchData = async () => {
		if (!csvUrl || hasFetchedRef.current) return;

		hasFetchedRef.current = true;
		setIsLoading(true);
		setError(null);

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

			// Fetch and parse CSV data
			const csvData = await d3.csv(urlToFetch);

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
		if (autoFetch && csvUrl && !hasFetchedRef.current) {
			fetchData();
		}
	}, [csvUrl, autoFetch]);

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
	};
};
