/* eslint-disable react/prop-types */
import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import * as d3 from 'd3';
import TableComponent from './TableComponent';

const GraphComponent = ({ data }) => {
	const [chartState, setChartState] = useState({
		xAxis: '',
		yAxis: '',
		type: '',
	});
	const [loadedData, setLoadedData] = useState([]);
	const [columns, setColumns] = useState([]);
	const [activeTab, setActiveTab] = useState('Graphical View');
	const chartRef = useRef(null);

	useEffect(() => {
		if (data && data.response_csv_curl) {
			setChartState({
				xAxis: data['x-axis'],
				yAxis: data['y-axis'],
				type: data['graph_type'],
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
							borderColor: 'rgba(38, 6, 74, 0.8)',
							backgroundColor: 'rgba(106, 18, 205, 1)',
						},
					],
				},
				options: {
					plugins: {
						title: {
							display: true,
							text: 'Custom Chart Title',
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
						<canvas id="canvas" width="380" height="250"></canvas>
					</div>
				)}
				{activeTab === 'Tabular View' && (
					<div className="bg-white rounded-3xl p-2">
						<TableComponent data={loadedData} columns={columns} />
					</div>
				)}
			</div>
		</div>
	);
};

export default GraphComponent;
