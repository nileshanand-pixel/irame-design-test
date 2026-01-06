import { DataTable } from '@/components/elements/DataTable';
import { Eye } from 'lucide-react';
import {
	formatActionType,
	generateDescription,
} from '@/constants/activityLogActionTypes';
import { formatTimestamp } from '@/utils/dateRangeUtils';

/**
 * Column definitions for the logs table
 */
const getColumns = (onViewDetails) => [
	{
		accessorKey: 'occurred_at',
		header: 'Time Stamp',
		cell: ({ row }) => {
			const timestamp = row.original.occurred_at || row.original.created_at;
			if (!timestamp) return null;

			const { date, time } = formatTimestamp(timestamp);

			return (
				<div className="flex flex-col">
					<span className="text-[#26064A] font-medium text-sm">
						{date}
					</span>
					<span className="text-[#26064A99] text-xs">{time}</span>
				</div>
			);
		},
	},
	{
		accessorKey: 'action_type',
		header: 'Actions',
		cell: ({ row }) => {
			const eventKey = row.original.event_type_key || row.original.action_type;
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
						: 'N/A');

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
					{category || 'N/A'}
				</span>
			);
		},
	},
	{
		accessorKey: 'details',
		header: 'Description',
		cell: ({ row }) => {
			const description = generateDescription(row.original);

			return (
				<div className="flex items-center gap-2 max-w-xs">
					<span className="text-[#26064A99] text-xs line-clamp-2">
						{description}
					</span>
					<button
						onClick={(e) => {
							e.stopPropagation();
							onViewDetails(row.original.id);
						}}
						className=" hover:text-[#26064A] flex-shrink-0 ml-auto transition-colors"
						title="View details"
					>
						<Eye className="h-4 w-4" />
					</button>
				</div>
			);
		},
	},
];

export default function LogsTable({
	logs,
	pagination,
	onPaginationChange,
	isLoading,
	hasActiveFilters = false,
	onClearFilters = () => {},
	onViewDetails = () => {},
}) {
	const totalCount = logs.pagination?.total || 0;
	const totalPages = logs.pagination?.totalPages || 0;
	const data = logs.data || [];

	return (
		<div className="flex relative flex-col h-full gap-5">
			{/* Data Table */}
			<div className="flex-1 flex flex-col min-h-0">
				<div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex-1 flex flex-col">
					<DataTable
						data={data}
						columns={getColumns(onViewDetails)}
						totalCount={totalCount}
						pagination={pagination}
						setPagination={onPaginationChange}
						isServerSide={true}
						simplePagination={true}
						isLoading={isLoading}
					/>
				</div>

				{/* Pagination Info & Empty State Message */}
				{data.length > 0 && (
					<div className="flex items-center justify-between mt-3 flex-shrink-0">
						<p className="text-sm text-gray-500">
							Showing {data.length} of {totalCount} logs
							{totalPages > 1 &&
								` (Page ${pagination.pageIndex + 1} of ${totalPages})`}
						</p>
					</div>
				)}

				{/* Empty State Message */}
				{data.length === 0 && hasActiveFilters && (
					<div className="flex absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 items-center justify-center">
						<div className="text-center py-6">
							<p className="text-gray-500 mb-3 text-sm">
								No activity logs found matching your filters.
							</p>
							<button
								onClick={onClearFilters}
								className="text-sm text-[#26064A] font-medium hover:underline"
							>
								Clear all filters
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
