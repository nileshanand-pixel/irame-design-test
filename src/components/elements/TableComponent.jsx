import React from 'react';
import { DataTable } from './DataTable';
import { LuTable } from 'react-icons/lu';

/**
 * TableComponent - Wrapper for DataTable with configurable display options
 * @param {Object} props
 * @param {Array} props.data - Table data
 * @param {Array} props.columns - Table columns
 * @param {Function} [props.onSortingChange] - Sorting change callback
 * @param {number} [props.defaultRowsPerPage=10] - Default number of rows per page
 * @param {boolean} [props.fitToContainer=false] - If true, table takes full height of parent container
 * @param {boolean} [props.tablePreview=false] - If true, shows only a preview of the table
 * @param {boolean} [props.enableColumnFilters=false] - If true, enables column filters
 * @param {Object} [props.columnFilters] - Column filters state
 * @param {Function} [props.setColumnFilters] - Column filters setter
 */
const TableComponent = ({
	data,
	columns,
	onSortingChange,
	defaultRowsPerPage = 10,
	fitToContainer = false,
	tablePreview = false,
	enableColumnFilters = false,
	columnFilters = {},
	setColumnFilters,
}) => {
	// Only show error message if no data AND filters are not enabled
	// If filters are enabled, we want to show the table with headers even if data is empty
	if ((!data || !data.length) && !enableColumnFilters) {
		return (
			<div className="rounded-2xl w-full border-2 border-primary4 bg-muted/30 p-6 flex flex-col items-center justify-center text-center gap-2 min-h-[10rem]">
				<LuTable className="w-6 h-6 text-primary mb-2" />
				<p className="text-sm font-semibold text-primary80">
					No table data available
				</p>
				<p className="text-xs text-primary60 max-w-80 mx-auto">
					The table cannot be displayed because the data source is missing
					or invalid.
				</p>
			</div>
		);
	}

	const displayData = tablePreview && data?.length ? data.slice(0, 5) : data || [];
	const hidePagination = tablePreview || (data?.length || 0) <= defaultRowsPerPage;

	return (
		<div
			className={`flex flex-col overflow-hidden rounded-2xl border-2 border-primary4 ${fitToContainer ? 'h-full' : 'max-h-[45rem]'}`}
		>
			<DataTable
				columns={columns}
				data={displayData}
				onSortingChange={onSortingChange}
				defaultRowsPerPage={defaultRowsPerPage}
				hidePagination={hidePagination}
				enableColumnFilters={enableColumnFilters}
				columnFilters={columnFilters}
				setColumnFilters={setColumnFilters}
			/>
		</div>
	);
};

export default TableComponent;
