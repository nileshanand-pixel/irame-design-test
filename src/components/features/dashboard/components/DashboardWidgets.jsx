import React, { useMemo } from 'react';
import DashboardGraphCard from './DashboardGraphCard';
import DashboardTableCard from './DashboardTableCard';

/**
 * DashboardWidgets Component
 * @param {Object} props
 * @param {Object} props.item - The dashboard content item
 * @param {boolean} props.isEditModeActive - Whether edit mode is currently active
 * @param {Function} props.onTableClick - Callback when a table is clicked
 * @param {Function} props.onDeleteClick - Callback when delete button is clicked
 * @param {Set} props.deletingItems - Set of items being deleted (format: "contentId-itemId")
 */
const DashboardWidgets = ({
	item,
	isEditModeActive,
	onTableClick,
	onDeleteClick,
	deletingItems = new Set(),
}) => {
	const widgets = useMemo(() => {
		const widgetList = [];
		const normalizedGraphs = item.normalizedGraphs || [];

		console.log(normalizedGraphs, 'normalizedGraphs');
		// Add all graph widgets
		normalizedGraphs.forEach((graph) => {
			const isDeleting = deletingItems.has(
				`${item.dashboard_content_id}-${graph.id}`,
			);

			widgetList.push(
				<DashboardGraphCard
					key={`${item.dashboard_content_id}-${graph.id}`}
					graph={graph}
					item={item}
					isEditModeActive={isEditModeActive}
					onDeleteClick={onDeleteClick}
					isDeleting={isDeleting}
				/>,
			);
		});

		// Add table widget if it exists
		if (item?.content?.table) {
			const tableData = item.content.table;
			const tableUrl = tableData?.csv_url || tableData?.sample_url;
			const normalizedUrl = tableUrl ? tableUrl.split('?')[0] : '';
			const isDeleting = deletingItems.has(
				`${item.dashboard_content_id}-${normalizedUrl}`,
			);

			widgetList.push(
				<DashboardTableCard
					key={`${item.dashboard_content_id}-table`}
					item={item}
					isEditModeActive={isEditModeActive}
					onTableClick={onTableClick}
					onDeleteClick={onDeleteClick}
					isDeleting={isDeleting}
				/>,
			);
		}

		return widgetList;
	}, [item, isEditModeActive, onTableClick, onDeleteClick, deletingItems]);

	return <>{widgets}</>;
};

export default DashboardWidgets;
