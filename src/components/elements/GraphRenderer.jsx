/* eslint-disable react/prop-types */
import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import * as d3 from 'd3';
import { FullScreen, useFullScreenHandle } from 'react-full-screen';
import { Button } from '../ui/button';

const GraphRenderer = ({ graph, queryId }) => {
	const chartRef = useRef(null);
	const [loadedData, setLoadedData] = useState([]);
	const [isGraphLoading, setIsGraphLoading] = useState(true);
	const handle = useFullScreenHandle();

	useEffect(() => {
		const fetchData = async () => {
			if (graph.type && graph.x_axis && graph.y_axis && graph.csv_url) {
				try {
					const csvData = await d3.csv(graph.csv_url);
					setLoadedData(csvData);
				} catch (error) {
					console.error('Error loading CSV data:', error);
				} finally {
					setIsGraphLoading(false);
				}
			}
		};
		fetchData();
	}, [graph]);

	const colors = [
		'#6A12CD',
		'#F88907',
		'#40D9C5',
		'#826AF9',
		'#FBE700',
		'#3999FF',
	];

	const getOpacity = (chartType) => (chartType === 'line' ? 0.1 : 0.5);

	
	useEffect(() => {
		if (loadedData.length > 0) {
			if (chartRef.current) chartRef.current.destroy();
			const ctx = document.getElementById(`canvas_${queryId}_${graph.id}`);
			const tempLoadedData = handle.active
				? loadedData
				: loadedData.slice(0, Math.min(21, loadedData.length + 1));
			chartRef.current = new Chart(ctx, {
				type: graph.type.toLowerCase(),
				data: {
					labels: tempLoadedData.map((item) => item[graph.x_axis]),
					datasets: graph.y_axis.map((yAxis, index) => ({
						label: yAxis,
						data: tempLoadedData?.map((item) => Number(item[yAxis])),
						borderColor: colors[index % colors.length],
						backgroundColor: `${colors[index % colors.length]}${Math.floor(
							getOpacity(graph.type) * 255,
						)
							.toString(16)
							.padStart(2, '0')}`,
						fill: true,
					})),
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
							align: handle.active ? 'end' : 'center',
							position: 'top',
						},
					},
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
					<Button
						size="icon"
						variant="ghost"
						className="absolute top-[1px] right-0 text-gray-600"
						onClick={handle.enter}
					>
						<i className="bi bi-fullscreen"></i>
					</Button>
				</div>
			)}
		</div>
	);
};

export default GraphRenderer;
