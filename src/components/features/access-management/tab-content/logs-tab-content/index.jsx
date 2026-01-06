import { useState, useMemo } from 'react';
import { DataTable } from '@/components/elements/DataTable';
import logsEmpty from '@/assets/icons/empty-logs.svg';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Download, Loader2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import EmptyState from '../empty-state';
import SearchBar from '../../search-bar';
import DateRangePicker from '@/components/elements/DateRangePicker';
import { activityLogService } from '@/api/gatekeeper/activityLog.service';
import { useActivityLogs } from '@/hooks/use-activity-logs';
import { useDebounce } from '@/hooks/use-debounce';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import {
	ACTION_TYPE_OPTIONS,
	CATEGORY_OPTIONS,
	getActionTypesByCategory,
	formatActionType,
	generateDescription,
} from '@/constants/activityLogActionTypes';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';

dayjs.extend(utc);
dayjs.extend(timezone);

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

// Helper function to get UTC date range for "today" in user's timezone
const getTodayUTCRange = () => {
	const userTz = dayjs.tz.guess();
	const now = dayjs().tz(userTz);

	// Start of today in user's timezone, converted to UTC
	const startOfToday = now.clone().startOf('day').tz('UTC').toISOString();

	// Current time in UTC
	const currentTime = dayjs.utc().toISOString();

	return {
		startDate: startOfToday,
		endDate: currentTime,
	};
};

// Helper function to get UTC date range for "yesterday" in user's timezone
const getYesterdayUTCRange = () => {
	const userTz = dayjs.tz.guess();
	const yesterday = dayjs().tz(userTz).subtract(1, 'day');

	// Start of yesterday in user's timezone, converted to UTC
	const startOfYesterday = yesterday
		.clone()
		.startOf('day')
		.tz('UTC')
		.toISOString();

	// End of yesterday in user's timezone, converted to UTC
	const endOfYesterday = yesterday.clone().endOf('day').tz('UTC').toISOString();

	return {
		startDate: startOfYesterday,
		endDate: endOfYesterday,
	};
};

// Helper function for default 7-day range
const getLast7DaysRange = () => ({
	startDate: dayjs().subtract(7, 'day').startOf('day').toISOString(),
	endDate: dayjs().endOf('day').toISOString(),
});

