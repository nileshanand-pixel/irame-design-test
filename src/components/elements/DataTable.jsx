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
 * @property {boolean} [enableSorting]
 * @property {boolean} [simplePagination]
 * @property {boolean} [stickyHeader]
 * @property {boolean} [stickyPagination]
 * @property {number} [defaultRowsPerPage]
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
	enableSorting = false,
	simplePagination = false,
	stickyHeader = false,
	stickyPagination = false,
	defaultRowsPerPage = 10,
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
		enableSorting,
		defaultRowsPerPage,
	});

	return (
		<div
			className={cn(
				'w-full space-y-2.5',
				stickyPagination
					? 'h-full flex flex-col overflow-hidden'
					: 'overflow-auto',
			)}
		>
			<div
				className={cn(
					'text-primary100 w-full overflow-auto',
					stickyPagination && 'flex-1',
				)}
			>
				<Table>
					<TableHeader
						className={cn(stickyHeader && 'sticky top-0 z-20 bg-white')}
					>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead
										key={header.id}
										className="px-4 py-3 text-sm font-semibold text-primary80 bg-purple-4"
									>
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
											'text-sm font-normal text-primary80',
										)}
									>
										{row.getVisibleCells().map((cell) => (
											<TableCell
												key={cell.id}
												className="px-4 py-3"
											>
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
				<div
					className={cn(
						'space-y-2.5',
						simplePagination && 'pb-5',
						stickyPagination && 'sticky bottom-0 z-10 bg-white',
					)}
				>
					<DataTablePagination
						table={table}
						simpleMode={simplePagination}
						defaultRowsPerPage={defaultRowsPerPage}
					/>
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
