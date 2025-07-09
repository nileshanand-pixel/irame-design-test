import React from 'react';
import { DataTable } from './DataTable';

const TableComponent = ({ data, columns, onSortingChange }) => {
	if (!data || !data.length) {
		return null; // If data is not available, don't render anything
	}

	return (
		<div className="flex flex-col h-[45rem] overflow-auto">
			<DataTable columns={columns} data={data} onSortingChange={onSortingChange}/>
		</div>
	);
};

export default TableComponent;