export default function LogsTabContent() {
	// Filter states
	const [searchTerm, setSearchTerm] = useState('');
	const debouncedSearch = useDebounce(searchTerm, 500);
	const [categoryFilter, setCategoryFilter] = useState('all');
	const [actionTypeFilter, setActionTypeFilter] = useState('all');
	const [dateRange, setDateRange] = useState(getLast7DaysRange);
	const [pagination, setPagination] = useState({
		pageIndex: 0,
		pageSize: 10,
	});

	// A key to force reset components when filters are cleared
	const [filterResetKey, setFilterResetKey] = useState(0);

	// Get filtered action types based on category
	const availableActionTypes = useMemo(() => {
		return getActionTypesByCategory(categoryFilter);
	}, [categoryFilter]);

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
		if (dateRange.startDate) {
			params.startDate = dateRange.startDate;
		}
		if (dateRange.endDate) {
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
	const { data, isLoading, isFetching, refetch } = useActivityLogs(queryParams, {
		onError: (error) => {
			console.error('Failed to fetch activity logs:', error);
			toast.error('Failed to load activity logs');
		},
	});

	const logs = useMemo(() => {
		if (!data?.success || !data?.data) return [];
		return data.data;
	}, [data]);

	const totalCount = data?.pagination?.total || 0;
	const totalPages = data?.pagination?.totalPages || 0;

	const isSearching = searchTerm !== debouncedSearch;

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

	// Reset filters
	const handleClearFilters = () => {
		setSearchTerm('');
		setCategoryFilter('all');
		setActionTypeFilter('all');
		setDateRange(getLast7DaysRange());
		setPagination({ ...pagination, pageIndex: 0 });
		setFilterResetKey((prev) => prev + 1);
	};

	// Check if any filters are active
	const hasActiveFilters = useMemo(() => {
		const defaultRange = getLast7DaysRange();
		// Compare dates by day to ignore time differences in ISO strings
		const isDefaultDate =
			dayjs(dateRange.startDate).isSame(defaultRange.startDate, 'day') &&
			dayjs(dateRange.endDate).isSame(defaultRange.endDate, 'day');

		return (
			searchTerm !== '' ||
			categoryFilter !== 'all' ||
			actionTypeFilter !== 'all' ||
			!isDefaultDate
		);
	}, [searchTerm, categoryFilter, actionTypeFilter, dateRange]);

	const columns = useMemo(
		() => [
			{
				accessorKey: 'occurred_at',
				header: 'Time Stamp',
				cell: ({ row }) => {
					const timestamp =
						row.original.occurred_at || row.original.created_at;
					if (!timestamp) return null;

					const userTz = dayjs.tz.guess();

					return (
						<div className="flex flex-col">
							<span className="text-[#26064A] font-medium text-sm">
								{dayjs
									.utc(timestamp)
									.tz(userTz)
									.format('DD-MM-YYYY')}
							</span>
							<span className="text-[#26064A99] text-xs">
								{dayjs.utc(timestamp).tz(userTz).format('hh:mm A')}
							</span>
						</div>
					);
				},
			},
			{
				accessorKey: 'action_type',
				header: 'Actions',
				cell: ({ row }) => {
					const eventKey =
						row.original.event_type_key || row.original.action_type;
					const readable = formatActionType(eventKey);
					return (
						<span className="text-[#00000099] text-sm font-medium">
							{readable}
						</span>
					);
				},
			},
			{
				accessorKey: 'actor_name',
				header: 'Action By',
				cell: ({ row }) => {
					const actorName = row.original.actor_name;
					const actorType = row.original.actor_type;

					// Show actor name if available, otherwise show actor type (System, Service, etc.)
					const displayName =
						actorName ||
						(actorType === 'system'
							? 'System'
							: actorType === 'service'
								? 'Service'
								: 'Unknown');

					return (
						<span className="text-[#00000099] text-sm font-medium">
							{displayName}
						</span>
					);
				},
			},
			{
				accessorKey: 'category',
				header: 'Category',
				cell: ({ row }) => {
					const category = row.original.category;
					return (
						<span className="text-[#00000099] text-sm font-medium capitalize">
							{category || '-'}
						</span>
					);
				},
			},
			{
				accessorKey: 'details',
				header: 'Description',
				cell: ({ row }) => {
					const description = generateDescription(row.original);
					const hasRawDetails =
						row.original.details || row.original.action_metadata;

					return (
						<div className="flex items-center gap-2 max-w-xs">
							<span className="text-[#26064A99] text-xs line-clamp-2">
								{description}
							</span>
							{hasRawDetails && (
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<button className="text-gray-400 hover:text-gray-600 flex-shrink-0">
												<Info className="h-3.5 w-3.5" />
											</button>
										</TooltipTrigger>
										<TooltipContent className="max-w-md p-3 bg-gray-900 text-white text-xs">
											<pre className="whitespace-pre-wrap break-words">
												{JSON.stringify(
													hasRawDetails,
													null,
													2,
												)}
											</pre>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							)}
						</div>
					);
				},
			},
		],
		[],
	);

	return (
		<div className="w-full h-full flex flex-col">
			{/* Search and Filters - Always visible if there are logs or filters active */}
			{!(logs.length === 0 && !hasActiveFilters && !isLoading) && (
				<div className="flex flex-col gap-4 flex-shrink-0 mb-5">
					<div className="w-full max-w-md">
						<SearchBar
							key={`search-${filterResetKey}`}
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							placeholder="Search by user name..."
						/>
					</div>

					<div className="flex flex-wrap items-center gap-3">
						<Select
							value={categoryFilter}
							onValueChange={(value) => {
								setCategoryFilter(value);
								setActionTypeFilter('all');
								setPagination({
									...pagination,
									pageIndex: 0,
								});
							}}
						>
							<SelectTrigger
								className={cn(
									'w-[180px]',
									categoryFilter === 'all' &&
										'text-muted-foreground',
								)}
							>
								<SelectValue placeholder="All Categories" />
							</SelectTrigger>
							<SelectContent>
								{CATEGORY_OPTIONS.map((option) => (
									<SelectItem
										key={option.value}
										value={option.value}
									>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Select
							value={actionTypeFilter}
							onValueChange={(value) => {
								setActionTypeFilter(value);
								setPagination({
									...pagination,
									pageIndex: 0,
								});
							}}
						>
							<SelectTrigger
								className={cn(
									'w-[180px]',
									actionTypeFilter === 'all' &&
										'text-muted-foreground',
								)}
							>
								<SelectValue placeholder="All Actions" />
							</SelectTrigger>
							<SelectContent>
								{availableActionTypes.map((option) => (
									<SelectItem
										key={option.value}
										value={option.value}
									>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<DateRangePicker
							key={`date-${filterResetKey}`}
							predefinedOptions={[
								{
									key: 'last_7_days',
									label: 'Last 7 Days',
									startDate: dayjs()
										.subtract(7, 'day')
										.startOf('day')
										.toISOString(),
									endDate: dayjs().endOf('day').toISOString(),
								},
								{
									key: 'today',
									label: 'Today',
									...getTodayUTCRange(),
								},
								{
									key: 'yesterday',
									label: 'Yesterday',
									...getYesterdayUTCRange(),
								},
								{
									key: 'last_30_days',
									label: 'Last 30 Days',
									startDate: dayjs()
										.subtract(30, 'day')
										.startOf('day')
										.toISOString(),
									endDate: dayjs().endOf('day').toISOString(),
								},
								{
									key: 'last_90_days',
									label: 'Last 90 Days',
									startDate: dayjs()
										.subtract(90, 'day')
										.startOf('day')
										.toISOString(),
									endDate: dayjs().endOf('day').toISOString(),
								},
							]}
							onChange={(range) => {
								setDateRange(range);
								setPagination({
									...pagination,
									pageIndex: 0,
								});
							}}
							onClear={() => {
								setDateRange(getLast7DaysRange());
								setPagination({
									...pagination,
									pageIndex: 0,
								});
								setFilterResetKey((prev) => prev + 1);
							}}
						/>

						{hasActiveFilters && (
							<button
								onClick={handleClearFilters}
								className={cn(
									'text-sm text-gray-500 hover:text-gray-700',
									'underline-offset-2 hover:underline',
								)}
							>
								Clear Filters
							</button>
						)}

						<button
							onClick={handleExport}
							disabled={isLoading && logs.length > 0}
							className={cn(
								'inline-flex items-center gap-2 px-4 py-2',
								'text-[#26064A] text-sm font-medium',
								'border border-gray-200 rounded-md',
								'hover:bg-gray-50 transition-colors',
								(isLoading || (isFetching && logs.length > 0)) &&
									'opacity-50 cursor-not-allowed',
							)}
						>
							{(isFetching && logs.length > 0) ||
							(isLoading && logs.length > 0) ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Download className="h-4 w-4" />
							)}
							Export
						</button>
					</div>
				</div>
			)}

			<div className="flex-1 min-h-0">
				{isLoading && logs.length === 0 ? (
					<div className="flex items-center justify-center h-64">
						<Loader2 className="h-8 w-8 animate-spin text-[#26064A]" />
					</div>
				) : logs.length === 0 && !hasActiveFilters ? (
					<EmptyState config={EMPTY_STATE_CONFIG} />
				) : (
					<div className="flex flex-col h-full gap-5">
						{/* Data Table with Pagination */}
						<div className="flex-1 flex flex-col min-h-0">
							<div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex-1 flex flex-col">
								<DataTable
									data={logs}
									columns={columns}
									totalCount={totalCount}
									pagination={pagination}
									setPagination={setPagination}
									isServerSide={true}
									simplePagination={true}
									isLoading={
										isLoading || isFetching || isSearching
									}
								/>
							</div>

							{/* Results Count and Pagination Info - Bottom */}
							{logs.length > 0 && (
								<div className="flex items-center justify-between mt-3 flex-shrink-0">
									<p className="text-sm text-gray-500">
										Showing {logs.length} of {totalCount} logs
										{totalPages > 1 &&
											` (Page ${pagination.pageIndex + 1} of ${totalPages})`}
									</p>
								</div>
							)}
						</div>

						{/* Empty State for No Search Results */}
						{logs.length === 0 && hasActiveFilters && (
							<div className="text-center py-8">
								<p className="text-gray-500">
									No activity logs found matching your filters.
								</p>
								<button
									onClick={handleClearFilters}
									className="mt-2 text-sm text-[#26064A] font-medium hover:underline"
								>
									Clear all filters
								</button>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
