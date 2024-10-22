import React from 'react';

const RowLoader = () => {
	return (
		<div className="h-4 w-full flex gap-2">
			<div className="w-1/6 !bg-purple-8 rounded-md"></div>
			<div className=" w-1/6 !bg-purple-8 rounded-md"></div>
			<div className=" w-1/6 !bg-purple-8 rounded-md"></div>
			<div className=" w-1/6 !bg-purple-8 rounded-md"></div>
			<div className=" w-1/6 !bg-purple-8 rounded-md"></div>
			<div className=" w-1/6 !bg-purple-8 rounded-md"></div>
		</div>
	);
};
const TableLoader = () => {
	return (
		<div className="mt-10 space-y-2">
			<div className="mt-10 h-8 w-full !bg-purple-8 rounded-md"></div>

			<RowLoader />
			<RowLoader />
			<RowLoader />
			<RowLoader />
			<RowLoader />
			<RowLoader />
		</div>
	);
};

export default TableLoader;
