import React from 'react';
import { DataTable } from './DataTable';

const TableComponent = ({ data, columns }) => {
	if (!data || !data.length) {
		return null; // If data is not available, don't render anything
	}

	return (
		<div className="min-h-fit max-h-[45rem] overflow-auto">
			<DataTable columns={columns} data={data} />
		</div>
	);
};

export default TableComponent;
