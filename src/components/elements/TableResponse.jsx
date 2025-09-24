/* eslint-disable react/prop-types */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import * as d3 from 'd3';
import { DataTableColumnHeader } from './data-table/components/data-table-column-header';
import TableComponent from './TableComponent';
import { logError } from '@/lib/logger';

const TableResponse = ({ data, isGraphLoading, noStyles, setIsGraphLoading }) => {
	// const [chartState, setChartState] = useState({
	// 	xAxis: '',
	// 	yAxis: '',
	// 	type: '',
	// 	borderColor: '',
	// 	backgroundColor: '',
	// 	title: '',
	// });
	const [loadedData, setLoadedData] = useState([]);
	const [columns, setColumns] = useState([]);
	const [activeTab, setActiveTab] = useState('Tabular View');

	// const memoizedChartState = useMemo(() => {
	// 	if (data && data.csv_curl) {
	// 		return {
	// 			xAxis: data['x-axis'],
	// 			yAxis: data['y-axis'],
	// 			type: data['graph_type'],
	// 			borderColor: data['border_color'] || data['borderColor'],
	// 			backgroundColor: data['background_color'] || data['backgroundColor'],
	// 			title: data['chart_title'] || data['chartTitle'] || data['title'],
	// 		};
	// 	}
	// 	return chartState;
	// }, [data]);

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
			};
		});
	}

	// useEffect(() => {
	// 	setChartState(memoizedChartState);
	// }, [memoizedChartState]);

	useEffect(() => {
		const fetchData = async () => {
			let url = data?.sample_url || data?.csv_url;
			if (url) {
				try {
					const csvData = await d3.csv(url);
					setLoadedData(csvData);

					setColumns(generateColumns(Object.keys(csvData[0])));
				} catch (error) {
					logError(error, {
						feature: 'tableResponse',
						action: 'loadCSVData',
						extra: {
							url,
							errorMessage: error.message,
						},
					});
				} finally {
					setIsGraphLoading(false);
				}
			}
		};

		if (loadedData.length === 0) {
			fetchData();
		}
	}, [data, loadedData.length]);

	// console.log('TableResponse', data, loadedData, columns);

	return (
		<div className="mb-4">
			{isGraphLoading ? (
				<div className="darkSoul-glowing-button2 mb-10">
					<button className="darkSoul-button2" type="button">
						<i className="bi-arrow-clockwise animate-spin text-purple-100 text-lg me-2"></i>
						Generating Table...
					</button>
				</div>
			) : (
				<>
					{noStyles ? (
						<TableComponent data={loadedData} columns={columns} />
					) : (
						<>
							<ul className="ghost-tabs relative col-span-12 mb-2 inline-flex w-full border-b border-black-10">
								{['Tabular View'].map((item, indx) => (
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
								<div className="bg-white rounded-3xl py-2">
									<TableComponent
										data={loadedData}
										columns={columns}
									/>
								</div>
							</div>
						</>
					)}
				</>
			)}
		</div>
	);
};

export default TableResponse;
