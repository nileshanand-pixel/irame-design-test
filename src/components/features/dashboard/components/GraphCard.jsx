/* eslint-disable react/prop-types */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import * as d3 from 'd3';

const GraphCard = ({ data, isGraphLoading, setIsGraphLoading }) => {
	const [chartState, setChartState] = useState({
		xAxis: '',
		yAxis: '',
		type: '',
		borderColor: '',
		backgroundColor: '',
		title: '',
	});
	const [loadedData, setLoadedData] = useState([]);
	const [columns, setColumns] = useState([]);
	const chartRef = useRef(null);

	const memoizedChartState = useMemo(() => {
		if (data && data.response_csv_curl) {
			return {
				xAxis: data['x-axis'],
				yAxis: data['y-axis'],
				type: data['graph_type'],
				borderColor: data['border_color'] || data['borderColor'],
				backgroundColor: data['background_color'] || data['backgroundColor'],
				title: data['chart_title'] || data['chartTitle'] || data['title'],
			};
		}
		return chartState;
	}, [data]);

	useEffect(() => {
		setChartState(memoizedChartState);
	}, [memoizedChartState]);

	useEffect(() => {
		const fetchData = async () => {
			if (
				chartState.type &&
				chartState.xAxis &&
				chartState.yAxis &&
				data?.response_csv_curl
			) {
				try {
					const csvData = await d3.csv(data.response_csv_curl);
					setLoadedData(csvData);
					setColumns(Object.keys(csvData[0]));
				} catch (error) {
					console.error('Error loading CSV data:', error);
				} finally {
					setIsGraphLoading(false);
				}
			}
		};

		if (loadedData.length === 0) {
			fetchData();
		}
	}, [chartState, data, loadedData.length, setIsGraphLoading]);

	useEffect(() => {
		if (loadedData.length > 0) {
			if (chartRef.current) {
				chartRef.current.destroy();
			}
			const ctx = document.getElementById('canvas');
			chartRef.current = new Chart(ctx, {
				type: chartState.type,
				data: {
					labels: loadedData.map((item) => item[chartState.xAxis]),
					datasets: [
						{
							label: chartState.yAxis,
							data: loadedData.map((item) =>
								Number(item[chartState.yAxis]),
							),
							fill: false,
							borderColor:
								chartState.borderColor || 'rgba(38, 6, 74, 0.8)',
							backgroundColor:
								chartState.backgroundColor ||
								'rgba(106, 18, 205, 1)',
						},
					],
				},
				options: {
					plugins: {
						title: {
							display: true,
							text: chartState.title || 'Data plot',
							font: {
								size: 18,
							},
							align: 'start',
						},
					},
				},
			});
		}
		return () => {
			if (chartRef.current) {
				chartRef.current.destroy();
			}
		};
	}, [loadedData, chartState]);
	return (
		<div className="mb-4">
			{isGraphLoading ? (
				<div className="darkSoul-glowing-button2 mb-10 mt-5 ml-4">
					<button className="darkSoul-button2" type="button">
						<i className="bi-arrow-clockwise animate-spin text-purple-100 text-lg me-2"></i>
						Generating Graph...
					</button>
				</div>
			) : (
				<div className="px-4 py-1 w-[30rem] h-[20rem]">
					<canvas id="canvas" width="380" height="250"></canvas>
				</div>
			)}
		</div>
	);
};

export default GraphCard;
