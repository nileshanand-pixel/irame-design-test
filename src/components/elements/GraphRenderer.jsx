import React, { useEffect, useRef, useState, useCallback } from 'react';
import Chart from 'chart.js/auto';
import zoomPlugin from 'chartjs-plugin-zoom';
import * as d3 from 'd3';
import { FullScreen, useFullScreenHandle } from 'react-full-screen';
import { Button } from '../ui/button';
import { GraphCategoryFilter } from './GraphCategoryFilter';
import ChartBrushOverlay from './ChartBrushOverlay';
import { debounce } from 'lodash';
import { cn, getChartType } from '@/lib/utils';
import useS3File from '@/hooks/useS3File';
import { logError } from '@/lib/logger';
import { toChartJsType } from '@/utils/chart-compatibility';
import { GRAPH_SOURCES, PAGE_TYPES } from '@/constants/page.constant';
import GraphDetailModal from '@/components/features/dashboard/components/GraphDetailModal/GraphDetailModal';
import { LucideBarChart3 } from 'lucide-react';

Chart.register(zoomPlugin);

// Returns axis limits to show in UI on basis of where graph is rendered.
const X_AXIS_LIMITS = {
	[GRAPH_SOURCES.ADD_TO_DASHBOARD]: 5,
	[GRAPH_SOURCES.ADD_TO_REPORTS]: 5,
	DEFAULT: 15,
};

const getXAxisMax = (source, previewMode) => {
	if (!previewMode) return undefined;
	return X_AXIS_LIMITS[source] || X_AXIS_LIMITS.DEFAULT;
};

// ChartControls - Reusable controls for the graph.
const ChartControls = ({
	isZoomEnabled,
	isSelectionToolActive,
	handleToggleSelectionTool,
	isZoomed,
	handleResetZoom,
	onFullscreenToggle,
	isFullscreen = false,
	className = '',
}) => {
	return (
		<div
			className={cn('flex items-center gap-2', className)}
			onClick={(e) => e.stopPropagation()}
		>
			{isZoomEnabled && (
				<Button
					size="icon"
					variant="ghost"
					onClick={handleToggleSelectionTool}
					className={cn(
						'font-extrabold transition-all duration-200',
						isSelectionToolActive
							? 'text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100'
							: 'text-primary hover:text-[#6A12CD]',
					)}
					title={
						isSelectionToolActive
							? 'Cancel selection tool'
							: 'Enable selection tool'
					}
				>
					{isSelectionToolActive ? (
						<i className="bi-x-lg text-lg font-extrabold"></i>
					) : (
						<i className="bi-cursor text-lg font-extrabold"></i>
					)}
				</Button>
			)}
			{isZoomed && isZoomEnabled && (
				<Button
					size="icon"
					variant="ghost"
					onClick={handleResetZoom}
					className="font-extrabold text-primary hover:text-[#6A12CD] transition-all duration-200"
					title="Reset zoom"
				>
					<i className="bi-arrow-counterclockwise text-lg font-extrabold"></i>
				</Button>
			)}
			<Button
				size="icon"
				variant="ghost"
				className="font-extrabold text-primary animate-pulse hover:animate-none duration-1000 transition-all"
				onClick={onFullscreenToggle}
				title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
			>
				<i
					className={cn(
						'text-lg font-extrabold',
						isFullscreen ? 'bi-fullscreen-exit' : 'bi bi-fullscreen',
					)}
				></i>
			</Button>
		</div>
	);
};

/**
 * GraphRenderer - Renders charts using Chart.js
 * @param {Object} graph - Graph data object
 * @param {string} identifierKey - Unique identifier for the chart canvas
 * @param {string} aspect - Aspect ratio class for the container
 * @param {string} chartTypeOverride - Optional chart type override (line, bar, area, pie, etc.)
 * @param {Function} onZoomRangeChange - Callback when zoom range changes (receives { selectedLabels: string[], xAxisColumn: string } or null)
 * @param {boolean} previewMode - by default all graphs in ui are in preview mode until user clicks on them.
 * @param {string} source - Source of the graph (add-to-dashboard modal, etc)
 * @param {Object} contentItem - to pass in graph detail modal. (optional)
 * @param {string} page - The current page type (optional)
 */
