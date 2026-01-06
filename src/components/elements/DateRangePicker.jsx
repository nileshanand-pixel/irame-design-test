import { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function CalendarView({
	currentMonth,
	onMonthChange,
	selectedRange,
	onDateClick,
	onApply,
}) {
	const daysInMonth = currentMonth.daysInMonth();
	const firstDayOfMonth = currentMonth.startOf('month').day();
	const days = [];
	const today = dayjs().startOf('day');

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
		<div>
			<div className="p-6">
				{/* Month Navigation */}
				<div className="flex items-center justify-between mb-6">
					<Button
						variant="ghost"
						size="icon"
						onClick={() =>
							onMonthChange(currentMonth.subtract(1, 'month'))
						}
						className="h-8 w-8 hover:bg-transparent"
					>
						<ChevronLeft className="h-5 w-5 text-gray-600" />
					</Button>

					<div className="text-xl font-semibold text-gray-900">
						{currentMonth.format('MMMM YYYY')}
					</div>

					<Button
						variant="ghost"
						size="icon"
						onClick={() => onMonthChange(currentMonth.add(1, 'month'))}
						disabled={isNextMonthDisabled}
						className="h-8 w-8 hover:bg-transparent disabled:opacity-30 disabled:cursor-not-allowed"
					>
						<ChevronRight className="h-5 w-5 text-gray-600" />
					</Button>
				</div>

				{/* Days of Week */}
				<div className="grid grid-cols-7 mb-2">
					{DAYS_OF_WEEK.map((day, idx) => (
						<div
							key={idx}
							className="text-center text-sm font-medium text-gray-500 py-2"
						>
							{day}
						</div>
					))}
				</div>

				{/* Calendar Days */}
				<div className="grid grid-cols-7 gap-y-1">
					{days.map((day, idx) => {
						const isSelected = isDateSelected(day);
						const isInRange = isDateInRange(day) && !isSelected;
						const isStart = isStartDate(day);
						const isEnd = isEndDate(day);
						const isFuture = isFutureDate(day);

						return (
							<div
								key={idx}
								className={cn(
									'relative flex items-center justify-center p-0',
									isInRange && !isFuture && 'bg-purple-50',
									isStart &&
										'after:content-[""] after:absolute after:right-0 after:top-0 after:w-1/2 after:h-full after:bg-purple-50 after:z-0',
									isEnd &&
										'after:content-[""] after:absolute after:left-0 after:top-0 after:w-1/2 after:h-full after:bg-purple-50 after:z-0',
								)}
							>
								<button
									onClick={() =>
										day &&
										!isFuture &&
										onDateClick(currentMonth.date(day))
									}
									disabled={!day || isFuture}
									className={cn(
										'h-10 w-10 flex items-center justify-center text-base font-semibold rounded-full transition-all relative z-10',
										day &&
											!isSelected &&
											!isFuture &&
											'hover:border hover:border-gray-300 text-gray-900',
										!day && 'cursor-default invisible',
										isSelected &&
											'bg-purple-600 text-white hover:bg-purple-700',
										!isSelected && !day && 'text-transparent',
										isFuture &&
											'text-gray-300 cursor-not-allowed',
									)}
								>
									{day || ''}
								</button>
							</div>
						);
					})}
				</div>
			</div>

			{/* Apply Button */}
			<div className="border-t border-gray-200 px-6 py-4">
				<Button
					onClick={onApply}
					className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold h-12 rounded-lg"
					disabled={!selectedRange.start || !selectedRange.end}
				>
					Apply
				</Button>
			</div>
		</div>
	);
}

