/* eslint-disable react/prop-types */
import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import * as d3 from 'd3';
import TableComponent from './TableComponent';

const GraphComponent = ({ data }) => {
	const [chart, setChart] = useState({
		xAxis: '',
		yAxis: '',
		type: '',
	});
	const [initialized, setInitialized] = useState(false);
	const [loadedData, setLoadedData] = useState([]);
	const [columns, setColumns] = useState([]);
	const [activeTab, setActiveTab] = useState('Graphical View');

	const chartRef = useRef(null);

	useEffect(() => {
		if (data && data.response_csv_curl) {
			setChart({
				xAxis: data['x-axis'],
				yAxis: data['y-axis'],
				type: data['graph_type'],
			});
		}
	}, [data]);

	useEffect(() => {
		if (chart.type && chart.xAxis && chart.yAxis && data?.response_csv_curl) {
			d3.csv(data.response_csv_curl).then(makeChart);
		}
	}, [chart, data, activeTab]);

	function makeChart(loadedData) {
		setLoadedData(loadedData);

		Object.keys(loadedData[0]).forEach((key) => {
			setColumns((prev) => {
				const uniqueKeys = new Set(prev);
				uniqueKeys.add(key);
				return [...uniqueKeys];
			});
		});

		const dataPoints = [];
		const labels = [];

		for (let i = 0; i < loadedData.length; i++) {
			const xAxisValue = loadedData[i][chart.xAxis];
			const yAxisValue = Number(loadedData[i][chart.yAxis]);

			labels.push(xAxisValue);
			dataPoints.push(yAxisValue);
		}

		const options = {
			type: chart.type,
			data: {
				labels: labels,
				datasets: [
					{
						label: chart.yAxis,
						data: dataPoints,
						fill: false,
						borderColor: 'rgba(106, 18, 205, 0.04)',
					},
				],
			},
		};

		const ctx = document.getElementById('canvas');
		chartRef.current = new Chart(ctx, options);
		setInitialized(true);
		// if (!initialized) {
		// 	const ctx = document.getElementById('canvas');
		// 	chartRef.current = new Chart(ctx, options);
		// 	setInitialized(true);
		// } else {
		// 	chartRef.current.data.labels = labels;
		// 	chartRef.current.data.datasets[0].data = dataPoints;
		// 	chartRef.current.update();
		// }
	}

	return (
		<div className="mb-4">
			<ul className="ghost-tabs relative col-span-12 mb-2 inline-flex w-full border-b border-black-10">
				{['Graphical View', 'Tabular View'].map((items, indx) => (
					<li
						key={indx}
						className={[
							'!pb-0',
							activeTab === items ? 'active-tab' : 'default-tab',
						].join(' ')}
						onClick={() => setActiveTab(items)}
					>
						{items}
					</li>
				))}
			</ul>
			{activeTab === 'Graphical View' && (
				<canvas id="canvas" width="380" height="250"></canvas>
			)}
			{activeTab === 'Tabular View' && (
				<TableComponent data={loadedData} columns={columns} />
			)}
		</div>
	);
};

export default GraphComponent;
