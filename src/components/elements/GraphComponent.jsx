/* eslint-disable react/prop-types */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import TableComponent from './TableComponent';
import * as d3 from 'd3';
import { DataTableColumnHeader } from './data-table/components/data-table-column-header';
import { useDispatch, useSelector } from 'react-redux';
import { updateChatStoreProp } from '@/redux/reducer/chatReducer.js';
import GraphRenderer from './GraphRenderer';
import ScrollList from './ScrollList';
import { trackEvent } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { getSupportedGraphs } from '@/lib/utils';
import { useRouter } from '@/hooks/useRouter';
import { RESPONSE_CARD_VIEWS } from '@/constants/chat.constant';

const GraphComponent = ({
	data,
	isGraphLoading,
	setIsGraphLoading,
	showTable,
	queryId,
	tab = RESPONSE_CARD_VIEWS.TABULAR_VIEW,
}) => {
	const [loadedData, setLoadedData] = useState([]);
	const [columns, setColumns] = useState([]);
	const [activeTab, setActiveTab] = useState(tab);
	const graphList = data?.graph?.tool_data?.graphs || [];
	const tableData = data?.table?.tool_data;
	const dispatch = useDispatch();
	const chatStoreReducer = useSelector((state) => state.chatStoreReducer);
	const { query } = useRouter();
	const utilReducer = useSelector((state) => state.utilReducer);

	const containerRef = useRef(null);
	const [isOverflowing, setIsOverflowing] = useState(false);

	const supportedGraphsData = getSupportedGraphs(graphList);
	const [activeGraphTab, setActiveGraphTab] = useState(
		supportedGraphsData?.[0]?.id || null,
	);

	function generateColumns(keys) {
		return keys?.map((key) => {
			let headerTitle = key.replace(/_/g, ' ').toUpperCase();

			return {
				accessorKey: key,
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title={headerTitle} />
				),
				cell: ({ row }) => <div className="p-1">{row?.original?.[key]}</div>,
				enableSorting: true,
				enableHiding: false,
			};
		});
	}

	useEffect(() => {
		if (tableData && tableData.csv_url) {
			let url = tableData?.sample_url || tableData?.csv_url;
			const fetchData = async () => {
				try {
					const csvData = await d3.csv(url);
					setLoadedData(csvData);
					setColumns(generateColumns(Object.keys(csvData[0])));
				} catch (error) {
					console.error('Error loading CSV data:', error);
				} finally {
					setIsGraphLoading(false);
				}
			};

			if (loadedData.length === 0) {
				fetchData();
			}
		}
	}, [data, loadedData.length, setIsGraphLoading]);

	useEffect(() => {
		if (
			chatStoreReducer?.activateGraphOnLast &&
			chatStoreReducer?.activeQueryId === queryId
		) {
			dispatch(
				updateChatStoreProp([
					{
						key: 'activateGraphOnLast',
						value: false,
					},
				]),
			);
		}
	}, [chatStoreReducer?.activateGraphOnLast]);

	const onSortingChange = () => {
		trackEvent(
			EVENTS_ENUM.TABLE_VIEW_CHANGED,
			EVENTS_REGISTRY.TABLE_VIEW_CHANGED,
			() => ({
				chat_session_id: query?.sessionId,
				dataset_id: utilReducer?.selectedDataSource?.id,
				dataset_name: utilReducer?.selectedDataSource?.name,
				query_id: chatStoreReducer?.activeQueryId,
				change_type: 'sorting',
			}),
		);
	};

	return (
		<div className="mb-4">
			{isGraphLoading ? (
				<div className="darkSoul-glowing-button2 mb-10">
					<button className="darkSoul-button2" type="button">
						<i className="bi-arrow-clockwise animate-spin text-purple-100 text-lg me-2"></i>
						Generating Graph...
					</button>
				</div>
			) : (
				<>
					<ul className="ghost-tabs relative col-span-12 mb-2 inline-flex w-full border-b border-black-10">
						{Object.values(RESPONSE_CARD_VIEWS).map((item, indx) => (
							<li
								key={`${queryId}_${indx}`}
								className={`!pb-0 ${
									activeTab === item ? 'active-tab' : 'default-tab'
								}`}
								onClick={() => {
									if (item === RESPONSE_CARD_VIEWS.TABULAR_VIEW) {
										trackEvent(
											EVENTS_ENUM.TABULAR_VIEW_TAB_CLICKED,
											EVENTS_REGISTRY.TABULAR_VIEW_TAB_CLICKED,
											() => ({
												chat_session_id: query?.sessionId,
												dataset_id:
													utilReducer?.selectedDataSource
														?.id,
												dataset_name:
													utilReducer?.selectedDataSource
														?.name,
												query_id:
													chatStoreReducer?.activeQueryId,
											}),
										);
									} else if (
										item === RESPONSE_CARD_VIEWS.GRAPHICAL_VIEW
									) {
										trackEvent(
											EVENTS_ENUM.GRAPHICAL_VIEW_TAB_CLICKED,
											EVENTS_REGISTRY.GRAPHICAL_VIEW_TAB_CLICKED,
											() => ({
												chat_session_id: query?.sessionId,
												dataset_id:
													utilReducer?.selectedDataSource
														?.id,
												dataset_name:
													utilReducer?.selectedDataSource
														?.name,
												query_id:
													chatStoreReducer?.activeQueryId,
											}),
										);
									}
									setActiveTab(item);
								}}
							>
								{item}
							</li>
						))}
					</ul>
					{activeTab === RESPONSE_CARD_VIEWS.GRAPHICAL_VIEW && (
						<>
							<ScrollList>
								{supportedGraphsData?.map((graph, index) => (
									<li
										key={graph.id}
										className={`${
											activeGraphTab === graph.id
												? 'text-purple-100 border-purple-40 tabActiveBg'
												: 'text-black/60 border-black/10'
										} text-sm font-medium border rounded-3xl px-3 h-full py-2 my-3 cursor-pointer min-w-fit whitespace-nowrap`}
										onClick={() => {
											setActiveGraphTab(graph.id);
											trackEvent(
												EVENTS_ENUM.ANALYSIS_GRAPH_VARIANT_CLICKED,
												EVENTS_REGISTRY.ANALYSIS_GRAPH_VARIANT_CLICKED,
												() => ({
													chat_session_id:
														query?.sessionId,
													dataset_id:
														utilReducer
															?.selectedDataSource?.id,
													dataset_name:
														utilReducer
															?.selectedDataSource
															?.name,
													query_id:
														chatStoreReducer?.activeQueryId,
													graph_id: graph.id,
													graph_name: graph.title,
													graph_type: graph.type,
												}),
											);
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
											<div className="w-full">
												<GraphRenderer
													key={`${queryId}_${graph.id}`}
													graph={graph}
													identifierKey={queryId}
												/>
											</div>
										),
								)}
							</div>
						</>
					)}
					{activeTab === RESPONSE_CARD_VIEWS.TABULAR_VIEW && (
						<div className="rounded-3xl border w-full overflow-x-scroll border-primary4 bg-purple-4 p-4 mt-2">
							<div className="bg-white rounded-3xl py-2">
								<TableComponent
									data={loadedData}
									columns={columns}
									onSortingChange={onSortingChange}
								/>
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
};

export default GraphComponent;
