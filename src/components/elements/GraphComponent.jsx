/* eslint-disable react/prop-types */
import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import * as d3 from 'd3';
import TableComponent from './TableComponent';

const GraphComponent = ({ data, isGraphLoading, setIsGraphLoading }) => {
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
	const [activeTab, setActiveTab] = useState('Graphical View');
	const chartRef = useRef(null);

	useEffect(() => {
		// console.log('graph data==', data);
		if (data && data.response_csv_curl) {
			setChartState({
				xAxis: data['x-axis'],
				yAxis: data['y-axis'],
				type: data['graph_type'],
				borderColor: data['border_color'] || data['borderColor'],
				backgroundColor: data['background_color'] || data['backgroundColor'],
				title: data['chart_title'] || data['chartTitle'] || data['title'],
			});
		}
	}, [data]);

	useEffect(() => {
		if (
			chartState.type &&
			chartState.xAxis &&
			chartState.yAxis &&
			data?.response_csv_curl
		) {
			d3.csv(data.response_csv_curl).then((csvData) => {
				setLoadedData(csvData);
				setColumns(Object.keys(csvData[0]));
				setIsGraphLoading(false);
			});
		}
	}, [chartState, data]);

	useEffect(() => {
		if (activeTab === 'Graphical View' && loadedData.length > 0) {
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
	}, [activeTab, loadedData, chartState]);

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
						{['Graphical View', 'Tabular View'].map((item, indx) => (
							<li
								key={indx}
								className={`!pb-0 ${
									activeTab === item ? 'active-tab' : 'default-tab'
								}`}
								onClick={() => setActiveTab(item)}
							>
								{item}
							</li>
						))}
					</ul>
					<div className="rounded-3xl border border-primary4 bg-purple-4 p-4 mt-2">
						{activeTab === 'Graphical View' && (
							<div className="bg-white rounded-3xl p-2">
								<canvas
									id="canvas"
									width="380"
									height="250"
								></canvas>
							</div>
						)}
						{activeTab === 'Tabular View' && (
							<div className="bg-white rounded-3xl p-2">
								<TableComponent
									data={loadedData}
									columns={columns}
								/>
							</div>
						)}
					</div>
				</>
			)}
		</div>
	);
};

export default GraphComponent;
