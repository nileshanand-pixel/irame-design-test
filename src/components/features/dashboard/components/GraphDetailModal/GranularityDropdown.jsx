import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const GRANULARITY_OPTIONS = [
	{ key: 'hour', label: 'Hour' },
	{ key: 'day', label: 'Day' },
	{ key: 'week', label: 'Week' },
	{ key: 'month', label: 'Month' },
	{ key: 'quarter', label: 'Quarter' },
	{ key: 'year', label: 'Year' },
];

const GranularityDropdown = ({ value = 'day', onChange }) => {
	const [open, setOpen] = useState(false);

	const selectedOption =
		GRANULARITY_OPTIONS.find((opt) => opt.key === value) ||
		GRANULARITY_OPTIONS[1];

	const handleSelect = (key) => {
		if (onChange) {
			onChange(key);
		}
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className={cn(
						'border-gray-200 text-[#26064A] bg-white hover:bg-gray-50',
						'px-3 py-2 h-auto font-medium flex items-center gap-2',
					)}
				>
					<span>{selectedOption.label}</span>
					<ChevronDown className="w-4 h-4" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
				<div className="min-w-[150px] py-2">
					<div className="px-2">
						{GRANULARITY_OPTIONS.map((option) => (
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
								<span className="font-medium">{option.label}</span>
								{selectedOption.key === option.key && (
									<Check className="w-4 h-4 text-[#6A12CD]" />
								)}
							</button>
						))}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
};

export default GranularityDropdown;
