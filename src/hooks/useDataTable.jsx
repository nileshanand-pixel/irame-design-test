import SortingFixFeature from '@/lib/react-table';
import {
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table';

export const useDataTable = ({
	data,
	columns,
	totalCount = 0,
	isServerSide = false,
	enableRowSelection = false,
	pagination,
	setPagination,
	sorting,
	setSorting,
	rowSelection,
	setRowSelection,
	defaultSort,
	onSortingChange = () => {},
}) => {
	const config = {
		data,
		columns,
		...(isServerSide
			? {
					pageCount: Math.ceil(totalCount / pagination?.pageSize || 1),
					state: {
						pagination,
						sorting,
					},
					onPaginationChange: setPagination,
					onSortingChange: setSorting,
				}
			: {}),
		enableRowSelection,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		manualPagination: isServerSide,
		manualSorting: isServerSide,
		manualFiltering: isServerSide,
		...(defaultSort
			? {
					initialState: {
						sorting: defaultSort,
					},
				}
			: {}),
		onSortingChange: onSortingChange,
		_features: [SortingFixFeature],
	};

	if (enableRowSelection) {
		if (!config.state) config.state = {};
		config.state.rowSelection = rowSelection;
		config.onRowSelectionChange = setRowSelection;
	}

	const table = useReactTable(config);
	return { table };
};
