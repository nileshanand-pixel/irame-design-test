import React, { useState } from 'react';
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
import { LuFilter, LuX } from 'react-icons/lu';
import { Input } from '@/components/ui/input';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
 * @property {number} [defaultRowsPerPage]
 * @property {boolean} [enableColumnFilters]
 * @property {Object} [columnFilters]
 * @property {Function} [setColumnFilters]
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
	defaultRowsPerPage = 10,
	enableColumnFilters = false,
	columnFilters = {},
	setColumnFilters,
}) {
	const [openFilterColumn, setOpenFilterColumn] = useState(null);

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

	const handleFilterChange = (columnId, value) => {
		setColumnFilters((prev) => ({
			...prev,
			[columnId]: value,
		}));
	};

	const clearFilter = (columnId) => {
		setColumnFilters((prev) => {
			const newFilters = { ...prev };
			delete newFilters[columnId];
			return newFilters;
		});
		setOpenFilterColumn(null);
	};

	return (
		<div className="flex flex-col w-full h-full min-h-0">
			<div className="relative flex-1 text-primary100 w-full overflow-auto min-h-0">
				<Table className="border-collapse">
					<TableHeader className="sticky top-0 bg-white z-20">
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									const columnId = header.column.id;
									const hasFilter = columnFilters[columnId];

									return (
										<TableHead
											key={header.id}
											className={
												'p-2 text-sm font-semibold transition-colors text-primary80 bg-purple-4'
											}
										>
											<div className="flex items-center gap-2 justify-between">
												<span className="flex-1">
													{header.isPlaceholder
														? null
														: flexRender(
																header.column
																	.columnDef
																	.header,
																header.getContext(),
															)}
												</span>
												{enableColumnFilters &&
													!header.isPlaceholder && (
														<DropdownMenu
															open={
																openFilterColumn ===
																columnId
															}
															onOpenChange={(open) => {
																setOpenFilterColumn(
																	open
																		? columnId
																		: null,
																);
															}}
														>
															<DropdownMenuTrigger
																asChild
															>
																<button
																	className={cn(
																		'p-1 hover:bg-purple-30 rounded transition-colors',
																		hasFilter &&
																			'text-purple-100 bg-purple-10',
																	)}
																	onClick={(e) =>
																		e.stopPropagation()
																	}
																>
																	<LuFilter className="w-3.5 h-3.5" />
																</button>
															</DropdownMenuTrigger>
															<DropdownMenuContent
																align="end"
																className="w-64 p-3"
																onClick={(e) =>
																	e.stopPropagation()
																}
															>
																<div className="space-y-2">
																	<div className="flex items-center justify-between mb-2">
																		<span className="text-sm font-semibold">
																			Filter
																		</span>
																		{hasFilter && (
																			<button
																				onClick={() =>
																					clearFilter(
																						columnId,
																					)
																				}
																				className="text-xs text-purple-100 hover:text-purple-80 flex items-center gap-1"
																			>
																				<LuX className="w-3 h-3" />
																				Clear
																			</button>
																		)}
																	</div>
																	<Input
																		placeholder="Search..."
																		value={
																			columnFilters[
																				columnId
																			] || ''
																		}
																		onChange={(
																			e,
																		) =>
																			handleFilterChange(
																				columnId,
																				e
																					.target
																					.value,
																			)
																		}
																		className="h-8 text-sm"
																		onClick={(
																			e,
																		) =>
																			e.stopPropagation()
																		}
																		onKeyDown={(
																			e,
																		) => {
																			e.stopPropagation();
																		}}
																	/>
																</div>
															</DropdownMenuContent>
														</DropdownMenu>
													)}
											</div>
										</TableHead>
									);
								})}
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
											'text-xs font-normal textprimary80',
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
										{enableColumnFilters &&
										Object.keys(columnFilters).length > 0 ? (
											<div className="flex flex-col items-center gap-2 text-primary60">
												<LuFilter className="w-5 h-5" />
												<span className="text-sm">
													No results match your filters.
												</span>
												<span className="text-xs">
													Try adjusting or clearing the
													filters above.
												</span>
											</div>
										) : (
											'No results.'
										)}
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					)}
				</Table>
			</div>
			{!hidePagination && (
				<div className="pt-2 flex-none border-t border-[#E5E7EB]">
					<DataTablePagination
						table={table}
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