export default function DateRangePicker({
	value,
	onChange,
	onClear,
	predefinedOptions = [],
	className,
}) {
	const [isOpen, setIsOpen] = useState(false);
	const [selectedPredefinedOption, setSelectedPredefinedOption] = useState(null);
	const [showCalendar, setShowCalendar] = useState(false);
	const [currentMonth, setCurrentMonth] = useState(dayjs());
	const [selectedRange, setSelectedRange] = useState({ start: null, end: null });

	// Sync internal state with prop value
	useEffect(() => {
		if (!value?.startDate || !value?.endDate) {
			setSelectedPredefinedOption(null);
			setSelectedRange({ start: null, end: null });
			return;
		}

		// Try to find a matching predefined option
		const matchingOption = predefinedOptions.find(
			(opt) =>
				dayjs(opt.startDate).isSame(dayjs(value.startDate), 'day') &&
				dayjs(opt.endDate).isSame(dayjs(value.endDate), 'day'),
		);

		if (matchingOption) {
			setSelectedPredefinedOption(matchingOption);
			setSelectedRange({ start: null, end: null });
		} else {
			setSelectedPredefinedOption(null);
			setSelectedRange({
				start: dayjs(value.startDate),
				end: dayjs(value.endDate),
			});
		}
	}, [value, predefinedOptions]);

	const handlePredefinedOptionSelect = (option) => {
		setSelectedPredefinedOption(option);
		setShowCalendar(false);
		setSelectedRange({ start: null, end: null });

		if (onChange) {
			onChange({
				startDate: option.startDate,
				endDate: option.endDate,
			});
		}

		setIsOpen(false);
	};

	const handleDateClick = (date) => {
		if (!selectedRange.start || (selectedRange.start && selectedRange.end)) {
			// Start a new selection
			setSelectedRange({ start: date, end: null });
		} else {
			// Complete the selection
			const start = selectedRange.start;
			const end = date;

			if (end.isBefore(start)) {
				setSelectedRange({ start: end, end: start });
			} else {
				setSelectedRange({ start, end });
			}
		}
	};

	const handleApply = () => {
		if (selectedRange.start && selectedRange.end) {
			setSelectedPredefinedOption(null);
			if (onChange) {
				onChange({
					startDate: selectedRange.start.startOf('day').toISOString(),
					endDate: selectedRange.end.endOf('day').toISOString(),
				});
			}
			setIsOpen(false);
			setShowCalendar(false);
		}
	};

	const handleCustomRangeClick = () => {
		setShowCalendar(true);
	};

	const handleClearClick = () => {
		setSelectedPredefinedOption(null);
		setSelectedRange({ start: null, end: null });
		setShowCalendar(false);
		setIsOpen(false);
		if (onClear) {
			onClear();
		}
	};

	const selectedLabel = useMemo(() => {
		if (selectedPredefinedOption) {
			return selectedPredefinedOption?.label;
		}
		if (selectedRange.start && selectedRange.end) {
			return `${selectedRange?.start?.format('MMM D')} - ${selectedRange?.end?.format('MMM D, YYYY')}`;
		}
		return 'Select Date Range';
	}, [selectedPredefinedOption, selectedRange]);

	return (
		<div className="relative">
			<Popover
				open={isOpen}
				onOpenChange={(open) => {
					setIsOpen(open);
					if (!open) {
						setShowCalendar(false);
					}
				}}
			>
				<PopoverTrigger asChild>
					<button
						className={cn(
							'inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium',
							'text-[#00000099] border border-gray-200 rounded-md',
							'hover:bg-gray-50 transition-colors',
							className,
						)}
					>
						{selectedLabel}
						<ChevronDown className="h-4 w-4" />
					</button>
				</PopoverTrigger>

				<PopoverContent className="w-auto p-0" align="end" sideOffset={4}>
					{/* Options Panel */}
					<div className="min-w-[11.25rem]">
						{predefinedOptions.map((option) => (
							<button
								key={option.key}
								onClick={() => handlePredefinedOptionSelect(option)}
								className={cn(
									'w-full px-4 py-3 text-left text-sm hover:bg-purple-50 transition-colors',
									'flex items-center justify-between',
									selectedPredefinedOption?.key === option.key &&
										'bg-purple-50 text-purple-700',
								)}
							>
								<span className="font-medium">{option.label}</span>
								{selectedPredefinedOption?.key === option.key &&
									!showCalendar && (
										<Check className="h-4 w-4 text-purple-700" />
									)}
							</button>
						))}

						<button
							onClick={handleCustomRangeClick}
							className={cn(
								'w-full px-4 py-3 text-left text-sm hover:bg-purple-50 transition-colors',
								'flex items-center justify-between border-t border-gray-100',
							)}
						>
							<span className="font-medium">Custom range</span>
							<ChevronRight className="h-4 w-4" />
						</button>

						{onClear &&
							(selectedPredefinedOption ||
								(selectedRange.start && selectedRange.end)) && (
								<button
									onClick={handleClearClick}
									className={cn(
										'w-full px-4 py-3 text-left text-sm hover:bg-red-50 transition-colors',
										'flex items-center justify-between border-t border-gray-100',
										'text-red-600 font-medium',
									)}
								>
									Clear Selection
								</button>
							)}
					</div>

					{showCalendar && isOpen && (
						<div
							className="absolute top-0 right-[calc(100%+8px)] z-50"
							style={{ minWidth: '25rem' }}
						>
							<div className="bg-white rounded-lg shadow-lg border border-gray-200">
								<CalendarView
									currentMonth={currentMonth}
									onMonthChange={setCurrentMonth}
									selectedRange={selectedRange}
									onDateClick={handleDateClick}
									onApply={handleApply}
								/>
							</div>
						</div>
					)}
				</PopoverContent>
			</Popover>
		</div>
	);
}
