import React from 'react';
import { Button } from '@/components/ui/button';
import { LuTable, LuTrash2 } from 'react-icons/lu';
import TableComponent from '@/components/elements/TableComponent';
import { useTableData } from '@/hooks/useTableData';
import { extractTableUrl } from '../utils/dashboard-table.utils';
import CircularLoader from '@/components/elements/loading/CircularLoader';

/**
 * @param {Object} props
 * @param {Object} props.item - The dashboard content item containing the table
 * @param {boolean} props.isEditModeActive - Whether edit mode is currently active
 * @param {Function} props.onTableClick - Callback when table is clicked (for viewing details)
 * @param {Function} props.onDeleteClick - Callback when delete button is clicked
 * @param {boolean} props.isDeleting - Whether this specific table is being deleted
 */
const DashboardTableCard = ({
	item,
	isEditModeActive,
	onTableClick,
	onDeleteClick,
	isDeleting = false,
}) => {
	const tableData = item?.content?.table;
	const tableTitle = item.content?.title || 'Data Table';

	const {
		data: loadedData,
		columns,
		isLoading,
	} = useTableData(tableData, {
		feature: 'dashboard',
		action: 'load-table-csv-data',
		extra: {
			contentId: item.dashboard_content_id,
		},
	});

	const handleCardClick = (e) => {
		// Don't open modal if clicking delete button
		if (e.target.closest('button[aria-label="Delete table widget"]')) {
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
			</div>

			{isLoading ? (
				<div className="rounded-2xl border-2 w-full border-primary4 p-4 flex items-center justify-center">
					<div className="flex items-center gap-2 text-primary60 text-sm">
						<CircularLoader size="sm" />
						Loading table data...
					</div>
				</div>
			) : (
				<div
					className="w-full custom-scrollbar-graph"
					onClick={(e) => {
						// Stop propagation only for interactive elements to allow table scrolling
						if (e.target.closest('button, input, select, a')) {
							e.stopPropagation();
						}
					}}
				>
					<TableComponent data={loadedData} columns={columns} />
				</div>
			)}
		</div>
	);
};

export default DashboardTableCard;
