/* eslint-disable react/prop-types */
import React, { useEffect, useRef, useState } from 'react';
import GraphRenderer from '@/components/elements/GraphRenderer';
import ScrollList from '@/components/elements/ScrollList';
import { trackEvent } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { getSupportedGraphs } from '@/lib/utils';

const MultiGraphCard = ({ data, isGraphLoading }) => {
	const graphList = data?.content?.graph?.graphs || [];

	const supportedGraphsData = getSupportedGraphs(graphList);

	const [activeGraphTab, setActiveGraphTab] = useState(
		supportedGraphsData?.[0]?.id || null,
	);

	return (
		<div className="mb-4 w-full h-full">
			{isGraphLoading ? (
				<div className="darkSoul-glowing-button2 mb-10">
					<button className="darkSoul-button2" type="button">
						<i className="bi-arrow-clockwise animate-spin text-purple-100 text-lg me-2"></i>
						Generating Graph...
					</button>
				</div>
			) : (
				<>
					<ScrollList>
						{supportedGraphsData?.map((graph) => (
							<li
								key={graph.id}
								className={`${
									activeGraphTab === graph.id
										? 'text-purple-100 border-purple-40 tabActiveBg'
										: 'text-black/60 border-black/10'
								} text-sm font-medium border rounded-3xl px-3 h-full py-2 my-3 cursor-pointer min-w-fit whitespace-nowrap`}
								onClick={() => {
									trackEvent(
										EVENTS_ENUM.DASHBOARD_CONTENT_GRAPH_ITEM_CLICKED,
										EVENTS_REGISTRY.DASHBOARD_CONTENT_GRAPH_ITEM_CLICKED,
										() => ({
											dashboard_id: data?.dashboard_id,
											query_id: data?.query_id,
											dashboard_content_id:
												data?.dashboard_content_id,
											graphId: graph.id,
											graphTitle: graph.title,
										}),
									);
									setActiveGraphTab(graph.id);
								}}
							>
								{graph.title}
							</li>
						))}
					</ScrollList>

					<div className="rounded-3xl border w-full overflow-x-scroll border-primary4 bg-purple-4 p-4 mt-2">
						{supportedGraphsData?.map(
							(graph) =>
								activeGraphTab === graph.id && (
									<GraphRenderer
										key={graph.id}
										graph={graph}
										identifierKey={data.dashboard_content_id}
									/>
								),
						)}
					</div>
				</>
			)}
		</div>
	);
};

export default MultiGraphCard;