const GraphRenderer = ({
	graph,
	identifierKey,
	aspect = 'aspect-[2]',
	chartTypeOverride,
	onZoomRangeChange,
	previewMode = true,
	source = GRAPH_SOURCES.CHAT,
	contentItem = null,
	page = PAGE_TYPES.DASHBOARD,
}) => {
	const chartRef = useRef(null);
	const containerRef = useRef(null);
	const resizeObserverRef = useRef(null);
	const currentFullLabelsRef = useRef([]);
	const [baseData, setBaseData] = useState([]);
	const [loadedData, setLoadedData] = useState([]);
	const [isGraphLoading, setIsGraphLoading] = useState(true);
	const [fontSize, setFontSize] = useState(0);
	const [isZoomed, setIsZoomed] = useState(false);
	const [isSelectionToolActive, setIsSelectionToolActive] = useState(false);
	const [isGraphModalOpen, setIsGraphModalOpen] = useState(false);
	const [categoryData, setCategoryData] = useState({
		options: [],
		label: '',
		placeholder: '',
	});

	// PDF mode detection for higher resolution rendering
	const isPdfMode = window.location.pathname.includes('/export/');

	const handle = useFullScreenHandle();
	const { createS3File } = useS3File();

	// Color array and helper functions remain the same
	const colors = [
		'#6A12CD',
		'#F88907',
		'#BBA446',
		'#7DBE86',
		'#40D9C5',
		'#56B4D6',
		'#6C8FE8',
		'#826AF9',
		'#AA94A6',
		'#D3BD53',
		'#FBE700',
		'#BACD55',
		'#7AB3AA',
		'#3999FF',
	];

	const getOpacity = (chartType) => {
		if (!chartType) return 0.5;
		const normalizedType = chartType.toLowerCase();
		switch (normalizedType) {
			case 'line':
				return 0.1;
			case 'area':
				return 0.3;
			case 'pie':
			case 'doughnut':
				return 0.8;
			default:
				return 0.5;
		}
	};

	const truncateLabel = (label, maxLength = 15) => {
		return label?.length > maxLength ? `${label.slice(0, maxLength)}...` : label;
	};

	const getCircularChartDatasets = (data, chartType) => {
		const fullLabels = data?.map(
			(item) => `${graph.x_axis}(${item[graph.x_axis]})`,
		);
		const truncatedLabels = fullLabels?.map((label) => truncateLabel(label));
		const dataList = [
			{
				label: graph.y_axis[0],
				data: data?.map((item) => Number(item[graph.y_axis[0]])),
				backgroundColor: data?.map(
					(_, index) =>
						`${colors[index % colors.length]}${Math.floor(
							getOpacity(chartTypeOverride || graph.type) * 255,
						)
							.toString(16)
							.padStart(2, '0')}`,
				),
				fill: true,
			},
		];

		// Removing grid lines for polar charts.
		const isPolarArea = chartType?.toLowerCase() === 'polararea';

		const scales = isPolarArea
			? {
					r: {
						grid: { display: false },
						ticks: { display: false },
						angleLines: { display: false },
					},
				}
			: undefined;

		return { data: dataList, labels: truncatedLabels, fullLabels, scales };
	};

	const getAxialChartDatasets = (data, yAxisArray) => {
		const fullLabels = data?.map((item) => item[graph.x_axis]);
		const truncatedLabels = fullLabels?.map((label) => truncateLabel(label));
		const dataObj = yAxisArray?.map((yAxis, index) => ({
			label: yAxis,
			data: data?.map((item) => Number(item[yAxis])),
			borderColor: colors[index % colors.length],
			backgroundColor: `${colors[index % colors.length]}${Math.floor(
				getOpacity(chartTypeOverride || graph.type) * 255,
			)
				.toString(16)
				.padStart(2, '0')}`,
			fill: true,
		}));
		const scales = {
			x: {
				title: {
					display: true,
					text: graph.x_axis || 'X Axis',
					font: {
						size: 0.875 * fontSize,
						weight: 'bold',
					},
				},
			},
		};
		return { data: dataObj, scales, labels: truncatedLabels, fullLabels };
	};

	const handleCategoryChange = (selectedValue) => {
		if (graph?.category_filter && selectedValue) {
			if (selectedValue === 'none') {
				setLoadedData(baseData);
			} else {
				const filteredData = baseData.filter(
					(item) => item[graph.category_filter] === selectedValue,
				);
				setLoadedData(filteredData);
			}
		}
	};

	const showCategoryFilter =
		categoryData && categoryData.options.length && !handle.active;

	// Smooth resize handler
	const handleResize = useCallback(
		debounce(() => {
			if (chartRef.current) {
				chartRef.current.resize();
			}
		}, 100),
		[],
	);

	useEffect(() => {
		resizeObserverRef.current = new ResizeObserver(handleResize);
		if (containerRef.current) {
			resizeObserverRef.current.observe(containerRef.current);
		}

		return () => {
			if (resizeObserverRef.current) {
				resizeObserverRef.current.disconnect();
			}
			handleResize.cancel();
		};
	}, []);

	useEffect(() => {
		const fetchData = async () => {
			if (graph.type && graph.x_axis && graph.y_axis && graph.csv_url) {
				try {
					const csvUrl = await createS3File(graph.csv_url);
					const csvData = await d3.csv(csvUrl);
					setBaseData(csvData);
				} catch (error) {
					logError(error, {
						feature: 'graphRenderer',
						action: 'loadCSVData',
						extra: {
							errorMessage: error.message,
						},
					});
				} finally {
					setIsGraphLoading(false);
				}
			}
		};
		fetchData();
	}, []);

	useEffect(() => {
		setLoadedData(baseData);
		if (graph.category_filter) {
			const isCategoryFilterString =
				typeof graph.category_filter === 'string' ||
				graph.category_filter instanceof String;
			if (!isCategoryFilterString) return;

			const categoryFilter = graph?.category_filter?.toLowerCase();
			const headers = Object.keys(baseData[0] || {});
			const matchingHeader = headers.find(
				(header) => header.toLowerCase() === categoryFilter,
			);

			if (matchingHeader) {
				const uniqueValues = [
					...new Set(baseData.map((item) => item[matchingHeader])),
				];
				const options = uniqueValues.map((value) => ({
					value,
					label: value.charAt(0).toUpperCase() + value.slice(1),
				}));

				if (options.length > 0) {
					setCategoryData({
						label:
							matchingHeader.charAt(0).toUpperCase() +
							matchingHeader.slice(1).toLowerCase(),
						placeholder: `Select ${matchingHeader.toLowerCase()}`,
						options,
					});
					handleCategoryChange(options[0].value);
				}
			}
		}
	}, [baseData]);

	useEffect(() => {
		function handleResize() {
			setFontSize(
				parseFloat(
					window.getComputedStyle(document.documentElement).fontSize,
				),
			);
		}
		window.addEventListener('resize', handleResize);
		handleResize();

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, []);

	useEffect(() => {
		if (loadedData.length > 0) {
			// Destroy existing chart instance
			if (chartRef.current) {
				chartRef.current.destroy();
				chartRef.current = null;
			}

			const canvasId = `canvas_${identifierKey}_${graph.id}`;
			const ctx = document.getElementById(canvasId);

			// Check if canvas exists
			if (!ctx) {
				return;
			}

			// Check if Chart.js already has a chart instance on this canvas
			// and destroy it if it exists
			const existingChart = Chart.getChart(ctx);
			if (existingChart) {
				existingChart.destroy();
			}

			// Use chartTypeOverride if provided, otherwise use graph.type
			const effectiveChartType = chartTypeOverride || graph.type;

			// Categorize chart types by data structure
			const isCircularChart = ['pie', 'doughnut', 'polararea'].includes(
				effectiveChartType.toLowerCase(),
			);

			// Check if this should be an area chart
			// Note: Chart.js doesn't have "area" type, so we map it to "line" with fill enabled
			const isAreaChart = effectiveChartType?.toLowerCase() === 'area';

			// Determine which dataset function to use
			const finalDataObj = isCircularChart
				? getCircularChartDatasets(loadedData, effectiveChartType)
				: getAxialChartDatasets(loadedData, graph.y_axis, isAreaChart);

			// Store full labels for zoom range tracking (use ref for closure access)
			currentFullLabelsRef.current = finalDataObj.fullLabels || [];

			// Convert internal chart type to Chart.js format
			let chartType;
			if (isAreaChart) {
				chartType = 'line';
			} else if (chartTypeOverride) {
				chartType = toChartJsType(chartTypeOverride);
			} else {
				chartType = getChartType(graph);
			}

			const chartInstance = new Chart(ctx, {
				type: chartType,
				data: {
					labels: finalDataObj.labels,
					datasets: finalDataObj.data,
				},
				options: {
					responsive: true,
					responsiveAnimationDuration: 0,
					devicePixelRatio: isPdfMode ? 5 : window.devicePixelRatio,
					transitions: {
						resize: {
							animation: {
								duration: 200,
								easing: 'easeOutQuart',
							},
						},
						zoom: {
							animation: {
								duration: 500,
								easing: 'easeOutQuart',
							},
						},
					},
					plugins: {
						title: {
							display: false,
						},
						legend: {
							align: handle.active ? 'end' : 'center',
							labels: {
								boxWidth: 0.75 * fontSize,
								font: {
									size: 0.625 * fontSize,
								},
								filter: (legendItem, data) => {
									if (!isCircularChart || !previewMode)
										return true;
									return legendItem.index < 5;
								},
							},
						},
						tooltip: {
							enabled: !previewMode,
							bodyFont: {
								size: fontSize,
							},
							titleFont: {
								size: fontSize * 1.25,
							},
							callbacks: {
								title: function (context) {
									const index = context[0].dataIndex;
									return finalDataObj.fullLabels[index];
								},
							},
						},
						zoom: {
							zoom: {
								wheel: {
									enabled: false, // Disable wheel zoom
								},
								pinch: {
									enabled: false, // Disable pinch zoom
								},
								drag: {
									enabled: false, // Disable drag zoom (we use custom brush)
								},
								mode: 'x', // Only zoom on X-axis
							},
							pan: {
								enabled: false, // Disable pan
							},
							limits: {
								x: { min: 'original', max: 'original' },
							},
						},
					},
					animation: !previewMode
						? {
								duration: 400,
								easing: 'easeOutQuart',
							}
						: false,
					scales: isCircularChart
						? finalDataObj.scales
						: {
								...finalDataObj.scales,
								y: {
									beginAtZero: true,
									ticks: {
										font: {
											size: 0.75 * fontSize,
										},
									},
								},
								x: {
									...finalDataObj.scales?.x,
									max: getXAxisMax(source, previewMode),
									ticks: {
										font: {
											size: 0.75 * fontSize,
										},
									},
								},
							},
					maintainAspectRatio: false,
				},
			});

			chartRef.current = chartInstance;

			// Reset zoom state when chart is recreated
			setIsZoomed(false);

			// Listen for zoom completion events by wrapping the update method
			const originalUpdate = chartInstance.update.bind(chartInstance);
			chartInstance.update = function (mode) {
				const result = originalUpdate(mode);
				// Check zoom state after update
				if (chartInstance.scales.x) {
					const xScale = chartInstance.scales.x;
					const isCurrentlyZoomed =
						xScale.min !== undefined &&
						xScale.max !== undefined &&
						(xScale.min !== xScale.minRaw ||
							xScale.max !== xScale.maxRaw);

					if (isCurrentlyZoomed !== isZoomed) {
						setIsZoomed(isCurrentlyZoomed);
					}

					// Notify parent component about zoom range change
					if (onZoomRangeChange && !isPieChart) {
						if (
							isCurrentlyZoomed &&
							xScale.min !== undefined &&
							xScale.max !== undefined
						) {
							// Get the indices of visible data points
							const fullLabels = currentFullLabelsRef.current;
							if (fullLabels && fullLabels.length > 0) {
								const minIndex = Math.max(0, Math.floor(xScale.min));
								const maxIndex = Math.min(
									fullLabels.length - 1,
									Math.ceil(xScale.max),
								);

								// Extract selected labels
								const selectedLabels = fullLabels.slice(
									minIndex,
									maxIndex + 1,
								);

								// Call callback with selected labels and X-axis column name
								onZoomRangeChange({
									selectedLabels,
									xAxisColumn: graph.x_axis,
								});
							}
						} else {
							// Zoom reset - clear filter
							onZoomRangeChange(null);
						}
					}
				}
				return result;
			};
		}
		return () => {
			if (chartRef.current) {
				try {
					chartRef.current.destroy();
				} catch (error) {
					console.warn('Chart destruction warning:', error);
				}
				chartRef.current = null;
			}
		};
	}, [
		loadedData,
		graph,
		identifierKey,
		previewMode,
		handle.active,
		fontSize,
		chartTypeOverride,
		onZoomRangeChange,
		source,
	]);

	// Handle brush selection completion - zoom to selected range
	const handleSelectionComplete = useCallback(({ startX, endX, bounds }) => {
		if (!chartRef.current || !bounds) return;

		const chart = chartRef.current;
		const xScale = chart.scales.x;

		if (!xScale) return;

		// Convert relative pixel positions to absolute positions
		const absoluteStartX = bounds.left + startX;
		const absoluteEndX = bounds.left + endX;

		// Convert pixel positions to data values using Chart.js scale API
		const startValue = xScale.getValueForPixel(absoluteStartX);
		const endValue = xScale.getValueForPixel(absoluteEndX);

		if (
			startValue === null ||
			endValue === null ||
			isNaN(startValue) ||
			isNaN(endValue)
		) {
			return;
		}

		// Apply zoom with smooth animation
		try {
			chart.zoomScale('x', {
				min: Math.min(startValue, endValue),
				max: Math.max(startValue, endValue),
			});

			// Update zoom state after a brief delay to allow chart to update
			setTimeout(() => {
				setIsZoomed(true);
			}, 100);
		} catch (error) {
			logError(error, {
				feature: 'graph-renderer',
				action: 'zoom-to-selection',
				extra: {
					startValue,
					endValue,
					startX,
					endX,
				},
			});
		}
	}, []);

	// Reset selection tool when zoom is reset externally
	useEffect(() => {
		if (!isZoomed && isSelectionToolActive) {
			// Keep tool active even after zoom reset, user can cancel manually
		}
	}, [isZoomed, isSelectionToolActive]);

	// Handle reset zoom
	const handleResetZoom = useCallback(() => {
		if (!chartRef.current) return;

		try {
			chartRef.current.resetZoom();
			// Update state after reset completes
			setTimeout(() => {
				setIsZoomed(false);
				// Notify parent that zoom is reset
				if (onZoomRangeChange) {
					onZoomRangeChange(null);
				}
			}, 100);
		} catch (error) {
			logError(error, {
				feature: 'graph-renderer',
				action: 'reset-zoom',
			});
		}
	}, [onZoomRangeChange]);

	// Handle selection tool toggle
	const handleToggleSelectionTool = useCallback(() => {
		if (isSelectionToolActive) {
			// Deactivate tool and reset zoom if zoomed
			setIsSelectionToolActive(false);
			// if (isZoomed && chartRef.current) {
			// 	handleResetZoom();
			// }
		} else {
			// Activate selection tool
			setIsSelectionToolActive(true);
		}
	}, [isSelectionToolActive, isZoomed, handleResetZoom]);

	// Determine if zoom should be enabled for this chart type
	// Enable for: line, bar, area, scatter charts
	// Disable for: pie, doughnut, radar, polarArea
	const effectiveChartType = chartTypeOverride || graph?.type;
	const isPieChart = ['pie', 'doughnut'].includes(
		effectiveChartType?.toLowerCase() || '',
	);
	const isZoomEnabled =
		!isPieChart &&
		!['radar', 'polarArea'].includes(effectiveChartType?.toLowerCase() || '') &&
		!isGraphLoading &&
		chartRef.current;

	const canOpenModal =
		source !== GRAPH_SOURCES.ADD_TO_DASHBOARD &&
		source !== GRAPH_SOURCES.ADD_TO_REPORTS;

	const commonControlProps = {
		isZoomEnabled,
		isSelectionToolActive,
		handleToggleSelectionTool,
		isZoomed,
		handleResetZoom,
		onFullscreenToggle: handle.enter,
	};

	return (
		<>
			<div
				className={cn(
					'bg-white rounded-xl w-full h-full',
					canOpenModal && !isSelectionToolActive && 'cursor-pointer',
				)}
				onClick={() => {
					if (canOpenModal && !isSelectionToolActive) {
						setIsGraphModalOpen(true);
					}
				}}
			>
				{isGraphLoading ? (
					<div className="darkSoul-glowing-button2 mb-10">
						<button className="darkSoul-button2" type="button">
							<i className="bi-arrow-clockwise animate-spin text-purple-100 text-lg me-2"></i>
							Generating Graph...
						</button>
					</div>
				) : !loadedData || !loadedData.length ? (
					<div className="flex flex-col items-center justify-center p-12 text-center gap-2 bg-muted/30 rounded-xl border border-border">
						<LucideBarChart3 className="w-6 h-6 text-primary mb-2" />

						<div className="flex flex-col gap-1">
							<p className="text-sm font-semibold text-primary80">
								Visualization data unavailable
							</p>
							<p className="text-xs text-primary60 max-w-80 mx-auto">
								The chart cannot be rendered because the data source
								is missing or invalid.
							</p>
						</div>
					</div>
				) : (
					<div className="relative h-full" ref={containerRef}>
						{/* Top Bar with Category Filter and Controls */}
						{!isPdfMode &&
							(showCategoryFilter ? (
								<div
									className="w-full flex justify-between items-center mb-2"
									onClick={(e) => e.stopPropagation()}
								>
									<div>
										<GraphCategoryFilter
											filterData={categoryData}
											onChange={handleCategoryChange}
										/>
									</div>
									<ChartControls {...commonControlProps} />
								</div>
							) : (
								!previewMode && (
									<ChartControls
										{...commonControlProps}
										className="absolute top-2 right-2 z-20"
									/>
								)
							))}

						<FullScreen handle={handle} className="h-full w-full">
							<div
								className={cn(
									'relative transition-all duration-300 ease-out',
									!previewMode
										? 'h-full w-full min-h-[40rem]'
										: `w-full min-w-[18.75rem] ${aspect} min-h-96`,
								)}
							>
								<canvas
									id={`canvas_${identifierKey}_${graph.id}`}
									style={{
										backgroundColor: 'white',
										padding: !previewMode ? '2rem' : '0',
										borderRadius: '1rem',
										transition: 'all 0.05s ease-out',
									}}
								></canvas>

								{isZoomEnabled &&
									chartRef.current &&
									isSelectionToolActive && (
										<ChartBrushOverlay
											chart={chartRef.current}
											onSelectionComplete={
												handleSelectionComplete
											}
											enabled={
												!isGraphLoading &&
												isSelectionToolActive
											}
										/>
									)}

								{/* Selection Tool, Reset Zoom, and Exit Fullscreen Buttons */}
								{handle.active && !isPdfMode && (
									<ChartControls
										{...commonControlProps}
										className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30"
										isFullscreen={true}
										onFullscreenToggle={handle.exit}
									/>
								)}
							</div>
						</FullScreen>
					</div>
				)}
			</div>
			{canOpenModal && (
				<GraphDetailModal
					open={isGraphModalOpen}
					onOpenChange={setIsGraphModalOpen}
					selectedGraph={graph}
					page={page}
					contentItem={contentItem}
				/>
			)}
		</>
	);
};

export default GraphRenderer;
