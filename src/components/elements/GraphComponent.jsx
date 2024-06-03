/* eslint-disable react/prop-types */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import * as d3 from 'd3';
import TableComponent from './TableComponent';
import { DataTableColumnHeader } from './data-table/components/data-table-column-header';

const GraphComponent = ({ data, isGraphLoading, setIsGraphLoading, showTable }) => {
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

	function generateColumns(keys) {
		return keys.map((key) => {
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

					setColumns(generateColumns(Object.keys(csvData[0])));
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
					<>
						<ul className="ghost-tabs relative col-span-12 mb-2 inline-flex w-full border-b border-black-10">
							{['Graphical View', 'Tabular View'].map((item, indx) => (
								<li
									key={indx}
									className={`!pb-0 ${
										activeTab === item
											? 'active-tab'
											: 'default-tab'
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
								<div className="bg-white rounded-3xl py-2">
									{/* {showTable ? (
										<TableComponent
											data={loadedData}
											columns={columns}
										/>
									) : (
										<TableResponse
											data={data}
											isGraphLoading={false}
											// setIsGraphLoading={setIsGraphLoading}
											noStyles
										/>
									)} */}
									<TableComponent
										data={loadedData}
										columns={columns}
									/>
								</div>
							)}
						</div>
					</>
				</>
			)}
		</div>
	);
};

export default GraphComponent;
