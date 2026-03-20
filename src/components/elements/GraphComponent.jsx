/* eslint-disable react/prop-types */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import TableComponent from './TableComponent';
import * as d3 from 'd3';
import * as XLSX from 'xlsx';
import { DataTableColumnHeader } from './data-table/components/data-table-column-header';
import { useDispatch, useSelector } from 'react-redux';
import { updateChatStoreProp } from '@/redux/reducer/chatReducer.js';
import GraphRenderer from './GraphRenderer';
import ScrollList from './ScrollList';
import TableResponse from './TableResponse';
import { trackEvent } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { logError } from '@/lib/logger';
import { getSupportedGraphs, cn } from '@/lib/utils';
import { useRouter } from '@/hooks/useRouter';
import { RESPONSE_CARD_VIEWS } from '@/constants/chat.constant';
import useDatasourceDetailsV2 from '@/api/datasource/hooks/useDatasourceDetailsV2';

const GraphComponent = ({
	data,
	extraction,
	isGraphLoading,
	setIsGraphLoading,
	showTable,
	queryId,
	tab = RESPONSE_CARD_VIEWS.TABULAR_VIEW,
	page = null,
	contentItem = null,
}) => {
	const [loadedData, setLoadedData] = useState([]);
	const [columns, setColumns] = useState([]);
	const [activeTab, setActiveTab] = useState(tab);
	const [activeExtractionTab, setActiveExtractionTab] = useState(
		extraction ? Object.keys(extraction.tool_data)[0] : null,
	);
	const [isCsvLoaded, setIsCsvLoaded] = useState(false);
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

	const { data: datasourceData } = useDatasourceDetailsV2();

	const visibleTabs = Object.values(RESPONSE_CARD_VIEWS).filter((tab) => {
		if (tab === RESPONSE_CARD_VIEWS.EXTRACTIONS) return !!extraction;
		if (tab === RESPONSE_CARD_VIEWS.GRAPHICAL_VIEW) return graphList.length > 0;
		return true;
	});

	console.log(loadedData, 'loadedData');
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
					const urlPath = url?.split('?')?.[0]?.toLowerCase();
					const isXlsx =
						urlPath?.endsWith('.xlsx') || urlPath?.endsWith('.xls');

					let parsedData;
					if (isXlsx) {
						const response = await fetch(url);
						const arrayBuffer = await response?.arrayBuffer();
						const workbook = arrayBuffer
							? XLSX.read(arrayBuffer, { type: 'array' })
							: null;
						const sheetName = workbook?.SheetNames?.[0];
						const firstSheet = sheetName
							? workbook?.Sheets?.[sheetName]
							: null;
						parsedData = firstSheet
							? XLSX.utils.sheet_to_json(firstSheet, { defval: '' })
							: [];
					} else {
						parsedData = await d3.csv(url);
					}

					if (!parsedData?.length) return;

					setLoadedData(parsedData);
					setColumns(generateColumns(Object.keys(parsedData?.[0] ?? {})));
				} catch (error) {
					logError(error, {
						feature: 'graphComponent',
						action: 'loadCSVData',
						extra: {
							url,
							errorMessage: error.message,
						},
					});
				} finally {
					setIsGraphLoading(false);
					setIsCsvLoaded(true);
				}
			};

			if (loadedData.length === 0) {
				fetchData();
			}
		}
	}, [data, loadedData.length, setIsGraphLoading]);

	const onSortingChange = () => {
		trackEvent(
			EVENTS_ENUM.TABLE_VIEW_CHANGED,
			EVENTS_REGISTRY.TABLE_VIEW_CHANGED,
			() => ({
				chat_session_id: query?.sessionId,
				dataset_id: datasourceData?.datasource_id,
				dataset_name: datasourceData?.name,
				query_id: queryId,
			}),
		);
	};
	return (
		<div className="">
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
						{visibleTabs.map((item, indx) => (
							<li
								key={`${queryId}_${indx}`}
								className={`!py-0 ${
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
													datasourceData?.datasource_id,
												dataset_name: datasourceData?.name,
												query_id: queryId,
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
													datasourceData?.datasource_id,
												dataset_name: datasourceData?.name,
												query_id: queryId,
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
										} text-sm font-medium border rounded-2xl px-3 h-full py-2 mb-2 cursor-pointer min-w-fit whitespace-nowrap`}
										onClick={() => {
											setActiveGraphTab(graph.id);
											trackEvent(
												EVENTS_ENUM.ANALYSIS_GRAPH_VARIANT_CLICKED,
												EVENTS_REGISTRY.ANALYSIS_GRAPH_VARIANT_CLICKED,
												() => ({
													chat_session_id:
														query?.sessionId,
													dataset_id:
														datasourceData?.datasource_id,
													dataset_name:
														datasourceData?.name,
													query_id: queryId,
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

							<div className="rounded-3xl w-full overflow-x-scroll">
								{supportedGraphsData?.map(
									(graph) =>
										activeGraphTab === graph.id && (
											<div className="w-full">
												<GraphRenderer
													key={`${queryId}_${graph.id}`}
													graph={graph}
													identifierKey={queryId}
													page={page}
													contentItem={contentItem}
												/>
											</div>
										),
								)}
							</div>
						</>
					)}
					{activeTab === RESPONSE_CARD_VIEWS.TABULAR_VIEW && (
						<div className="rounded-2xl border w-full custom-scrollbar-graph border-primary4">
							{!isCsvLoaded ? (
								<div className="darkSoul-glowing-button2 mb-10">
									<button
										className="darkSoul-button2"
										type="button"
									>
										<i className="bi-arrow-clockwise animate-spin text-purple-100 text-lg me-2"></i>
										Generating Table...
									</button>
								</div>
							) : (
								<TableComponent
									data={loadedData}
									columns={columns}
									onSortingChange={onSortingChange}
								/>
							)}
						</div>
					)}
					{activeTab === RESPONSE_CARD_VIEWS.EXTRACTIONS && extraction && (
						<>
							<ScrollList>
								{Object.keys(extraction.tool_data).map((label) => (
									<li
										key={label}
										className={`text-sm font-medium border rounded-2xl px-3 h-full py-2 mb-2 cursor-pointer min-w-fit whitespace-nowrap ${
											activeExtractionTab === label
												? 'text-purple-100 border-purple-40 tabActiveBg'
												: 'text-black/60 border-black/10'
										}`}
										onClick={() => setActiveExtractionTab(label)}
									>
										{label}
									</li>
								))}
							</ScrollList>
							{activeExtractionTab && (
								<TableResponse
									data={extraction.tool_data[activeExtractionTab]}
									isGraphLoading={false}
									setIsGraphLoading={() => {}}
									noStyles={true}
								/>
							)}
						</>
					)}
				</>
			)}
		</div>
	);
};

export default GraphComponent;
