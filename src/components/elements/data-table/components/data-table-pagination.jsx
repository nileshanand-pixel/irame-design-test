import React, { useMemo } from 'react';
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	DoubleArrowLeftIcon,
	DoubleArrowRightIcon,
} from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

/**
 * @typedef {Object} DataTablePaginationProps
 * @property {Object} table - The table instance from react-table.
 * @property {number[]} [pageSizeOptions] - The available options for page sizes.
 */

/**
 * DataTablePagination component
 * @param {DataTablePaginationProps} props
 */
export function DataTablePagination({
	table,
	pageSizeOptions = [10, 20, 30, 40, 50],
	defaultRowsPerPage,
}) {
	const newPageSizeOptions = useMemo(() => {
		if (!pageSizeOptions.includes(defaultRowsPerPage)) {
			return [defaultRowsPerPage, ...pageSizeOptions].sort((a, b) => a - b);
		}
		return pageSizeOptions;
	}, [pageSizeOptions, defaultRowsPerPage]);

	return (
		<div className="flex w-full items-center justify-end overflow-auto px-2 py-1 flex-row gap-8">
			{/* <div className="flex-1 whitespace-nowrap text-sm text-muted-foreground">
				{table.getFilteredSelectedRowModel().rows.length} of{' '}
				{table.getFilteredRowModel().rows.length} row(s) selected.
			</div> */}
			<div className="flex items-center flex-row w-full justify-between text-xs font-normal textprimary80">
				<div className="flex items-center space-x-2">
					<p className="whitespace-nowrap">Rows per page :</p>
					<Select
						value={`${table.getState().pagination.pageSize}`}
						onValueChange={(value) => {
							table.setPageSize(Number(value));
						}}
					>
						<SelectTrigger className="h-8 w-16 text-xs font-normal textprimary80">
							<SelectValue
								placeholder={table.getState().pagination.pageSize}
							/>
						</SelectTrigger>
						<SelectContent
							side="top"
							className="text-xs font-normal textprimary80"
						>
							{newPageSizeOptions.map((pageSize) => (
								<SelectItem
									key={pageSize}
									value={`${pageSize}`}
									className="text-xs font-normal textprimary80 hover:bg-purple-2"
								>
									<span>{pageSize}</span>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex items-center space-x-2">
					<div className="flex items-center justify-center">
						Page {table.getState().pagination.pageIndex + 1} of{' '}
						{table.getPageCount()}
					</div>
					<div className="flex items-center space-x-2">
						<Button
							aria-label="Go to first page"
							variant="outline"
							className="hidden size-8 p-0 lg:flex"
							onClick={() => table.setPageIndex(0)}
							disabled={!table.getCanPreviousPage()}
						>
							<DoubleArrowLeftIcon
								className="size-4"
								aria-hidden="true"
							/>
						</Button>
						<Button
							aria-label="Go to previous page"
							variant="outline"
							className="size-8 p-0"
							onClick={() => table.previousPage()}
							disabled={!table.getCanPreviousPage()}
						>
							<ChevronLeftIcon className="size-4" aria-hidden="true" />
						</Button>
						<Button
							aria-label="Go to next page"
							variant="outline"
							className="size-8 p-0"
							onClick={() => table.nextPage()}
							disabled={!table.getCanNextPage()}
						>
							<ChevronRightIcon
								className="size-4"
								aria-hidden="true"
							/>
						</Button>
						<Button
							aria-label="Go to last page"
							variant="outline"
							className="hidden size-8 p-0 lg:flex"
							onClick={() =>
								table.setPageIndex(table.getPageCount() - 1)
							}
							disabled={!table.getCanNextPage()}
						>
							<DoubleArrowRightIcon
								className="size-4"
								aria-hidden="true"
							/>
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
