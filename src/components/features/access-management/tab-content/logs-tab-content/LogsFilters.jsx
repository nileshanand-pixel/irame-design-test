import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import SearchBar from '../../search-bar';
import DateRangePicker from '@/components/elements/DateRangePicker';
import {
	CATEGORY_OPTIONS,
	getActionTypesByCategory,
} from '@/constants/activityLogActionTypes';
import { getDateRangeOptions } from '@/utils/dateRangeUtils';

export default function LogsFilters({
	searchTerm,
	onSearchChange,
	categoryFilter,
	onCategoryChange,
	actionTypeFilter,
	onActionTypeChange,
	dateRange,
	onDateRangeChange,
	onDateRangeClear,
	hasActiveFilters,
	onClearFilters,
	onExport,
	isExporting,
}) {
	const availableActionTypes = getActionTypesByCategory(categoryFilter);

	return (
		<div className="flex flex-col gap-4 flex-shrink-0">
			<div className="w-full max-w-md">
				<SearchBar
					value={searchTerm}
					onChange={onSearchChange}
					placeholder="Search by user name..."
				/>
			</div>

			<div className="flex flex-wrap items-center gap-3">
				{/* Category Filter */}
				<Select value={categoryFilter} onValueChange={onCategoryChange}>
					<SelectTrigger
						className={cn(
							'w-[180px]',
							categoryFilter === 'all' && 'text-muted-foreground',
						)}
					>
						<SelectValue placeholder="All Categories" />
					</SelectTrigger>
					<SelectContent>
						{CATEGORY_OPTIONS.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{/* Action Type Filter */}
				<Select value={actionTypeFilter} onValueChange={onActionTypeChange}>
					<SelectTrigger
						className={cn(
							'w-[180px]',
							actionTypeFilter === 'all' && 'text-muted-foreground',
						)}
					>
						<SelectValue placeholder="All Actions" />
					</SelectTrigger>
					<SelectContent>
						{availableActionTypes.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{/* Date Range Picker */}
				<DateRangePicker
					predefinedOptions={getDateRangeOptions()}
					onChange={onDateRangeChange}
					onClear={onDateRangeClear}
				/>

				{/* Clear Filters Button */}
				{hasActiveFilters && (
					<button
						onClick={onClearFilters}
						className={cn(
							'text-sm text-gray-500 hover:text-gray-700',
							'underline-offset-2 hover:underline',
						)}
					>
						Clear Filters
					</button>
				)}

				{/* Export Button */}
				<button
					onClick={onExport}
					disabled={isExporting}
					className={cn(
						'inline-flex items-center gap-2 px-4 py-2 ml-auto',
						'text-[#26064A] text-sm font-medium',
						'border border-gray-200 rounded-md',
						'hover:bg-gray-50 transition-colors',
						isExporting && 'opacity-50 cursor-not-allowed',
					)}
				>
					{isExporting ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<Download className="h-4 w-4" />
					)}
					Export
				</button>
			</div>
		</div>
	);
}
