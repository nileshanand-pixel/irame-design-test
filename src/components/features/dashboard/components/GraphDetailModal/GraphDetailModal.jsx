import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X } from 'lucide-react';
import { LuChartColumn, LuFileText } from 'react-icons/lu';
import { HiOutlineClipboardDocumentList } from 'react-icons/hi2';
import Chart from 'chart.js/auto';
import { FaBell } from 'react-icons/fa6';
import VisualizationTab from './VisualizationTab';
import DetailedRecordsTab from './DetailedRecordsTab';
import SummaryTab from './SummaryTab';
import DateRangeDropdown from './DateRangeDropdown';
import GranularityDropdown from './GranularityDropdown';
import ChartTypeDropdown from './ChartTypeDropdown';
import SettingsDropdown from './SettingsDropdown';
import { logError } from '@/lib/logger';
import { toast } from '@/lib/toast';
import {
	normalizeChartTypeForDropdown,
	isChartTypeCompatible,
	getIncompatibleConversionMessage,
} from '@/utils/chart-compatibility';
import { cn } from '@/lib/utils';
import { PAGE_TYPES } from '@/constants/page.constant';

/**
 * GraphDetailModal - Modal that displays graph details with 3 tabs and 2 tabs for tables)
 * @param {boolean} open - Whether modal is open
 * @param {Function} onOpenChange - Callback when modal state changes
 * @param {Object} selectedGraph - The clicked graph object (null for tables)
 * @param {Object} contentItem - The dashboard content item containing the graph/table
 * @param {string} page - The current page type (qna, dashboard, reports)
 */
