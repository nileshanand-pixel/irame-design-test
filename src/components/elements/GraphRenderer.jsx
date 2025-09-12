import React, { useEffect, useRef, useState, useCallback } from 'react';
import Chart from 'chart.js/auto';
import * as d3 from 'd3';
import { FullScreen, useFullScreenHandle } from 'react-full-screen';
import { Button } from '../ui/button';
import { GraphCategoryFilter } from './GraphCategoryFilter';
import { debounce } from 'lodash';
import { cn, getChartType } from '@/lib/utils';
import useS3File from '@/hooks/useS3File';

const GraphRenderer = ({ graph, identifierKey, aspect = 'aspect-[2]' }) => {
	const chartRef = useRef(null);
	const containerRef = useRef(null);
	const resizeObserverRef = useRef(null);
	const [baseData, setBaseData] = useState([]);
	const [loadedData, setLoadedData] = useState([]);
	const [isGraphLoading, setIsGraphLoading] = useState(true);
	const [fontSize, setFontSize] = useState(0);
	const [categoryData, setCategoryData] = useState({
		options: [],
		label: '',
		placeholder: '',
	});

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
		switch (chartType) {
			case 'line':
				return 0.1;
			case 'pie':
				return 0.8;
			default:
				return 0.5;
		}
	};

	const truncateLabel = (label, maxLength = 15) => {
		return label.length > maxLength ? `${label.slice(0, maxLength)}...` : label;
	};

	const getCircularChartDatasets = (data) => {
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
							getOpacity(graph.type) * 255,
						)
							.toString(16)
							.padStart(2, '0')}`,
				),
				fill: true,
			},
		];

		return { data: dataList, labels: truncatedLabels, fullLabels, scales: null };
	};

	const getAxialChartDatasets = (data, yAxisArray) => {
		const fullLabels = data?.map((item) => item[graph.x_axis]);
		const truncatedLabels = fullLabels?.map((label) => truncateLabel(label));
		const dataObj = yAxisArray?.map((yAxis, index) => ({
			label: yAxis,
			data: data?.map((item) => Number(item[yAxis])),
			borderColor: colors[index % colors.length],
			backgroundColor: `${colors[index % colors.length]}${Math.floor(
				getOpacity(graph.type) * 255,
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
					console.error('Error loading CSV data:', error);
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
			if (chartRef.current) chartRef.current.destroy();
			const ctx = document.getElementById(
				`canvas_${identifierKey}_${graph.id}`,
			);
			const isPieChart = ['pie', 'doughnut'].includes(
				graph.type.toLowerCase(),
			);

			const finalDataObj = isPieChart
				? getCircularChartDatasets(loadedData)
				: getAxialChartDatasets(loadedData, graph.y_axis);

			const chartType = getChartType(graph);

			chartRef.current = new Chart(ctx, {
				type: chartType,
				data: {
					labels: finalDataObj.labels,
					datasets: finalDataObj.data,
				},
				options: {
					responsive: true,
					responsiveAnimationDuration: 0,
					transitions: {
						resize: {
							animation: {
								duration: 200,
								easing: 'easeOutQuart',
							},
						},
					},
					plugins: {
						title: {
							align: handle.active ? 'end' : 'center',
							display: true,
							text: graph.title || 'Data plot',
							font: {
								size: handle.active
									? 1.5 * fontSize
									: 1.25 * fontSize,
								lineHeight: 1,
								weight: 'bold',
							},
							position: 'top',
							padding: {
								top: 0.625 * fontSize,
								bottom: 0,
							},
						},
						legend: {
							align: handle.active || isPieChart ? 'end' : 'center',
							labels: {
								boxWidth: 0.75 * fontSize,
								font: {
									size: 0.625 * fontSize,
								},
							},
						},
						tooltip: {
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
					},
					animation: handle.active
						? {
								duration: 400,
								easing: 'easeOutQuart',
							}
						: false,
					scales: {
						...finalDataObj.scales,
						y: {
							beginAtZero: true,
							ticks: {
								font: {
									size: 0.625 * fontSize,
								},
							},
						},
						x: {
							...finalDataObj.scales?.x,
							ticks: {
								font: {
									size: 0.625 * fontSize,
								},
							},
						},
					},
					maintainAspectRatio: false,
				},
			});
		}
		return () => {
			if (chartRef.current) chartRef.current.destroy();
		};
	}, [loadedData, graph, identifierKey, handle.active, fontSize]);

	return (
		<div className="bg-white rounded-xl p-2">
			{isGraphLoading ? (
				<div className="darkSoul-glowing-button2 mb-10">
					<button className="darkSoul-button2" type="button">
						<i className="bi-arrow-clockwise animate-spin text-purple-100 text-lg me-2"></i>
						Generating Graph...
					</button>
				</div>
			) : (
				<div className="relative" ref={containerRef}>
					<div
						className={`${showCategoryFilter ? 'block' : 'hidden'} w-full flex justify-between`}
					>
						<div
							className={`${showCategoryFilter ? 'block' : 'hidden'}`}
						>
							<GraphCategoryFilter
								filterData={categoryData}
								onChange={handleCategoryChange}
							/>
						</div>
						<Button
							size="icon"
							variant="ghost"
							className={`${showCategoryFilter ? 'block' : 'hidden'} font-extrabold relative float-right text-primary animate-pulse hover:animate-none duration-1000`}
							onClick={handle.enter}
						>
							<i className="bi bi-fullscreen text-lg font-extrabold"></i>
						</Button>
					</div>

					<FullScreen handle={handle}>
						<div
							className={cn(
								'relative  w-full min-w-[18.75rem] transition-all duration-300 ease-out',
								!handle.active && aspect,
								handle.active && 'w-full h-full',
							)}
						>
							<canvas
								id={`canvas_${identifierKey}_${graph.id}`}
								style={{
									backgroundColor: 'white',
									padding: handle.active ? '2rem' : '0',
									borderRadius: '1rem',
									transition: 'all 0.05s ease-out',
								}}
							></canvas>
						</div>
					</FullScreen>

					{!showCategoryFilter && (
						<Button
							size="icon"
							variant="ghost"
							className="absolute top-0 font-extrabold right-0 text-primary animate-pulse hover:animate-none duration-1000"
							onClick={handle.enter}
						>
							<i className="bi bi-fullscreen text-lg font-extrabold"></i>
						</Button>
					)}
				</div>
			)}
		</div>
	);
};

export default GraphRenderer;
