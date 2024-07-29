import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import * as d3 from 'd3';
import { FullScreen, useFullScreenHandle } from 'react-full-screen';
import { Button } from '../ui/button';
import { GraphCategoryFilter } from './GraphCategoryFilter';

const GraphRenderer = ({ graph, queryId }) => {
	const chartRef = useRef(null);
	const [baseData, setBaseData] = useState([]);
	const [loadedData, setLoadedData] = useState([]);
	const [isGraphLoading, setIsGraphLoading] = useState(true);
	const [categoryData, setCategoryData] = useState({
		options: [],
		label: '',
		placeholder: '',
	});

	const handle = useFullScreenHandle();

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
		const fullLabels = data.map(
			(item) => `${graph.x_axis}(${item[graph.x_axis]})`,
		);
		const truncatedLabels = fullLabels.map((label) => truncateLabel(label));
		const dataList = [
			{
				label: graph.y_axis[0],
				data: data.map((item) => Number(item[graph.y_axis[0]])),
				backgroundColor: data.map(
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
		const fullLabels = data.map((item) => item[graph.x_axis]);
		const truncatedLabels = fullLabels.map((label) => truncateLabel(label));
		const dataObj = yAxisArray.map((yAxis, index) => ({
			label: yAxis,
			data: data.map((item) => Number(item[yAxis])),
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
					font:{
						size: '14px',
						weight: 'bold'
					}
				},
			},
		};
		return { data: dataObj, scales, labels: truncatedLabels, fullLabels };
	};

	const handleCategoryChange = (selectedValue) => {
		if (graph.category_filter && selectedValue) {
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

	useEffect(() => {
		const fetchData = async () => {
			if (graph.type && graph.x_axis && graph.y_axis && graph.csv_url) {
				try {
					const csvData = await d3.csv(graph.csv_url);
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
			const categoryFilter = graph.category_filter.toLowerCase();
			const headers = Object.keys(baseData[0] || {});
			const matchingHeader = headers.find(
				(header) => header.toLowerCase() === categoryFilter,
			);

			if (matchingHeader) {
				const uniqueValues = Array.from(
					new Set(baseData.map((item) => item[matchingHeader])),
				);
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

					const defaultCategoryValue = options[0].value;
					handleCategoryChange(defaultCategoryValue);
				}
			}
		}
	}, [baseData]);

	useEffect(() => {
		if (loadedData.length > 0) {
			if (chartRef.current) chartRef.current.destroy();
			const ctx = document.getElementById(`canvas_${queryId}_${graph.id}`);
			const isPieChart = graph.type.toLowerCase() === 'pie';
			const tempLoadedData = handle.active
				? loadedData
				: loadedData.slice(0, Math.min(21, loadedData.length + 1));
			const finalDataObj = isPieChart
				? getCircularChartDatasets(tempLoadedData)
				: getAxialChartDatasets(tempLoadedData, graph.y_axis);
			chartRef.current = new Chart(ctx, {
				type: graph.type.toLowerCase(),
				data: {
					labels: finalDataObj.labels,
					datasets: finalDataObj.data,
				},
				options: {
					plugins: {
						title: {
							align: handle.active ? 'end' : 'center',
							display: true,
							text: graph.title || 'Data plot',
							font: { size: 14 },
							position: 'top',
						},
						legend: {
							align: handle.active || isPieChart ? 'end' : 'center',
							position: 'top',
						},
						tooltip: {
							callbacks: {
								label: function (context) {
									return context.dataset.label || '';
								},
								title: function (context) {
									const index = context[0].dataIndex;
									return finalDataObj.fullLabels[index];
								},
							},
						},
					},
					animation: handle.active ? true : false,
					scales: finalDataObj.scales,
					maintainAspectRatio: handle.active ? false : true,
				},
			});
		}
		return () => {
			if (chartRef.current) chartRef.current.destroy();
		};
	}, [loadedData, graph, queryId, handle.active]);

	return (
		<div className="bg-white rounded-3xl p-2 overflow-x-auto">
			{isGraphLoading ? (
				<div className="darkSoul-glowing-button2 mb-10">
					<button className="darkSoul-button2" type="button">
						<i className="bi-arrow-clockwise animate-spin text-purple-100 text-lg me-2"></i>
						Generating Graph...
					</button>
				</div>
			) : (
				<div className="relative">
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
						<canvas
							id={`canvas_${queryId}_${graph.id}`}
							width="380"
							height="250"
							style={{
								backgroundColor: 'white',
								padding: handle.active ? '32px' : '0',
								borderRadius: '1rem',
							}}
						></canvas>
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
