import React, { useState, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ChevronDown, Check } from 'lucide-react';
import {
	LuChartColumn,
	LuChartLine,
	LuChartPie,
	LuChartScatter,
} from 'react-icons/lu';
import { RiDonutChartFill } from 'react-icons/ri';
import { TbChartRadar, TbChartBubble } from 'react-icons/tb';
import { PiChartPolarFill } from 'react-icons/pi';
import { cn } from '@/lib/utils';
import {
	getCompatibleChartTypes,
	isChartTypeCompatible,
} from '@/utils/chart-compatibility';

const CHART_TYPE_OPTIONS = [
	{ key: 'line', label: 'Line Chart', icon: LuChartLine },
	{ key: 'bar', label: 'Bar Chart', icon: LuChartColumn },
	{ key: 'pie', label: 'Pie Chart', icon: LuChartPie },
	{ key: 'doughnut', label: 'Doughnut Chart', icon: RiDonutChartFill },
	{ key: 'polararea', label: 'Polar Area Chart', icon: PiChartPolarFill },
	{ key: 'scatter', label: 'Scatter Chart', icon: LuChartScatter },
	{ key: 'bubble', label: 'Bubble Chart', icon: TbChartBubble },
	{ key: 'radar', label: 'Radar Chart', icon: TbChartRadar },
];

/**
 * ChartTypeDropdown - Dropdown for selecting chart type with compatibility validation
 *
 * @param {string} value - Currently selected chart type
 * @param {string} originalChartType - Original chart type from dashboard/API
 * @param {Function} onChange - Callback when chart type changes
 */
const ChartTypeDropdown = ({ value = 'line', originalChartType, onChange }) => {
	const [open, setOpen] = useState(false);

	const selectedOption =
		CHART_TYPE_OPTIONS.find((opt) => opt.key === value) || CHART_TYPE_OPTIONS[0];

	const IconComponent = selectedOption.icon;

	// Get compatible chart types based on original type
	const compatibleTypes = useMemo(() => {
		if (!originalChartType) return CHART_TYPE_OPTIONS.map((opt) => opt.key);
		return getCompatibleChartTypes(originalChartType);
	}, [originalChartType]);

	// Filter options to only show compatible types
	const visibleOptions = useMemo(() => {
		return CHART_TYPE_OPTIONS.filter((option) =>
			compatibleTypes.includes(option.key),
		);
	}, [compatibleTypes]);

	const handleSelect = (key) => {
		if (isChartTypeCompatible(originalChartType || value, key)) {
			if (onChange) {
				onChange(key);
			}
			setOpen(false);
		}
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
					<IconComponent className="w-4 h-4" />
					<span>{selectedOption.label}</span>
					<ChevronDown className="w-4 h-4" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" sideOffset={4} align="end">
				<div className="min-w-[11.25rem] py-2">
					<div className="px-2 flex flex-col gap-1">
						{visibleOptions.map((option) => {
							const OptionIcon = option.icon;
							const isSelected = selectedOption.key === option.key;

							return (
								<button
									key={option.key}
									onClick={() => handleSelect(option.key)}
									className={cn(
										'w-full px-4 py-2.5 text-left text-sm flex items-center justify-between rounded-md transition-colors',
										'hover:bg-gray-100 cursor-pointer',
										isSelected && 'bg-[#FAF5FF] text-[#6A12CD]',
									)}
								>
									<span className="font-medium flex items-center gap-2">
										<OptionIcon className="w-4 h-4" />
										{option.label}
									</span>
									{isSelected && (
										<Check className="w-4 h-4 text-[#6A12CD]" />
									)}
								</button>
							);
						})}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
};

export default ChartTypeDropdown;
