import React, { memo } from 'react';
import ChartWidget from './ChartWidget';
import InsightsIcon from '@/assets/svg/InsightsIcon';
import { LuTable } from 'react-icons/lu';

/**
 * ChartWidgetCard - A reusable card component that wraps a chart with a header
 * @param {Object} widget - Widget configuration object
 * @param {string} widget.id - Unique identifier for the widget
 * @param {string} widget.title - Widget title
 * @param {string} widget.subtitle - Widget subtitle
 * @param {string} widget.icon - Icon type ('insights' | 'table')
 * @param {Object} widget.chartData - Chart data for ChartWidget
 * @param {Object} widget.options - Chart options for ChartWidget
 * @param {string} widget.type - Widget type ('chart' | 'table')
 * @param {number} widget.colSpan - Grid column span (1 or 2)
 */
const ChartWidgetCard = memo(({ widget }) => {
	const {
		id,
		title,
		subtitle,
		icon = 'insights',
		chartData,
		options,
		type = 'chart',
		colSpan = 1,
	} = widget;

	const IconComponent = icon === 'table' ? LuTable : InsightsIcon;

	if (type === 'table') {
		return null;
	}

	return (
		<div
			className={`bg-white rounded-lg p-6 shadow-sm border border-[#E2E8F0] ${colSpan === 2 ? 'col-span-2' : ''}`}
		>
			<div className="flex items-start gap-3 mb-4">
				<div className="w-9 h-9 bg-white rounded-xl border-2 border-[#E5E7EB] flex items-center justify-center flex-shrink-0">
					<IconComponent className="w-4 h-4 text-purple-100" />
				</div>
				<div className="flex-1">
					<h3 className="text-base font-medium text-[#26064A] mb-1">
						{title}
					</h3>
					<p className="text-sm text-gray-500">{subtitle}</p>
				</div>
			</div>
			<ChartWidget chartData={chartData} options={options} />
		</div>
	);
});

ChartWidgetCard.displayName = 'ChartWidgetCard';

export default ChartWidgetCard;
