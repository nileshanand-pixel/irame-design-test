import React from 'react';
import { Button } from '@/components/ui/button';
import { LuTrash2 } from 'react-icons/lu';
import GraphRenderer from '@/components/elements/GraphRenderer';
import InsightsIcon from '@/assets/svg/InsightsIcon';

const DEFAULT_GRAPH_TITLE = 'Invoice Processing & Duplicate Detection';

/**
 * @param {Object} props
 * @param {Object} props.graph - The graph data object
 * @param {Object} props.item - The dashboard content item containing the graph
 * @param {boolean} props.isEditModeActive - Whether edit mode is currently active
 * @param {Function} props.onGraphClick - Callback when graph is clicked (for viewing details)
 * @param {Function} props.onDeleteClick - Callback when delete button is clicked
 * @param {boolean} props.isDeleting - Whether this specific graph is being deleted
 */
const DashboardGraphCard = ({
	graph,
	item,
	isEditModeActive,
	onGraphClick,
	onDeleteClick,
	isDeleting = false,
}) => {
	const graphTitle =
		graph.title ||
		item?.content?.graph?.title ||
		item?.content?.query ||
		DEFAULT_GRAPH_TITLE;

	const handleCardClick = () => {
		if (onGraphClick) {
			onGraphClick(graph, item);
		}
	};

	const handleDelete = (e) => {
		e.stopPropagation();
		if (onDeleteClick) {
			onDeleteClick(item.dashboard_content_id, graph.id, 'graph');
		}
	};

	return (
		<div
			key={`${item.dashboard_content_id}-${graph.id}`}
			onClick={handleCardClick}
			className={`bg-white rounded-[0.875rem] p-4 shadow-sm border border-[#E2E8F0] cursor-pointer hover:shadow-md transition-shadow relative group w-full min-w-0 ${
				isDeleting ? 'opacity-60 pointer-events-none' : ''
			}`}
		>
			{isEditModeActive && (
				<Button
					onClick={handleDelete}
					variant="outline"
					size="icon"
					disabled={isDeleting}
					className="absolute -top-4 -right-4 w-10 h-10 bg-white shadow-md rounded-lg flex items-center justify-center hover:bg-red-50 transition-all z-10 opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
					title={isDeleting ? 'Deleting...' : 'Delete Widget'}
					type="button"
					aria-label="Delete graph widget"
				>
					{isDeleting ? (
						<i className="bi-arrow-clockwise animate-spin text-red-500"></i>
					) : (
						<LuTrash2 className="w-4 h-4 text-red-500" />
					)}
				</Button>
			)}

			<div className="flex items-center gap-3 mb-3">
				<div className="w-9 h-9 bg-white rounded-xl border-2 border-[#E5E7EB] flex items-center justify-center flex-shrink-0">
					<InsightsIcon className="w-4 h-4 text-[#6A12CD]" />
				</div>
				<div className="flex-1 min-w-0">
					<h3 className="text-sm font-medium text-[#26064A] truncate w-full">
						{graphTitle}
					</h3>
					{/* <p className="text-xs text-[#26064ACC]">
						Real-time analytics and insights
					</p> */}
				</div>
			</div>

			<div className="rounded-3xl border w-full overflow-x-auto border-primary4 bg-purple-4 p-3 min-w-0">
				<GraphRenderer
					graph={graph}
					identifierKey={`${item.dashboard_content_id}-${graph.id}`}
				/>
			</div>
		</div>
	);
};

export default DashboardGraphCard;
