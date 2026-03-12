import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { LuX, LuCheck } from 'react-icons/lu';
import { cn } from '@/lib/utils';

// Virtualized list item height
const ITEM_HEIGHT = 32;
const MAX_VISIBLE_ITEMS = 8;
const CONTAINER_HEIGHT = ITEM_HEIGHT * MAX_VISIBLE_ITEMS;

export const FilterRow = ({
	filter,
	filterIndex,
	columns,
	allFilters,
	getColumnValues,
	updateFilterColumn,
	toggleFilterValue,
	removeFilter,
}) => {
	const [valueSearchQuery, setValueSearchQuery] = useState('');
	const [columnSearchQuery, setColumnSearchQuery] = useState('');
	const [scrollTop, setScrollTop] = useState(0);
	const [columnScrollTop, setColumnScrollTop] = useState(0);
	const scrollContainerRef = useRef(null);
	const columnScrollContainerRef = useRef(null);

	// Reset scroll when search query changes
	useEffect(() => {
		setScrollTop(0);
		if (scrollContainerRef.current) {
			scrollContainerRef.current.scrollTop = 0;
		}
	}, [valueSearchQuery]);

	useEffect(() => {
		setColumnScrollTop(0);
		if (columnScrollContainerRef.current) {
			columnScrollContainerRef.current.scrollTop = 0;
		}
	}, [columnSearchQuery]);

	// Memoize column values to prevent re-calculation on every render
	const columnValues = useMemo(() => {
		return getColumnValues(filter.column, filterIndex);
	}, [filter.column, filterIndex, getColumnValues]);

	const filteredValues = useMemo(() => {
		if (!valueSearchQuery.trim()) return columnValues;

		const query = valueSearchQuery.toLowerCase();
		return columnValues.filter((value) =>
			String(value).toLowerCase().includes(query),
		);
	}, [columnValues, valueSearchQuery]);

	// Calculate which items should be visible based on scroll position
	const { visibleItems, totalHeight, startIndex } = useMemo(() => {
		const startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
		const endIndex = Math.min(
			startIndex + MAX_VISIBLE_ITEMS + 2, // +2 for buffer
			filteredValues.length,
		);

		return {
			visibleItems: filteredValues.slice(startIndex, endIndex),
			totalHeight: filteredValues.length * ITEM_HEIGHT,
			startIndex,
		};
	}, [filteredValues, scrollTop]);

	const handleScroll = useCallback((e) => {
		setScrollTop(e.target.scrollTop);
	}, []);

	const handleColumnScroll = useCallback((e) => {
		setColumnScrollTop(e.target.scrollTop);
	}, []);

	// Get available columns (not used by other filters or the current filter's column)
	const availableColumns = useMemo(() => {
		const usedColumns = allFilters
			.filter((f) => f.id !== filter.id)
			.map((f) => f.column);
		return columns.filter((col) => !usedColumns.includes(col.accessorKey));
	}, [columns, allFilters, filter.id]);

	// Filter columns based on search query
	const filteredColumns = useMemo(() => {
		if (!columnSearchQuery.trim()) return availableColumns;

		const query = columnSearchQuery.toLowerCase();
		return availableColumns.filter((column) => {
			const columnLabel = column.accessorKey
				?.split('_')
				.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
				.join(' ')
				.toLowerCase();
			return (
				columnLabel.includes(query) ||
				column.accessorKey.toLowerCase().includes(query)
			);
		});
	}, [availableColumns, columnSearchQuery]);

	// Calculate visible columns for virtualization
	const {
		visibleColumns: visibleColumnItems,
		totalHeight: columnTotalHeight,
		startIndex: columnStartIndex,
	} = useMemo(() => {
		const startIndex = Math.floor(columnScrollTop / ITEM_HEIGHT);
		const endIndex = Math.min(
			startIndex + MAX_VISIBLE_ITEMS + 2,
			filteredColumns.length,
		);

		return {
			visibleColumns: filteredColumns.slice(startIndex, endIndex),
			totalHeight: filteredColumns.length * ITEM_HEIGHT,
			startIndex,
		};
	}, [filteredColumns, columnScrollTop]);

	const selectedColumn = columns.find((col) => col.accessorKey === filter.column);
	const columnLabel = selectedColumn?.accessorKey
		?.split('_')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');

	return (
		<div
			className="flex items-start gap-2 p-3 bg-purple-4 rounded-lg border border-[#E5E7EB]"
			onClick={(e) => e.stopPropagation()}
		>
			{/* Column Select */}
			<div className="w-48">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="outline"
							size="sm"
							className="h-8 w-full justify-start text-sm font-normal"
						>
							<span className="truncate">
								{columnLabel || 'Select column'}
							</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-64"
						align="start"
						onCloseAutoFocus={(e) => e.preventDefault()}
					>
						<div className="p-2" onKeyDown={(e) => e.stopPropagation()}>
							<Input
								placeholder="Search columns..."
								value={columnSearchQuery}
								onChange={(e) =>
									setColumnSearchQuery(e.target.value)
								}
								className="h-8 text-sm"
								onClick={(e) => e.stopPropagation()}
								onKeyDown={(e) => e.stopPropagation()}
							/>
						</div>
						<DropdownMenuSeparator />

						{/* Virtualized Column List */}
						<div
							ref={columnScrollContainerRef}
							className="overflow-y-auto"
							style={{
								height:
									filteredColumns.length > 0
										? Math.min(
												CONTAINER_HEIGHT,
												filteredColumns.length * ITEM_HEIGHT,
											)
										: 'auto',
								maxHeight: CONTAINER_HEIGHT,
							}}
							onScroll={handleColumnScroll}
						>
							{filteredColumns.length > 0 ? (
								<div
									style={{
										height: columnTotalHeight,
										position: 'relative',
									}}
								>
									{visibleColumnItems.map((column, index) => {
										const actualIndex = columnStartIndex + index;
										const isChecked =
											filter.column === column.accessorKey;
										const columnLabel = column.accessorKey
											?.split('_')
											.map(
												(word) =>
													word.charAt(0).toUpperCase() +
													word.slice(1),
											)
											.join(' ');

										return (
											<div
												key={`${column.accessorKey}-${actualIndex}`}
												className={cn(
													'flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent hover:text-accent-foreground',
													'transition-colors',
													isChecked && 'bg-accent/50',
												)}
												style={{
													position: 'absolute',
													top:
														(columnStartIndex + index) *
														ITEM_HEIGHT,
													left: 0,
													right: 0,
													height: ITEM_HEIGHT,
												}}
												onClick={(e) => {
													e.preventDefault();
													e.stopPropagation();
													updateFilterColumn(
														filter.id,
														column.accessorKey,
													);
													setColumnSearchQuery('');
												}}
											>
												<div
													className={cn(
														'w-4 h-4 border rounded flex items-center justify-center flex-shrink-0',
														isChecked
															? 'bg-primary border-primary'
															: 'border-input',
													)}
												>
													{isChecked && (
														<LuCheck className="w-3 h-3 text-primary-foreground" />
													)}
												</div>
												<span className="text-sm truncate flex-1">
													{columnLabel}
												</span>
											</div>
										);
									})}
								</div>
							) : (
								<div className="p-2 text-sm text-gray-500 text-center">
									No columns found
								</div>
							)}
						</div>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Values Multi-Select */}
			<div className="flex-1">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="outline"
							size="sm"
							className="h-8 w-full justify-start text-sm font-normal"
						>
							{filter.values.length > 0
								? `${filter.values.length} value${filter.values.length > 1 ? 's' : ''} selected`
								: 'Select values...'}
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-64"
						align="start"
						onCloseAutoFocus={(e) => e.preventDefault()}
					>
						<div className="p-2" onKeyDown={(e) => e.stopPropagation()}>
							<Input
								placeholder="Search values..."
								value={valueSearchQuery}
								onChange={(e) => setValueSearchQuery(e.target.value)}
								className="h-8 text-sm"
								onClick={(e) => e.stopPropagation()}
								onKeyDown={(e) => e.stopPropagation()}
							/>
						</div>
						<DropdownMenuSeparator />

						{/* Virtualized List Container */}
						<div
							ref={scrollContainerRef}
							className="overflow-y-auto"
							style={{
								height:
									filteredValues.length > 0
										? Math.min(
												CONTAINER_HEIGHT,
												filteredValues.length * ITEM_HEIGHT,
											)
										: 'auto',
								maxHeight: CONTAINER_HEIGHT,
							}}
							onScroll={handleScroll}
						>
							{filteredValues.length > 0 ? (
								<div
									style={{
										height: totalHeight,
										position: 'relative',
									}}
								>
									{visibleItems.map((value, index) => {
										const actualIndex = startIndex + index;
										const isChecked =
											filter.values.includes(value);

										return (
											<div
												key={`${value}-${actualIndex}`}
												className={cn(
													'flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent hover:text-accent-foreground',
													'transition-colors',
													isChecked && 'bg-accent/50',
												)}
												style={{
													position: 'absolute',
													top:
														(startIndex + index) *
														ITEM_HEIGHT,
													left: 0,
													right: 0,
													height: ITEM_HEIGHT,
												}}
												onClick={(e) => {
													e.preventDefault();
													e.stopPropagation();
													toggleFilterValue(
														filter.id,
														value,
													);
												}}
											>
												<div
													className={cn(
														'w-4 h-4 border rounded flex items-center justify-center flex-shrink-0',
														isChecked
															? 'bg-primary border-primary'
															: 'border-input',
													)}
												>
													{isChecked && (
														<LuCheck className="w-3 h-3 text-primary-foreground" />
													)}
												</div>
												<span className="text-sm truncate flex-1">
													{value}
												</span>
											</div>
										);
									})}
								</div>
							) : (
								<div className="p-2 text-sm text-gray-500 text-center">
									No values found
								</div>
							)}
						</div>

						{/* Show count if there are many items */}
						{filteredValues.length > 50 && (
							<>
								<DropdownMenuSeparator />
								<div className="px-2 py-1.5 text-xs text-muted-foreground text-center">
									{filteredValues.length} total values •{' '}
									{filter.values.length} selected
								</div>
							</>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Remove Filter Button */}
			<Button
				variant="ghost"
				size="sm"
				className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-500"
				onClick={(e) => {
					e.stopPropagation();
					removeFilter(filter.id);
				}}
			>
				<LuX className="w-4 h-4" />
			</Button>
		</div>
	);
};
