import React from 'react';
import { DataTable } from './DataTable';

/**
 * TableComponent - Wrapper for DataTable with configurable display options
 * @param {Object} props
 * @param {Array} props.data - Table data
 * @param {Array} props.columns - Table columns
 * @param {Function} [props.onSortingChange] - Sorting change callback
 * @param {number} [props.defaultRowsPerPage=10] - Default number of rows per page
 * @param {boolean} [props.fitToContainer=false] - If true, table takes full height of parent container
 */
const TableComponent = ({
	data,
	columns,
	onSortingChange,
	defaultRowsPerPage = 10,
	fitToContainer = false,
}) => {
	if (!data || !data.length) {
		return null; // If data is not available, don't render anything
	}

	return (
		<div
			className={`flex flex-col overflow-auto rounded-2xl border border-primary4 ${fitToContainer ? 'h-full' : 'max-h-[45rem]'}`}
		>
			<DataTable
				columns={columns}
				data={data}
				onSortingChange={onSortingChange}
				defaultRowsPerPage={defaultRowsPerPage}
			/>
		</div>
	);
};

export default TableComponent;
