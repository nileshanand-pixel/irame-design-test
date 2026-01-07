import { useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import logsEmpty from '@/assets/icons/empty-logs.svg';
import EmptyState from '../empty-state';
import LogsFilters from './LogsFilters';
import LogsTable from './LogsTable';
import LogDetailsDrawer from './LogDetailsDrawer';
import { activityLogService } from '@/api/gatekeeper/activityLog.service';
import { useActivityLogs } from '@/hooks/use-activity-logs';
import { useDebounce } from '@/hooks/use-debounce';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { getLast7DaysRange, areDateRangesEqual } from '@/utils/dateRangeUtils';

const EMPTY_STATE_CONFIG = {
	image: logsEmpty,
	heading: 'No Activity Logged Yet',
	descriptionLines: [
		'This section will show a chronological record of all user',
		'actions, system events, and data changes once they occur.',
	],
	cta: null,
	ctaText: null,
};

const DEFAULT_PAGINATION = {
	pageIndex: 0,
	pageSize: 8,
};

export default function LogsTabContent() {
	// Filter states
	const [searchTerm, setSearchTerm] = useState('');
	const debouncedSearch = useDebounce(searchTerm, 500);
	const [categoryFilter, setCategoryFilter] = useState('all');
	const [actionTypeFilter, setActionTypeFilter] = useState('all');
	const [dateRange, setDateRange] = useState(getLast7DaysRange());
	const [pagination, setPagination] = useState(DEFAULT_PAGINATION);

	// Details drawer state
	const [selectedLogId, setSelectedLogId] = useState(null);
	const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);

	// Build query parameters
	const queryParams = useMemo(() => {
		const params = {
			page: pagination.pageIndex,
			limit: pagination.pageSize,
		};

		if (debouncedSearch.trim()) {
			params.actorName = debouncedSearch.trim();
		}
		if (actionTypeFilter && actionTypeFilter !== 'all') {
			params.actionType = actionTypeFilter;
		}
		if (categoryFilter && categoryFilter !== 'all') {
			params.category = categoryFilter;
		}
		if (dateRange && dateRange.startDate) {
			params.startDate = dateRange.startDate;
		}
		if (dateRange && dateRange.endDate) {
			params.endDate = dateRange.endDate;
		}

		return params;
	}, [
		pagination.pageIndex,
		pagination.pageSize,
		debouncedSearch,
		actionTypeFilter,
		categoryFilter,
		dateRange,
	]);

	// Fetch activity logs using React Query
	const { data, isLoading, isFetching } = useActivityLogs(queryParams, {
		onError: (error) => {
			console.error('Failed to fetch activity logs:', error);
			toast.error('Failed to load activity logs');
		},
	});

	const logs = useMemo(() => {
		if (!data?.success || !data?.data) {
			return { data: [], pagination: { total: 0, totalPages: 0 } };
		}
		return { data: data.data, pagination: data.pagination };
	}, [data]);

	const isSearching = searchTerm !== debouncedSearch;

	// Check if any filters are active
	const hasActiveFilters = useMemo(() => {
		const defaultRange = getLast7DaysRange();
		// Determine if a date filter is actually applied (both start & end present)
		const dateFilterApplied =
			dateRange && dateRange.startDate && dateRange.endDate;
		const isDefaultDate = dateFilterApplied
			? areDateRangesEqual(dateRange, defaultRange)
			: false;

		return (
			searchTerm !== '' ||
			categoryFilter !== 'all' ||
			actionTypeFilter !== 'all' ||
			(dateFilterApplied && !isDefaultDate)
		);
	}, [searchTerm, categoryFilter, actionTypeFilter, dateRange]);

	// Handle filter changes
	const handleSearchChange = (e) => {
		setSearchTerm(e.target.value);
		setPagination(DEFAULT_PAGINATION);
	};

	const handleCategoryChange = (value) => {
		setCategoryFilter(value);
		setActionTypeFilter('all'); // Reset action type when category changes
		setPagination(DEFAULT_PAGINATION);
	};

	const handleActionTypeChange = (value) => {
		setActionTypeFilter(value);
		setPagination(DEFAULT_PAGINATION);
	};

	const handleDateRangeChange = (range) => {
		setDateRange(range);
		setPagination(DEFAULT_PAGINATION);
	};

	const handleDateRangeClear = () => {
		// Clear selection -> no date filter (null start/end)
		setDateRange({ startDate: null, endDate: null });
		setPagination(DEFAULT_PAGINATION);
	};

	const handleClearFilters = () => {
		setSearchTerm('');
		setCategoryFilter('all');
		setActionTypeFilter('all');
		// Clear all filters: remove explicit date filtering
		const defaultRange = getLast7DaysRange();

		const dateFilterApplied =
			dateRange && dateRange.startDate && dateRange.endDate;
		const isDefaultDate = dateFilterApplied
			? areDateRangesEqual(dateRange, defaultRange)
			: false;
		if (!isDefaultDate && dateFilterApplied) {
			setDateRange(defaultRange);
		}
		setPagination(DEFAULT_PAGINATION);
	};

	// Handle export
	const handleExport = async () => {
		try {
			const exportParams = { ...queryParams };
			delete exportParams.page;
			delete exportParams.limit;

			// Apply default date range (1 month) if not set
			if (!exportParams.startDate && !exportParams.endDate) {
				const now = dayjs();
				exportParams.endDate = now.toISOString();
				exportParams.startDate = now.subtract(1, 'month').toISOString();
			}

			await activityLogService.exportActivityLogs(exportParams);
			toast.success('Activity logs exported successfully');
		} catch (error) {
			console.error('Export failed:', error);
			toast.error('Failed to export activity logs');
		}
	};

	// Handle view details
	const handleViewDetails = (logId) => {
		setSelectedLogId(logId);
		setIsDetailsDrawerOpen(true);
	};

	// Show loading state on initial load
	if (isLoading && logs.data.length === 0) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="h-8 w-8 animate-spin text-[#26064A]" />
			</div>
		);
	}

	// Show empty state ONLY when no logs, no filters, AND not loading
	if (logs.data.length === 0 && !hasActiveFilters && !isLoading && !isFetching) {
		return <EmptyState config={EMPTY_STATE_CONFIG} />;
	}

	return (
		<div className="w-full h-full flex flex-col">
			{/* Filters */}
			<div className="mb-5">
				<LogsFilters
					searchTerm={searchTerm}
					onSearchChange={handleSearchChange}
					categoryFilter={categoryFilter}
					onCategoryChange={handleCategoryChange}
					actionTypeFilter={actionTypeFilter}
					onActionTypeChange={handleActionTypeChange}
					dateRange={dateRange}
					onDateRangeChange={handleDateRangeChange}
					onDateRangeClear={handleDateRangeClear}
					hasActiveFilters={hasActiveFilters}
					onClearFilters={handleClearFilters}
					onExport={handleExport}
					isExporting={isFetching}
				/>
			</div>

			{/* Always show table - shows "no results" message when appropriate */}
			<div className="flex-1 min-h-0">
				<LogsTable
					logs={logs}
					pagination={pagination}
					onPaginationChange={setPagination}
					isLoading={isFetching || isSearching}
					hasActiveFilters={hasActiveFilters}
					onClearFilters={handleClearFilters}
					onViewDetails={handleViewDetails}
				/>
			</div>

			{/* Details Drawer */}
			{isDetailsDrawerOpen && (
				<LogDetailsDrawer
					open={isDetailsDrawerOpen}
					setOpen={setIsDetailsDrawerOpen}
					logId={selectedLogId}
				/>
			)}
		</div>
	);
}
