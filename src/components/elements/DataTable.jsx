import React from 'react';
import { flexRender } from '@tanstack/react-table';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { useDataTable } from '@/hooks/useDataTable';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTableFloatingBar } from './data-table/components/data-table-floating-bar';
import { DataTablePagination } from './data-table/components/data-table-pagination';

/**
 * @typedef {Object} DataTableProps
 * @property {Array} data
 * @property {Array} columns
 * @property {JSX.Element|null} [floatingBarContent]
 * @property {Function} [onRowClick]
 * @property {boolean} [isServerSide]
 * @property {number} totalCount
 * @property {boolean} [hidePagination]
 * @property {boolean} [isLoading]
 * @property {boolean} [enableRowSelection]
 * @property {Object} [pagination]
 * @property {Function} [setPagination]
 * @property {Object} [sorting]
 * @property {Function} [setSorting]
 * @property {Object} [rowSelection]
 * @property {Function} [setRowSelection]
 * @property {any} [FloatingBarContent]
 * @property {Object} [selectedRow]
 * @property {any} [defaultSort]
 */

/**
 * DataTable component
 * @param {DataTableProps} props
 */
export function DataTable({
	data,
	isServerSide,
	columns,
	onRowClick,
	defaultSort,
	totalCount,
	hidePagination,
	isLoading,
	enableRowSelection,
	pagination,
	setPagination,
	sorting,
	setSorting,
	rowSelection,
	setRowSelection,
	FloatingBarContent,
	selectedRow,
	onSortingChange,
}) {
	const { table } = useDataTable({
		data,
		columns,
		totalCount,
		enableRowSelection,
		isServerSide,
		pagination,
		setPagination,
		sorting,
		setSorting,
		rowSelection,
		setRowSelection,
		defaultSort,
		onSortingChange,
	});

	return (
		<div className="w-full space-y-2.5 overflow-auto">
			<div className="text-primary100  w-full overflow-auto">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id} className="p-2">
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					{isLoading ? (
						<>
							{Array(pagination?.pageSize ?? 10)
								.fill(null)
								.map((_, index) => (
									<TableRow className="border-none" key={index}>
										<TableCell
											colSpan={columns.length}
											className="h-[1.56rem] text-center"
										>
											<Skeleton className="h-[1.56rem] w-full" />
										</TableCell>
									</TableRow>
								))}
						</>
					) : (
						<TableBody>
							{table.getRowModel().rows?.length ? (
								table.getRowModel().rows.map((row) => (
									<TableRow
										key={row.id}
										data-state={
											row.getIsSelected() && 'selected'
										}
										onClick={() => {
											onRowClick?.(row.original);
										}}
										className={cn(
											onRowClick && 'cursor-pointer',
											selectedRow &&
												selectedRow?._id ===
													row.original?._id &&
												'bg-slate-100',
										)}
									>
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id} className="p-2">
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext(),
												)}
											</TableCell>
										))}
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell
										colSpan={columns.length}
										className="h-24 text-center"
									>
										No results.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					)}
				</Table>
			</div>
			{!hidePagination && (
				<div className="space-y-2.5">
					<DataTablePagination table={table} />
				</div>
			)}
			{FloatingBarContent && (
				<DataTableFloatingBar table={table}>
					{FloatingBarContent({ rowSelection, table })}
				</DataTableFloatingBar>
			)}
		</div>
	);
}
