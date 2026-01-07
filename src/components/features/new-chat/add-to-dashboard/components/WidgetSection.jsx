import React from 'react';
import CollapsibleWidget from './CollapsibleWidget';
import WidgetCard from './WidgetCard';
import { WIDGET_TYPES } from '../constants';
import CircularLoader from '@/components/elements/loading/CircularLoader';
import { cn } from '@/lib/utils';

const WidgetSection = ({
	title,
	widgets = [],
	type,
	selectedWidgetId,
	onToggleSelect,
	isLoading = false,
	emptyMessage = `No ${title.toLowerCase()} available for this query`,
	gridCols = type === WIDGET_TYPES.GRAPH ? 'grid-cols-2' : '',
}) => {
	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-8">
				<CircularLoader size="sm" />
				<span className="ml-2 text-sm text-gray-600">
					Loading {title.toLowerCase()}...
				</span>
			</div>
		);
	}

	if (widgets.length === 0) {
		return null;
		// return (
		// 	<CollapsibleWidget title={title} defaultExpanded={true}>
		// 		<div className="text-center py-4 text-sm text-gray-500">
		// 			{emptyMessage}
		// 		</div>
		// 	</CollapsibleWidget>
		// );
	}

	return (
		<CollapsibleWidget title={title} defaultExpanded={true}>
			<div
				className={cn(
					gridCols ? `grid ${gridCols} gap-4` : 'space-y-4 border',
				)}
			>
				{widgets.map((widget) => (
					<WidgetCard
						key={widget.id}
						widget={widget}
						type={type}
						isSelected={selectedWidgetId === widget.id}
						onToggleSelect={(widget) => onToggleSelect(widget, type)}
					/>
				))}
			</div>
		</CollapsibleWidget>
	);
};

export default WidgetSection;