const GraphDetailModal = ({
	open,
	onOpenChange,
	selectedGraph,
	contentItem,
	page = PAGE_TYPES.DASHBOARD,
}) => {
	const isTable = !selectedGraph && contentItem?.content?.table;
	const [activeTab, setActiveTab] = useState(
		isTable ? 'detailed-records' : 'visualization',
	);

	useEffect(() => {
		if (open) {
			setActiveTab(isTable ? 'detailed-records' : 'visualization');
		}
	}, [open, isTable]);
	const [dateRange, setDateRange] = useState('30d');
	const [granularity, setGranularity] = useState('day');
	const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });
	const tabsListRef = useRef(null);
	const tabsContainerRef = useRef(null);
	const visualizationTabRef = useRef(null);
	const detailedRecordsTabRef = useRef(null);
	const summaryTabRef = useRef(null);

	// Tab configuration
	const tabs = useMemo(
		() => [
			{
				id: 'visualization',
				label: 'Visualization',
				icon: LuChartColumn,
				ref: visualizationTabRef,
				show: !isTable, // Only show for graphs
			},
			{
				id: 'detailed-records',
				label: 'Detailed Records',
				icon: LuFileText,
				ref: detailedRecordsTabRef,
				show: true, // Show for both graphs and tables
			},
			{
				id: 'summary',
				label: 'Summary',
				icon: HiOutlineClipboardDocumentList,
				ref: summaryTabRef,
				show: page !== PAGE_TYPES.QNA && page !== PAGE_TYPES.REPORTS,
			},
		],
		[isTable, page],
	);

	const originalChartType = useMemo(() => {
		const graphType = selectedGraph?.type;

		if (!graphType) return 'line';

		return normalizeChartTypeForDropdown(graphType);
	}, [selectedGraph, contentItem]);

	const [chartType, setChartType] = useState(originalChartType);
	const [isGraphReady, setIsGraphReady] = useState(false);
	const MODAL_ANIMATION_DELAY = 300; // Matches CSS transition time

	useEffect(() => {
		if (open) {
			const timer = setTimeout(() => {
				setIsGraphReady(true);
			}, MODAL_ANIMATION_DELAY);
			return () => clearTimeout(timer);
		} else {
			setIsGraphReady(false);
		}
	}, [open]);

	useEffect(() => {
		if (open && originalChartType) {
			setChartType(originalChartType);
		}
	}, [open, originalChartType]);

	const modalTitle = useMemo(() => {
		if (isTable) {
			return contentItem?.content?.query || 'Table Details';
		}

		return selectedGraph?.title || 'Graph Details';
	}, [selectedGraph, contentItem, isTable]);

	const identifierKey = useMemo(() => {
		if (isTable) {
			return `modal-table-${contentItem?.dashboard_content_id}`;
		}
		return `modal-${contentItem?.dashboard_content_id}-${selectedGraph?.id}`;
	}, [contentItem?.dashboard_content_id, selectedGraph?.id, isTable]);

	useEffect(() => {
		const updateUnderline = () => {
			if (!tabsListRef.current || !tabsContainerRef.current) return;

			let activeTabRef = null;
			switch (activeTab) {
				case 'visualization':
					if (!isTable) {
						activeTabRef = visualizationTabRef.current;
					}
					break;
				case 'detailed-records':
					activeTabRef = detailedRecordsTabRef.current;
					break;
				case 'summary':
					activeTabRef = summaryTabRef.current;
					break;
				default:
					return;
			}

			if (activeTabRef && tabsContainerRef.current) {
				const containerRect =
					tabsContainerRef.current.getBoundingClientRect();
				const activeTabRect = activeTabRef.getBoundingClientRect();

				// Calculate position relative to the container (which has px-6 padding)
				setUnderlineStyle({
					left: activeTabRect.left - containerRect.left,
					width: activeTabRect.width,
				});
			}
		};

		// Small delay to ensure DOM is ready
		const timeoutId = setTimeout(updateUnderline, 0);

		// Also update on window resize
		window.addEventListener('resize', updateUnderline);
		return () => {
			clearTimeout(timeoutId);
			window.removeEventListener('resize', updateUnderline);
		};
	}, [activeTab, open]);

	// Cleanup chart when modal closes
	useEffect(() => {
		if (!open && selectedGraph?.id) {
			// Destroy any charts associated with this modal when it closes
			const canvasId = `canvas_${identifierKey}_${selectedGraph.id}`;
			const ctx = document.getElementById(canvasId);
			if (ctx) {
				const existingChart = Chart.getChart(ctx);
				if (existingChart) {
					try {
						existingChart.destroy();
					} catch (error) {
						logError(error, {
							feature: 'dashboard',
							action: 'chart-cleanup',
							extra: {
								errorMessage: error.message,
								canvasId: canvasId,
								identifierKey,
								graphId: selectedGraph?.id,
							},
						});
					}
				}
			}
		}
	}, [open, identifierKey, selectedGraph?.id]);

	if (!contentItem) {
		return null;
	}

	// If it's not a table and there's no selectedGraph, don't render
	if (!isTable && !selectedGraph) {
		return null;
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="w-[90vw] h-[90vh] max-w-none shadow-lg rounded-lg p-0"
				// hideClose
			>
				<Tabs
					value={activeTab}
					onValueChange={setActiveTab}
					className="flex-1 flex flex-col overflow-hidden"
				>
					<div
						ref={tabsContainerRef}
						className="px-6 pt-3 border-b border-[#0000001A]"
					>
						<div className="flex items-center justify-between">
							<TabsList
								ref={tabsListRef}
								className="bg-transparent flex justify-start gap-8 border-none h-auto relative p-0"
							>
								{tabs
									.filter((tab) => tab.show)
									.map((tab) => {
										const Icon = tab.icon;
										return (
											<TabsTrigger
												key={tab.id}
												ref={tab.ref}
												value={tab.id}
												className={cn(
													'relative flex items-center gap-2 px-0 py-2 text-sm',
													activeTab === tab.id
														? 'text-primary font-semibold'
														: 'text-primary80 font-medium',
												)}
											>
												<Icon
													className={`size-[1.125rem] transition-colors duration-300 ${
														activeTab === tab.id
															? 'text-primary'
															: 'text-primary80'
													}`}
												/>
												<span>{tab.label}</span>
												{activeTab === tab.id ? (
													<div className="absolute bottom-0 left-0 translate-y-[50%] w-full h-1 rounded-[0.125rem] bg-primary"></div>
												) : null}
											</TabsTrigger>
										);
									})}
							</TabsList>

							<div className="flex items-center gap-4">
								{/* TODO: Add alert icon and count - Not in scope for now */}
								{/* <div className="relative">
									<FaBell className="w-5 h-5 text-gray-500" />
									<span className="absolute -top-1 -right-1 w-4 h-4 bg-[#6A12CD] rounded-full flex items-center justify-center">
										<span className="text-[10px] text-white font-medium">
											1
										</span>
									</span>
								</div> */}
								{/* <button
									onClick={() => onOpenChange(false)}
									className="text-gray-500 hover:text-gray-700 transition-colors"
								>
									<X className="w-5 h-5" />
								</button> */}
							</div>
						</div>
					</div>

					{/* Graph Name and Controls Section - Only show for graphs */}
					{!isTable && activeTab === 'visualization' && (
						<div className="px-6 py-3 border-b border-[#0000001A]">
							<div className="flex items-center justify-between">
								<h2 className="text-xl font-medium text-primary100">
									{modalTitle}
								</h2>

								<div className="flex items-center gap-3">
									{/* <DateRangeDropdown
										value={dateRange}
										onChange={setDateRange}
									/>
									<GranularityDropdown
										value={granularity}
										onChange={setGranularity}
									/> */}
									<ChartTypeDropdown
										value={chartType}
										originalChartType={originalChartType}
										onChange={(newChartType) => {
											// Validate conversion compatibility
											if (
												isChartTypeCompatible(
													originalChartType,
													newChartType,
												)
											) {
												setChartType(newChartType);
											} else {
												// Show error toast for incompatible conversion
												const errorMessage =
													getIncompatibleConversionMessage(
														originalChartType,
														newChartType,
													);
												toast.error(errorMessage);
											}
										}}
									/>
									{/* TODO: Add settings dropdown - Not in scope for now */}
									{/* <SettingsDropdown /> */}
								</div>
							</div>
						</div>
					)}

					{/* {isTable && (
						<div className="px-6 py-4 border-b border-[#F3F4F6]">
							<h2 className="text-xl font-semibold text-[#26064A]">
								{modalTitle}
							</h2>
						</div>
					)} */}

					<div className="flex-1 overflow-hidden flex flex-col">
						{!isTable && (
							<TabsContent
								value="visualization"
								className="mt-0 flex-1 overflow-hidden"
							>
								<VisualizationTab
									graph={selectedGraph}
									identifierKey={identifierKey}
									chartType={chartType}
									isReady={isGraphReady}
								/>
							</TabsContent>
						)}

						<TabsContent
							value="detailed-records"
							className="mt-0 h-full"
						>
							<DetailedRecordsTab
								table={contentItem?.content?.table}
								dashboardId={contentItem?.dashboard_id}
								dashboardName={contentItem?.dashboard_name}
								dashboardContentId={
									contentItem?.dashboard_content_id
								}
								queryId={contentItem?.query_id}
								queryText={contentItem?.content?.query}
							/>
						</TabsContent>

						<TabsContent value="summary" className="mt-0 h-full">
							<SummaryTab
								summary={contentItem?.content?.summary}
								query={contentItem?.content?.query}
								title={modalTitle}
								sessionId={contentItem?.content?.session_id}
								datasourceId={contentItem?.content?.datasource_id}
								dashboardId={contentItem?.dashboard_id}
								dashboardName={contentItem?.dashboard_name}
								dashboardContentId={
									contentItem?.dashboard_content_id
								}
								queryId={contentItem?.query_id}
							/>
						</TabsContent>
					</div>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
};

export default GraphDetailModal;
