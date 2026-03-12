import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
	LuTable,
	LuTrash2,
	LuDownload,
	LuEye,
	LuPlus,
	LuFilterX,
} from 'react-icons/lu';
import TableComponent from '@/components/elements/TableComponent';
import { useTableData } from '@/hooks/useTableData';
import { useTableWorker } from '@/hooks/useTableWorker';
import { useCsvWorker } from '@/hooks/useCsvWorker';
import { extractTableUrl } from '../utils/dashboard-table.utils';
import CircularLoader from '@/components/elements/loading/CircularLoader';
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
import { FilterRow } from './FilterRow';
import { ChevronDown, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as d3 from 'd3';
import { createSignedUrlFromS3Url } from '@/utils/file';

/**
 * @param {Object} props
 * @param {Object} props.item - The dashboard content item containing the table
 * @param {boolean} props.isEditModeActive - Whether edit mode is currently active
 * @param {Function} props.onTableClick - Callback when table is clicked (for viewing details)
 * @param {Function} props.onDeleteClick - Callback when delete button is clicked
 * @param {boolean} props.isDeleting - Whether this specific table is being deleted
 * @param {Array} props.filters - Synced filters from parent
 * @param {Function} props.onFiltersChange - Callback when filters change
 * @param {Object} props.columnVisibility - Synced column visibility from parent
 * @param {Function} props.onColumnVisibilityChange - Callback when column visibility changes
 */
const DashboardTableCard = ({
	item,
	isEditModeActive,
	onTableClick,
	onDeleteClick,
	isDeleting = false,
	filters: externalFilters = [],
	onFiltersChange,
	columnVisibility: externalColumnVisibility = {},
	onColumnVisibilityChange,
}) => {
	const tableData = item?.content?.table;
	const tableTitle = item.content?.title || 'Data Table';
	const [isDataVisible, setIsDataVisible] = useState(false);

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
	const [filteredData, setFilteredData] = useState(null);
	const [isDownloading, setIsDownloading] = useState(false);

	const {
		data: loadedData,
		columns,
		isLoading,
		isPartialData,
	} = useTableData(tableData, {
		feature: 'dashboard',
		action: 'load-table-csv-data',
		csvUrlKey: 'csv_url',
		enabled: isDataVisible,
		fileSizeLimit: 5 * 1024 * 1024, // 5MB limit
		extra: {
			contentId: item.dashboard_content_id,
		},
	});

	// Initialize column visibility when columns load
	useMemo(() => {
		if (
			columns &&
			columns.length > 0 &&
			Object.keys(columnVisibility).length === 0
		) {
			const initialVisibility = {};
			columns.forEach((col) => {
				initialVisibility[col.accessorKey] = true;
			});
			setColumnVisibility(initialVisibility);
		}
	}, [columns, columnVisibility]);

	// Filter visible columns
	const visibleColumns = useMemo(() => {
		if (!columns) return [];
		return columns.filter((col) => columnVisibility[col.accessorKey] !== false);
	}, [columns, columnVisibility]);

	// Use worker to filter rows whenever filters or data change
	useEffect(() => {
		if (!loadedData || filters.length === 0) {
			setFilteredData(loadedData);
			return;
		}

		filterRows(loadedData, filters, ({ filtered }) => {
			setFilteredData(filtered);
		});
	}, [loadedData, filters, filterRows]);

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
		if (!loadedData || !columns || columns.length === 0) return;

		// When filters change, recalculate values for all filter columns
		filters.forEach((filter, filterIndex) => {
			const columnKey = filter.column;
			const cacheKey = `${columnKey}-${filterIndex}`;

			// Skip if already cached
			if (columnValuesCache[cacheKey]) return;

			const previousFilters = filters.slice(0, filterIndex);

			getCascadingValues(
				loadedData,
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
	}, [loadedData, columns, filters, getCascadingValues, columnValuesCache]);

	const addFilter = () => {
		if (!columns || columns.length === 0) return;

		// Get columns that don't have filters yet
		const filteredColumns = filters.map((f) => f.column);
		const availableColumns = columns.filter(
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
		const visibleCount = columns.filter(
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
		if (columns && columns.length > 0) {
			const allVisible = {};
			columns.forEach((col) => {
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
		setIsDownloading(true);

		try {
			if (downloadType === 'all') {
				// Option 1: Download all data from csv_url
				await handleDownloadFromUrl();
			} else if (downloadType === 'visible-all') {
				// Option 2: Download all visible data (5MB)
				await handleDownloadVisibleData(loadedData);
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
			setIsDownloading(false);
		}
	};

	// Download complete file from csv_url
	const handleDownloadFromUrl = async () => {
		const csvUrl = tableData?.csv_url;

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
			link.setAttribute('download', `${tableTitle}_all_data.csv`);
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

		const csvUrl = tableData?.csv_url;

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
								`${tableTitle}_filtered_all.csv`,
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
					? `${tableTitle}_filtered_visible.csv`
					: `${tableTitle}_visible.csv`;

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

	const handleCardClick = (e) => {
		if (e.target.closest('button[aria-label="Delete table widget"]')) {
			return;
		}
		if (e.target.closest('[data-download-menu]')) {
			return;
		}

		if (!onTableClick) {
			return;
		}

		onTableClick(item);
	};

	const handleDelete = (e) => {
		e.stopPropagation();
		if (!onDeleteClick) return;

		const tableUrl = extractTableUrl(item, tableData);
		onDeleteClick(item.dashboard_content_id, tableUrl, 'table');
	};

	if (!tableData) return null;

	return (
		<div
			onClick={handleCardClick}
			className={`col-span-2 bg-white rounded-[0.875rem] p-4 shadow-sm border hover:shadow-md transition-shadow border-[#E2E8F0] relative group w-full min-w-0 cursor-pointer ${
				isDeleting ? 'opacity-60 pointer-events-none' : ''
			}`}
			role="button"
			tabIndex={0}
			onKeyDown={(e) => {
				if ((e.key === 'Enter' || e.key === ' ') && onTableClick) {
					e.preventDefault();
					onTableClick(item);
				}
			}}
		>
			{isEditModeActive && (
				<Button
					onClick={handleDelete}
					variant="outline"
					size="icon"
					disabled={isDeleting}
					className="absolute -top-4 -right-4 w-10 h-10 bg-white shadow-md rounded-lg flex items-center justify-center hover:bg-red-50 transition-all z-10 opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
					title={isDeleting ? 'Deleting...' : 'Delete Widget'}
					type="button"
					aria-label="Delete table widget"
				>
					{isDeleting ? (
						<i className="bi-arrow-clockwise animate-spin text-red-500"></i>
					) : (
						<LuTrash2 className="w-4 h-4 text-red-500" />
					)}
				</Button>
			)}

			<div className="flex items-center gap-2 mb-4">
				<div className="w-9 h-9 bg-white rounded-xl border-2 border-[#E5E7EB] flex items-center justify-center flex-shrink-0">
					<LuTable className="w-4 h-4 text-purple-100" />
				</div>
				<div className="flex-1 min-w-0">
					<h3 className="text-sm font-medium text-[#26064A] truncate">
						{tableTitle}
					</h3>
				</div>
				<Button
					variant="ghost"
					size="sm"
					onClick={(e) => {
						e.stopPropagation();
						setIsDataVisible(!isDataVisible);
					}}
					className="hover:border hover:border-[#6A12CD] hover:text-[#6A12CD] !bg-transparent flex gap-2"
				>
					<span>{isDataVisible ? 'Hide Data' : 'View Data'}</span>
					<ChevronDown
						className={cn(
							isDataVisible ? 'rotate-180' : '',
							'size-5 text-[#6A12CD]',
						)}
					/>
				</Button>
			</div>

			{isDataVisible &&
				(isLoading ? (
					<div className="rounded-2xl border-2 w-full border-primary4 p-4 flex items-center justify-center">
						<div className="flex items-center gap-2 text-primary60 text-sm">
							<CircularLoader size="sm" />
							Loading table data...
						</div>
					</div>
				) : loadedData && loadedData.length > 0 ? (
					<>
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
									<span className="font-semibold">5MB</span> of
									file).
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

						<div className="flex justify-between">
							{/* Filters and Column Visibility Row */}
							<div className="mb-3 flex items-start gap-3 flex-wrap">
								{/* Add Filter Button */}
								<Button
									variant="outline"
									size="sm"
									className="h-8 gap-2 border-[#E5E7EB] hover:bg-purple-50"
									onClick={(e) => {
										e.stopPropagation();
										addFilter();
									}}
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
											onClick={(e) => e.stopPropagation()}
										>
											<LuEye className="w-4 h-4" />
											Columns ({visibleColumns.length}/
											{columns.length})
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent
										align="start"
										className="w-56"
										onClick={(e) => e.stopPropagation()}
									>
										<DropdownMenuLabel>
											Toggle Columns
										</DropdownMenuLabel>
										<DropdownMenuSeparator />
										<div className="max-h-[18.75rem] overflow-y-auto">
											{columns.map((column) => (
												<DropdownMenuCheckboxItem
													key={column.accessorKey}
													checked={
														columnVisibility[
															column.accessorKey
														] !== false
													}
													onCheckedChange={() =>
														toggleColumnVisibility(
															column.accessorKey,
														)
													}
													onSelect={(e) =>
														e.preventDefault()
													}
												>
													{column.accessorKey
														?.split('_')
														.map(
															(word) =>
																word
																	.charAt(0)
																	.toUpperCase() +
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
									onClick={(e) => {
										e.stopPropagation();
										clearAllFiltersAndColumns();
									}}
									disabled={
										filters.length === 0 &&
										columns.every(
											(col) =>
												columnVisibility[col.accessorKey] !==
												false,
										)
									}
								>
									<LuFilterX className="w-4 h-4" />
									Clear All
								</Button>
							</div>

							{!isLoading && loadedData && loadedData.length > 0 && (
								<div
									data-download-menu
									onClick={(e) => e.stopPropagation()}
								>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="outline"
												size="sm"
												className="h-8 gap-2 border-[#E5E7EB] hover:bg-purple-50"
												disabled={
													isDownloading || isCsvProcessing
												}
											>
												<LuDownload className="w-4 h-4" />
												{isDownloading || isCsvProcessing
													? 'Downloading...'
													: 'Download'}
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent
											align="end"
											className="w-64"
										>
											<DropdownMenuLabel className="text-xs text-muted-foreground">
												Complete Dataset
											</DropdownMenuLabel>
											<DropdownMenuItem
												onClick={(e) => {
													e.stopPropagation();
													handleDownload('all');
												}}
												className="cursor-pointer"
												disabled={
													isDownloading || isCsvProcessing
												}
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
												onClick={(e) => {
													e.stopPropagation();
													handleDownload('filtered-all');
												}}
												className="cursor-pointer"
												disabled={
													filters.length === 0 ||
													isDownloading ||
													isCsvProcessing
												}
											>
												<div className="flex flex-col gap-0.5">
													<span className="font-medium">
														Download Filtered Data
													</span>
													<span className="text-xs text-muted-foreground">
														Complete file with filters
														applied
													</span>
												</div>
											</DropdownMenuItem>

											<DropdownMenuSeparator />

											<DropdownMenuLabel className="text-xs text-muted-foreground">
												Visible Data (First 5MB)
											</DropdownMenuLabel>
											<DropdownMenuItem
												onClick={(e) => {
													e.stopPropagation();
													handleDownload('visible-all');
												}}
												className="cursor-pointer"
												disabled={
													isDownloading || isCsvProcessing
												}
											>
												<div className="flex flex-col gap-0.5">
													<span className="font-medium">
														Download Visible Data
													</span>
													<span className="text-xs text-muted-foreground">
														{loadedData.length} rows
														currently loaded
													</span>
												</div>
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={(e) => {
													e.stopPropagation();
													handleDownload(
														'filtered-visible',
													);
												}}
												className="cursor-pointer"
												disabled={
													filters.length === 0 ||
													isDownloading ||
													isCsvProcessing
												}
											>
												<div className="flex flex-col gap-0.5">
													<span className="font-medium">
														Download Visible Filtered
													</span>
													<span className="text-xs text-muted-foreground">
														{filteredData?.length || 0}{' '}
														filtered rows loaded
													</span>
												</div>
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							)}
						</div>

						{/* Active Filters */}
						{filters.length > 0 && (
							<div className="mb-3 grid grid-cols-3 gap-3">
								{filters.map((filter, index) => (
									<FilterRow
										key={filter.id}
										filter={filter}
										filterIndex={index}
										columns={columns}
										allFilters={filters}
										getColumnValues={getColumnValues}
										updateFilterColumn={updateFilterColumn}
										toggleFilterValue={toggleFilterValue}
										removeFilter={removeFilter}
									/>
								))}
							</div>
						)}

						<div
							className="w-full custom-scrollbar-graph"
							onClick={(e) => {
								if (e.target.closest('button, input, select, a')) {
									e.stopPropagation();
								}
							}}
						>
							<TableComponent
								data={filteredData || loadedData}
								columns={visibleColumns}
								enableColumnFilters={false}
							/>
						</div>
					</>
				) : (
					<div className="rounded-2xl border-2 w-full border-gray-200 p-8 flex items-center justify-center">
						<p className="text-sm text-gray-500">
							No table data available
						</p>
					</div>
				))}
		</div>
	);
};

export default DashboardTableCard;
