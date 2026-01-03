import React, { useState, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
	Calendar,
	ChevronDown,
	Check,
	ChevronRight,
	ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

const QUICK_FILTERS = [
	{ key: 'today', label: 'Today' },
	{ key: 'yesterday', label: 'Yesterday' },
	{ key: '7d', label: '7D' },
	{ key: '30d', label: '30D' },
	{ key: '3m', label: '3M' },
	{ key: '6m', label: '6M' },
	{ key: '12m', label: '12M' },
];

const XTD_OPTIONS = [
	{ key: 'wtd', label: 'Week to Date' },
	{ key: 'mtd', label: 'Month to Date' },
	{ key: 'qtd', label: 'Quarter to Date' },
	{ key: 'ytd', label: 'Year to Date' },
];

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Calendar Component for Custom Date Range
const CalendarPicker = ({ selectedRange, onDateClick, onApply, onCancel }) => {
	const [currentMonth, setCurrentMonth] = useState(dayjs());
	const today = dayjs().startOf('day');

	const daysInMonth = currentMonth.daysInMonth();
	const firstDayOfMonth = currentMonth.startOf('month').day();
	const days = [];

	// Add empty cells for days before the first day of the month
	for (let i = 0; i < firstDayOfMonth; i++) {
		days.push(null);
	}

	// Add days of the month
	for (let day = 1; day <= daysInMonth; day++) {
		days.push(day);
	}

	const isDateInRange = (day) => {
		if (!day || !selectedRange.start) return false;
		const date = currentMonth.date(day);

		if (selectedRange.end) {
			return (
				date.isAfter(selectedRange.start.subtract(1, 'day')) &&
				date.isBefore(selectedRange.end.add(1, 'day'))
			);
		}

		return date.isSame(selectedRange.start, 'day');
	};

	const isStartDate = (day) => {
		if (!day || !selectedRange.start) return false;
		const date = currentMonth.date(day);
		return date.isSame(selectedRange.start, 'day');
	};

	const isEndDate = (day) => {
		if (!day || !selectedRange.end) return false;
		const date = currentMonth.date(day);
		return date.isSame(selectedRange.end, 'day');
	};

	const isDateSelected = (day) => {
		return isStartDate(day) || isEndDate(day);
	};

	const isFutureDate = (day) => {
		if (!day) return false;
		const date = currentMonth.date(day).startOf('day');
		return date.isAfter(today);
	};

	const isNextMonthDisabled =
		currentMonth.isSame(today, 'month') || currentMonth.isAfter(today, 'month');

	return (
		<div className="p-4">
			{/* Month Navigation */}
			<div className="flex items-center justify-between mb-4">
				<Button
					variant="ghost"
					size="icon"
					onClick={() =>
						setCurrentMonth(currentMonth.subtract(1, 'month'))
					}
					className="h-8 w-8 hover:bg-gray-100"
				>
					<ChevronLeft className="h-4 w-4 text-gray-600" />
				</Button>

				<div className="text-base font-semibold text-gray-900">
					{currentMonth.format('MMMM YYYY')}
				</div>

				<Button
					variant="ghost"
					size="icon"
					onClick={() => setCurrentMonth(currentMonth.add(1, 'month'))}
					disabled={isNextMonthDisabled}
					className="h-8 w-8 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
				>
					<ChevronRight className="h-4 w-4 text-gray-600" />
				</Button>
			</div>

			{/* Days of Week Header */}
			<div className="grid grid-cols-7 gap-1 mb-2">
				{DAYS_OF_WEEK.map((day, index) => (
					<div
						key={index}
						className="text-xs font-medium text-gray-500 text-center py-2"
					>
						{day}
					</div>
				))}
			</div>

			{/* Calendar Grid */}
			<div className="grid grid-cols-7 gap-1">
				{days.map((day, index) => {
					if (!day) {
						return <div key={`empty-${index}`} className="h-9" />;
					}

					const date = currentMonth.date(day);
					const isInRange = isDateInRange(day);
					const isSelected = isDateSelected(day);
					const isFuture = isFutureDate(day);
					const isToday = date.isSame(today, 'day');

					return (
						<button
							key={day}
							onClick={() => !isFuture && onDateClick(date)}
							disabled={isFuture}
							className={cn(
								'h-9 w-9 text-sm rounded-md transition-colors',
								'flex items-center justify-center',
								isFuture && 'text-gray-300 cursor-not-allowed',
								!isFuture && 'hover:bg-gray-100 cursor-pointer',
								isToday && !isSelected && 'bg-gray-50 font-semibold',
								isInRange && !isSelected && 'bg-purple-50',
								isStartDate(day) &&
									'bg-[#6A12CD] text-white rounded-l-md font-semibold',
								isEndDate(day) &&
									'bg-[#6A12CD] text-white rounded-r-md font-semibold',
								isSelected &&
									!isStartDate(day) &&
									!isEndDate(day) &&
									'bg-[#6A12CD] text-white font-semibold',
							)}
						>
							{day}
						</button>
					);
				})}
			</div>

			{/* Action Buttons */}
			<div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t">
				<Button variant="outline" onClick={onCancel} className="text-sm">
					Cancel
				</Button>
				<Button
					onClick={onApply}
					disabled={!selectedRange.start || !selectedRange.end}
					className="bg-[#6A12CD] hover:bg-[#6912CC] text-white text-sm"
				>
					Apply
				</Button>
			</div>
		</div>
	);
};

const DateRangeDropdown = ({ value = '30d', onChange }) => {
	const [open, setOpen] = useState(false);
	const [showCustom, setShowCustom] = useState(false);
	const [selectedRange, setSelectedRange] = useState({ start: null, end: null });
	const [customDateRange, setCustomDateRange] = useState(null);

	const isCustomSelected = value === 'custom';

	const selectedOption = useMemo(() => {
		if (isCustomSelected) {
			// If custom date range is selected, show formatted date range
			if (customDateRange?.startDate && customDateRange?.endDate) {
				const start = dayjs(customDateRange.startDate);
				const end = dayjs(customDateRange.endDate);
				const formattedLabel = `${start.format('MMM D')} - ${end.format('MMM D')}`;
				return { key: 'custom', label: formattedLabel };
			}
			return { key: 'custom', label: 'Custom' };
		}
		const xtdOption = XTD_OPTIONS.find((opt) => opt.key === value);
		if (xtdOption) {
			return xtdOption;
		}

		return QUICK_FILTERS.find((opt) => opt.key === value) || QUICK_FILTERS[3];
	}, [value, isCustomSelected, customDateRange]);

	const handleSelect = (key) => {
		if (onChange) {
			onChange(key);
		}
		// Clear custom date range when selecting a non-custom option
		if (key !== 'custom') {
			setCustomDateRange(null);
		}
		setOpen(false);
		setShowCustom(false);
		setSelectedRange({ start: null, end: null });
	};

	const handleCustomClick = () => {
		setShowCustom(true);
	};

	const handleDateClick = (date) => {
		if (!selectedRange.start || (selectedRange.start && selectedRange.end)) {
			setSelectedRange({ start: date, end: null });
		} else {
			const start = selectedRange.start;
			const end = date;

			if (end.isBefore(start)) {
				setSelectedRange({ start: end, end: start });
			} else {
				setSelectedRange({ start, end });
			}
		}
	};

	const handleApplyCustom = () => {
		if (selectedRange.start && selectedRange.end) {
			const dateRange = {
				startDate: selectedRange.start,
				endDate: selectedRange.end,
			};
			// Store the custom date range for display
			setCustomDateRange(dateRange);
			if (onChange) {
				onChange('custom', dateRange);
			}
			setOpen(false);
			setShowCustom(false);
		}
	};

	const handleCancelCustom = () => {
		setShowCustom(false);
		setSelectedRange({ start: null, end: null });
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className={cn(
						'border-[#6A12CD] text-[#6A12CD] bg-white hover:bg-purple-50',
						'px-3 py-2 h-auto font-medium flex items-center gap-2',
					)}
				>
					<Calendar className="w-4 h-4" />
					<span>{selectedOption.label}</span>
					<ChevronDown className="w-4 h-4" />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className="w-auto p-0"
				align="start"
				sideOffset={4}
				onOpenAutoFocus={(e) => e.preventDefault()}
			>
				{!showCustom ? (
					<div className="min-w-[240px]">
						{/* Quick Filters */}
						<div className="py-2">
							<div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
								QUICK FILTERS
							</div>
							<div className="px-2">
								{/* Custom Option - First in list */}
								<button
									onClick={handleCustomClick}
									className={cn(
										'w-full px-4 py-2.5 text-left text-sm flex items-center justify-between rounded-md transition-colors',
										'hover:bg-gray-100',
										isCustomSelected &&
											'bg-[#FAF5FF] text-[#6A12CD]',
									)}
								>
									<span className="font-medium flex items-center gap-2">
										<Calendar
											className={cn(
												'w-4 h-4',
												isCustomSelected
													? 'text-[#6A12CD]'
													: 'text-gray-600',
											)}
										/>
										Custom
									</span>
									<ChevronRight className="w-4 h-4 text-gray-400" />
								</button>

								{/* Other Quick Filters */}
								{QUICK_FILTERS.map((filter) => (
									<button
										key={filter.key}
										onClick={() => handleSelect(filter.key)}
										className={cn(
											'w-full px-4 py-2.5 text-left text-sm flex items-center justify-between rounded-md transition-colors',
											'hover:bg-gray-100',
											selectedOption.key === filter.key &&
												!isCustomSelected &&
												'bg-[#FAF5FF] text-[#6A12CD]',
										)}
									>
										<span className="font-medium">
											{filter.label}
										</span>
										{selectedOption.key === filter.key &&
											!isCustomSelected && (
												<Check className="w-4 h-4 text-[#6A12CD]" />
											)}
									</button>
								))}
							</div>
						</div>

						{/* Divider */}
						<div className="border-t border-gray-200"></div>

						{/* XTD Options */}
						<div className="py-2">
							<div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
								XTD OPTIONS
							</div>
							<div className="px-2">
								{XTD_OPTIONS.map((option) => (
									<button
										key={option.key}
										onClick={() => handleSelect(option.key)}
										className={cn(
											'w-full px-4 py-2.5 text-left text-sm flex items-center justify-between rounded-md transition-colors',
											'hover:bg-gray-100',
											selectedOption.key === option.key &&
												'bg-[#FAF5FF] text-[#6A12CD]',
										)}
									>
										<span className="font-medium">
											{option.label}
										</span>
										{selectedOption.key === option.key && (
											<Check className="w-4 h-4 text-[#6A12CD]" />
										)}
									</button>
								))}
							</div>
						</div>
					</div>
				) : (
					<div className="w-auto">
						<CalendarPicker
							selectedRange={selectedRange}
							onDateClick={handleDateClick}
							onApply={handleApplyCustom}
							onCancel={handleCancelCustom}
						/>
					</div>
				)}
			</PopoverContent>
		</Popover>
	);
};

export default DateRangeDropdown;
