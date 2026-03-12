import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import TableComponent from '@/components/elements/TableComponent';
import { useTableData } from '@/hooks/useTableData';
import { useTableWorker } from '@/hooks/useTableWorker';
import { useCsvWorker } from '@/hooks/useCsvWorker';
import useS3File from '@/hooks/useS3File';
import CircularLoader from '@/components/elements/loading/CircularLoader';
import { trackEvent } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { LuDownload, LuEye, LuPlus, LuFilterX } from 'react-icons/lu';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuCheckboxItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/lib/toast';
import { FilterRow } from '../FilterRow';
import * as d3 from 'd3';
import { createSignedUrlFromS3Url } from '@/utils/file';

/**
 * DetailedRecordsTab - Renders the table
 * @param {Object} table - Table data
 * @param {string} dashboardId - Dashboard ID
 * @param {string} dashboardName - Dashboard name
 * @param {string} dashboardContentId - Dashboard content ID
 * @param {string} queryId - Query ID
 * @param {string} queryText - Query text
 * @param {Array} filters - Synced filters from parent
 * @param {Function} onFiltersChange - Callback when filters change
 * @param {Object} columnVisibility - Synced column visibility from parent
 * @param {Function} onColumnVisibilityChange - Callback when column visibility changes
 */
const DetailedRecordsTab = ({
	table,
	dashboardId,
	dashboardName,
	dashboardContentId,
	queryId,
	queryText,
	filters: externalFilters = [],
	onFiltersChange,
	columnVisibility: externalColumnVisibility = {},
	onColumnVisibilityChange,
}) => {
	const { isDownloading, downloadS3File } = useS3File();
	const [searchQuery, setSearchQuery] = useState('');

	// Use external state if provided, otherwise use local state
	const [localFilters, setLocalFilters] = useState([]);
	const [localColumnVisibility, setLocalColumnVisibility] = useState({});

	const filters = onFiltersChange ? externalFilters : localFilters;
	const setFilters = onFiltersChange || setLocalFilters;

	const columnVisibility = onColumnVisibilityChange
		? externalColumnVisibility
		: localColumnVisibility;
	const setColumnVisibility = onColumnVisibilityChange || setLocalColumnVisibility;

	// Initialize Web Worker
	const { getCascadingValues, filterRows, isProcessing } = useTableWorker();

	// Initialize CSV Worker for downloads
	const { convertToCsv, isProcessing: isCsvProcessing } = useCsvWorker();

	// Cache for column values from worker
	const [columnValuesCache, setColumnValuesCache] = useState({});
	const [filteredDataState, setFilteredDataState] = useState(null);
	const [isDownloadingCsv, setIsDownloadingCsv] = useState(false);

	// Use custom hook to handle both CSV and direct data
	const {
		data: tableDataRows,
		columns: tableColumns,
		isLoading: isTableLoading,
		isPartialData,
	} = useTableData(table, {
		feature: 'graph-detail-modal',
		action: 'load-detailed-records-table-data',
		csvUrlKey: 'csv_url',
		fileSizeLimit: 5 * 1024 * 1024, // 5MB limit
		extra: {
			dashboardContentId,
		},
	});

	// Initialize column visibility when columns load
	useMemo(() => {
		if (
			tableColumns &&
			tableColumns.length > 0 &&
			Object.keys(columnVisibility).length === 0
		) {
			const initialVisibility = {};
			tableColumns.forEach((col) => {
				initialVisibility[col.accessorKey] = true;
			});
			setColumnVisibility(initialVisibility);
		}
	}, [tableColumns, columnVisibility]);

	// Filter visible columns
	const visibleColumns = useMemo(() => {
		if (!tableColumns) return [];
		return tableColumns.filter(
			(col) => columnVisibility[col.accessorKey] !== false,
		);
	}, [tableColumns, columnVisibility]);

	// Use worker to filter rows whenever filters or data change
	useEffect(() => {
		if (!tableDataRows || filters.length === 0) {
			setFilteredDataState(tableDataRows);
			return;
		}

		filterRows(tableDataRows, filters, ({ filtered }) => {
			setFilteredDataState(filtered);
		});
	}, [tableDataRows, filters, filterRows]);

	// Get unique values for a column (uses cached worker results)
	const getColumnValues = useCallback(
		(columnKey, currentFilterIndex = null) => {
			const cacheKey = `${columnKey}-${currentFilterIndex}`;

			// Return cached if available
			if (columnValuesCache[cacheKey]) {
				return columnValuesCache[cacheKey];
			}

			// Return empty array while processing
			return [];
		},
		[columnValuesCache],
	);

	// Pre-calculate column values using worker when data or filters change
	useEffect(() => {
		if (!tableDataRows || !tableColumns || tableColumns.length === 0) return;

		// When filters change, recalculate values for all filter columns
		filters.forEach((filter, filterIndex) => {
			const columnKey = filter.column;
			const cacheKey = `${columnKey}-${filterIndex}`;

			// Skip if already cached
			if (columnValuesCache[cacheKey]) return;

			const previousFilters = filters.slice(0, filterIndex);

			getCascadingValues(
				tableDataRows,
				columnKey,
				previousFilters,
				({ values }) => {
					setColumnValuesCache((prev) => ({
						...prev,
						[cacheKey]: values,
					}));
				},
			);
		});
	}, [
		tableDataRows,
		tableColumns,
		filters,
		getCascadingValues,
		columnValuesCache,
	]);

	// Apply filters to data
	const filteredData = useMemo(() => {
		return filteredDataState || tableDataRows;
	}, [filteredDataState, tableDataRows]);

	// Filter rows based on search query (keeping for future use)
	const searchFilteredRows = useMemo(() => {
		if (!searchQuery.trim()) {
			return filteredData;
		}

		const query = searchQuery.toLowerCase().trim();
		return filteredData.filter((row) => {
			// Search across all cell values in the row
			return Object.values(row).some((value) => {
				if (value === null || value === undefined) return false;
				const stringValue = String(value).toLowerCase();
				return stringValue.includes(query);
			});
		});
	}, [filteredData, searchQuery]);

	const handleSearchChange = useCallback((e) => {
		setSearchQuery(e.target.value);
	}, []);

	const addFilter = () => {
		if (!tableColumns || tableColumns.length === 0) return;

		// Get columns that don't have filters yet
		const filteredColumns = filters.map((f) => f.column);
		const availableColumns = tableColumns.filter(
			(col) => !filteredColumns.includes(col.accessorKey),
		);

		if (availableColumns.length === 0) {
			toast.error(
				'All columns already have filters. Remove a filter to add a new one.',
			);
			return;
		}

		const newFilter = {
			id: Date.now(),
			column: availableColumns[0].accessorKey,
			values: [],
		};
		setFilters([...filters, newFilter]);
	};

	const removeFilter = (filterId) => {
		setFilters(filters.filter((f) => f.id !== filterId));
	};

	const updateFilterColumn = (filterId, columnKey) => {
		setFilters(
			filters.map((f) =>
				f.id === filterId ? { ...f, column: columnKey, values: [] } : f,
			),
		);
	};

	const toggleFilterValue = (filterId, value) => {
		setFilters(
			filters.map((f) => {
				if (f.id !== filterId) return f;

				const values = f.values.includes(value)
					? f.values.filter((v) => v !== value)
					: [...f.values, value];

				return { ...f, values };
			}),
		);
	};

	const toggleColumnVisibility = (columnKey) => {
		const newVisibility = {
			...columnVisibility,
			[columnKey]: !columnVisibility[columnKey],
		};

		// Check if at least one column will remain visible
		const visibleCount = tableColumns.filter(
			(col) => newVisibility[col.accessorKey] !== false,
		).length;

		if (visibleCount === 0) {
			toast.error('At least one column must be visible');
			return;
		}

		setColumnVisibility(newVisibility);
	};

	const clearAllFiltersAndColumns = () => {
		setFilters([]);
		setColumnValuesCache({}); // Clear cache when filters are cleared
		if (tableColumns && tableColumns.length > 0) {
			const allVisible = {};
			tableColumns.forEach((col) => {
				allVisible[col.accessorKey] = true;
			});
			setColumnVisibility(allVisible);
		}
		toast.success('Filters and columns reset');
	};

	// Clear cache when filter column changes or filter is removed
	useEffect(() => {
		// When filters change structure (not just values), clear the cache
		// This ensures fresh values are fetched for new filter configurations
		const filterStructure = filters.map((f) => f.column).join(',');

		// Store previous structure to detect changes
		const prevStructure = Object.keys(columnValuesCache)
			.map((key) => key.split('-')[0])
			.join(',');

		if (filterStructure !== prevStructure) {
			setColumnValuesCache({});
		}
	}, [filters]);

	const handleDownload = async (downloadType) => {
		setIsDownloadingCsv(true);

		try {
			const downloadTypeLabel =
				downloadType === 'all'
					? 'all'
					: downloadType === 'visible-all'
						? 'visible'
						: downloadType === 'filtered-all'
							? 'filtered_all'
							: 'filtered_visible';

			trackEvent(
				EVENTS_ENUM.DASHBOARD_DOWNLOAD_CSV_CLICKED,
				EVENTS_REGISTRY.DASHBOARD_DOWNLOAD_CSV_CLICKED,
				() => ({
					dashboard_id: dashboardId,
					dashboard_name: dashboardName,
					dashboard_content_id: dashboardContentId,
					query_id: queryId,
					query_text: queryText,
					download_type: downloadTypeLabel,
				}),
			);

			if (downloadType === 'all') {
				// Option 1: Download all data from csv_url
				await handleDownloadFromUrl();
			} else if (downloadType === 'visible-all') {
				// Option 2: Download all visible data (5MB)
				await handleDownloadVisibleData(tableDataRows);
			} else if (downloadType === 'filtered-all') {
				// Option 3: Download filtered data from full csv_url
				await handleDownloadFilteredFromUrl();
			} else if (downloadType === 'filtered-visible') {
				// Option 4: Download visible filtered data (5MB)
				await handleDownloadVisibleData(filteredData);
			}
		} catch (error) {
			console.error('Download error:', error);
			toast.error(`Download failed: ${error.message}`);
		} finally {
			setIsDownloadingCsv(false);
		}
	};

	// Download complete file from csv_url
	const handleDownloadFromUrl = async () => {
		const csvUrl = table?.csv_url;

		if (!csvUrl) {
			toast.error('Download URL not available');
			return;
		}

		try {
			// Get signed URL if it's an S3 URL
			let downloadUrl = csvUrl;
			if (csvUrl.includes('amazonaws.com') || csvUrl.includes('s3.')) {
				downloadUrl = await createSignedUrlFromS3Url(csvUrl);
			}

			// Trigger download
			const link = document.createElement('a');
			link.href = downloadUrl;
			link.setAttribute('download', `data_table_all_data.csv`);
			link.style.visibility = 'hidden';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			toast.success('Download started successfully');
		} catch (error) {
			throw error;
		}
	};

	// Download filtered data from full csv_url file
	const handleDownloadFilteredFromUrl = async () => {
		if (filters.length === 0) {
			toast.error('No filters applied. Use "Download All Data" instead.');
			return;
		}

		const csvUrl = table?.csv_url;

		if (!csvUrl) {
			toast.error('Download URL not available');
			return;
		}

		const processingToast = toast.success('Fetching complete dataset...');

		try {
			// Get signed URL if it's an S3 URL
			let fetchUrl = csvUrl;
			if (csvUrl.includes('amazonaws.com') || csvUrl.includes('s3.')) {
				fetchUrl = await createSignedUrlFromS3Url(csvUrl);
			}

			// Fetch complete CSV file
			const rawData = await d3.csv(fetchUrl);

			// Normalize column names to match filter keys (same as useCsvData does)
			if (rawData.length > 0) {
				const originalColumnNames = Object.keys(rawData[0]);

				// Import normalizeColumnNameToKey from table utils
				const { normalizeColumnNameToKey } = await import(
					'@/utils/table.utils'
				);

				const normalizedData = rawData.map((row) => {
					const normalizedRow = {};
					originalColumnNames.forEach((originalKey) => {
						const normalizedKey = normalizeColumnNameToKey(originalKey);
						normalizedRow[normalizedKey] = row[originalKey];
					});
					return normalizedRow;
				});

				const filteringToast = toast.success(
					`Filtering ${normalizedData.length} rows...`,
				);

				// Use worker to filter the normalized data
				filterRows(normalizedData, filters, ({ filtered }) => {
					if (filtered.length === 0) {
						toast.error('No data matches the applied filters');
						return;
					}

					const convertingToast = toast.success(
						`Converting ${filtered.length} rows to CSV...`,
					);

					// Extract only serializable column data for the worker
					const serializableColumns = visibleColumns.map((col) => ({
						accessorKey: col.accessorKey,
					}));

					// Use worker to convert to CSV
					convertToCsv(
						filtered,
						serializableColumns,
						({ csvContent, rowCount, error }) => {
							if (error) {
								toast.error(`Download failed: ${error}`);
								return;
							}

							// Trigger download
							const blob = new Blob([csvContent], {
								type: 'text/csv;charset=utf-8;',
							});
							const link = document.createElement('a');
							const url = URL.createObjectURL(blob);

							link.setAttribute('href', url);
							link.setAttribute(
								'download',
								`data_table_filtered_all.csv`,
							);
							link.style.visibility = 'hidden';
							document.body.appendChild(link);
							link.click();
							document.body.removeChild(link);
							URL.revokeObjectURL(url);

							toast.success(
								`Downloaded ${rowCount} filtered rows successfully`,
							);
						},
					);
				});
			} else {
				toast.error('No data found in the file');
			}
		} catch (error) {
			throw error;
		}
	};

	// Download visible data (already loaded 5MB data)
	const handleDownloadVisibleData = async (dataToDownload) => {
		if (!dataToDownload || dataToDownload.length === 0) {
			toast.error('No data to download');
			return;
		}

		if (visibleColumns.length === 0) {
			toast.error(
				'No visible columns to download. Please select at least one column.',
			);
			return;
		}

		// Extract only serializable column data (accessorKey) for the worker
		const serializableColumns = visibleColumns.map((col) => ({
			accessorKey: col.accessorKey,
		}));

		// Use worker to convert to CSV
		convertToCsv(
			dataToDownload,
			serializableColumns,
			({ csvContent, rowCount, error }) => {
				if (error) {
					toast.error(`Download failed: ${error}`);
					return;
				}

				// Create and trigger download
				const blob = new Blob([csvContent], {
					type: 'text/csv;charset=utf-8;',
				});
				const link = document.createElement('a');
				const url = URL.createObjectURL(blob);

				const isFiltered = dataToDownload === filteredData;
				const filename = isFiltered
					? `data_table_filtered_visible.csv`
					: `data_table_visible.csv`;

				link.setAttribute('href', url);
				link.setAttribute('download', filename);
				link.style.visibility = 'hidden';
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				URL.revokeObjectURL(url);

				toast.success(`Downloaded ${rowCount} rows successfully`);
			},
		);
	};

	const handleDownloadCSV = () => {
		if (isDownloading || !table?.csv_url) return;

		trackEvent(
			EVENTS_ENUM.DASHBOARD_DOWNLOAD_CSV_CLICKED,
			EVENTS_REGISTRY.DASHBOARD_DOWNLOAD_CSV_CLICKED,
			() => ({
				dashboard_id: dashboardId,
				dashboard_name: dashboardName,
				dashboard_content_id: dashboardContentId,
				query_id: queryId,
				query_text: queryText,
			}),
		);
		downloadS3File(table.csv_url);
	};

	// Use filtered rows count for display, but show total count in subtitle
	const displayRows = searchQuery.trim() ? searchFilteredRows : filteredData;
	const recordCount = displayRows.length;

	if (!table || isTableLoading) {
		return (
			<div className="w-full h-full flex items-center justify-center py-8">
				{isTableLoading ? (
					<div className="flex items-center gap-2 text-primary60 text-sm">
						<CircularLoader size="sm" />
						Loading table data...
					</div>
				) : (
					<p className="text-gray-500">No table data available</p>
				)}
			</div>
		);
	}

	if (!tableDataRows.length || !tableColumns.length) {
		return (
			<div className="w-full h-full flex items-center justify-center py-8">
				<p className="text-gray-500">No table data available</p>
			</div>
		);
	}

	return (
		<div className="w-full h-full flex flex-col">
			{/* Header Section */}
			<div className="px-6 py-3 border-b border-[#F3F4F6]">
				<div className="flex items-start justify-between gap-4">
					<div className="flex-1">
						<h2 className="text-xl font-medium text-primary100">
							Comprehensive Data Table
						</h2>
						<p className="text-sm font-normal text-primary80">
							{recordCount} records with complete details
						</p>
					</div>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								className="flex gap-2 items-center text-sm font-medium"
								disabled={isDownloadingCsv || isCsvProcessing}
							>
								<LuDownload className="size-4" />
								{isDownloadingCsv || isCsvProcessing
									? 'Downloading...'
									: 'Download'}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-64">
							<DropdownMenuLabel className="text-xs text-muted-foreground">
								Complete Dataset
							</DropdownMenuLabel>
							<DropdownMenuItem
								onClick={() => handleDownload('all')}
								className="cursor-pointer"
								disabled={isDownloadingCsv || isCsvProcessing}
							>
								<div className="flex flex-col gap-0.5">
									<span className="font-medium">
										Download All Data
									</span>
									<span className="text-xs text-muted-foreground">
										Complete file from server
									</span>
								</div>
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => handleDownload('filtered-all')}
								className="cursor-pointer"
								disabled={
									filters.length === 0 ||
									isDownloadingCsv ||
									isCsvProcessing
								}
							>
								<div className="flex flex-col gap-0.5">
									<span className="font-medium">
										Download Filtered Data
									</span>
									<span className="text-xs text-muted-foreground">
										Complete file with filters applied
									</span>
								</div>
							</DropdownMenuItem>

							<DropdownMenuSeparator />

							<DropdownMenuLabel className="text-xs text-muted-foreground">
								Visible Data (First 5MB)
							</DropdownMenuLabel>
							<DropdownMenuItem
								onClick={() => handleDownload('visible-all')}
								className="cursor-pointer"
								disabled={isDownloadingCsv || isCsvProcessing}
							>
								<div className="flex flex-col gap-0.5">
									<span className="font-medium">
										Download Visible Data
									</span>
									<span className="text-xs text-muted-foreground">
										{tableDataRows.length} rows currently loaded
									</span>
								</div>
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => handleDownload('filtered-visible')}
								className="cursor-pointer"
								disabled={
									filters.length === 0 ||
									isDownloadingCsv ||
									isCsvProcessing
								}
							>
								<div className="flex flex-col gap-0.5">
									<span className="font-medium">
										Download Visible Filtered
									</span>
									<span className="text-xs text-muted-foreground">
										{filteredData?.length || 0} filtered rows
										loaded
									</span>
								</div>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			{/* Search Bar -- this is for future use, do not remove this code */}
			{/* <div className="px-6 py-2">
				<div className="relative">
					<FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
					<Input
						type="text"
						placeholder="Search"
						value={searchQuery}
						onChange={handleSearchChange}
						className="pl-10 pr-4 py-2 border-gray-200 rounded-md bg-white focus:border-[#6A12CD] focus:ring-1 focus:ring-[#6A12CD]"
					/>
				</div>
			</div> */}

			{/* Table */}
			<div className="flex-1 px-6 pb-6 pt-4 h-[calc(100%-9rem)] overflow-auto">
				{/* Partial Data Warning */}
				{isPartialData && (
					<div className="mb-3 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
						<div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
							<span className="text-amber-600 text-xs font-medium">
								!
							</span>
						</div>
						<p className="text-sm text-amber-900">
							Showing partial data (first{' '}
							<span className="font-semibold">5MB</span> of file).
						</p>
					</div>
				)}

				{/* Processing Indicator */}
				{/* {isProcessing && (
				<div className="mb-3 flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
					<CircularLoader size="sm" />
					<p className="text-sm text-blue-900">
						Processing data in background...
					</p>
				</div>
			)} */}

				{/* Filters and Column Visibility Row */}
				<div className="mb-3 flex items-start gap-3 flex-wrap">
					{/* Add Filter Button */}
					<Button
						variant="outline"
						size="sm"
						className="h-8 gap-2 border-[#E5E7EB] hover:bg-purple-50"
						onClick={addFilter}
					>
						<LuPlus className="w-4 h-4" />
						Add Filter
					</Button>

					{/* Column Visibility Control */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className="h-8 gap-2 border-[#E5E7EB] hover:bg-purple-50"
							>
								<LuEye className="w-4 h-4" />
								Columns ({visibleColumns.length}/
								{tableColumns.length})
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start" className="w-56">
							<DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<div className="max-h-[18.75rem] overflow-y-auto">
								{tableColumns.map((column) => (
									<DropdownMenuCheckboxItem
										key={column.accessorKey}
										checked={
											columnVisibility[column.accessorKey] !==
											false
										}
										onCheckedChange={() =>
											toggleColumnVisibility(
												column.accessorKey,
											)
										}
										onSelect={(e) => e.preventDefault()}
									>
										{column.accessorKey
											?.split('_')
											.map(
												(word) =>
													word.charAt(0).toUpperCase() +
													word.slice(1),
											)
											.join(' ')}
									</DropdownMenuCheckboxItem>
								))}
							</div>
						</DropdownMenuContent>
					</DropdownMenu>

					{/* Clear All Button */}
					<Button
						variant="outline"
						size="sm"
						className="h-8 gap-2 border-[#E5E7EB] hover:bg-red-50"
						onClick={clearAllFiltersAndColumns}
						disabled={
							filters.length === 0 &&
							tableColumns.every(
								(col) => columnVisibility[col.accessorKey] !== false,
							)
						}
					>
						<LuFilterX className="w-4 h-4" />
						Clear All
					</Button>
				</div>

				{/* Active Filters */}
				{filters.length > 0 && (
					<div className="mb-3 grid grid-cols-3 gap-3">
						{filters.map((filter, index) => (
							<FilterRow
								key={filter.id}
								filter={filter}
								filterIndex={index}
								columns={tableColumns}
								allFilters={filters}
								getColumnValues={getColumnValues}
								updateFilterColumn={updateFilterColumn}
								toggleFilterValue={toggleFilterValue}
								removeFilter={removeFilter}
							/>
						))}
					</div>
				)}

				<div className="h-[calc(100%-3rem)]">
					<TableComponent
						data={displayRows}
						columns={visibleColumns}
						defaultRowsPerPage={14}
						fitToContainer={true}
						enableColumnFilters={false}
					/>
				</div>
			</div>
		</div>
	);
};

export default DetailedRecordsTab;
