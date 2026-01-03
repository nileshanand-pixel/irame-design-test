import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

/**
 * ChartWidget - A flexible chart component supporting line, bar, area, and pie charts
 * @param {Object} chartData - Chart data with labels and datasets
 * @param {Object} options - Chart configuration options
 * @param {string} options.type - Chart type: 'line', 'bar', 'pie', 'area'
 * @param {string} options.height - Chart height (default: '300px')
 * @param {string} options.yAxisName - Y-axis label
 * @param {string} options.xAxisName - X-axis label
 * @param {number} options.yAxisMax - Maximum Y-axis value
 * @param {number} options.yAxisInterval - Y-axis interval
 * @param {Object} options.areaStyle - Area chart style configuration
 * @param {Object} options.markLine - Mark line configuration
 */
const ChartWidget = ({ chartData, options = {} }) => {
	const {
		height = '300px',
		type = 'line', // 'line', 'bar', 'pie', 'area'
		yAxisName = 'Number of Duplicates',
		xAxisName = 'Time Period',
		yAxisMax,
		yAxisInterval = 20,
		areaStyle,
		markLine,
	} = options;

	const echartsOption = useMemo(() => {
		if (!chartData || !chartData.labels || !chartData.datasets) {
			return {};
		}

		// Pie chart configuration
		if (type === 'pie') {
			const pieData = chartData.datasets[0].data.map((value, index) => ({
				value,
				name: chartData.labels[index],
				itemStyle: {
					color: chartData.datasets[0].backgroundColor[index],
				},
			}));

			return {
				tooltip: {
					trigger: 'item',
					backgroundColor: 'rgba(255, 255, 255, 0.95)',
					borderColor: '#E2E8F0',
					borderWidth: 1,
					textStyle: {
						color: '#1F2937',
						fontSize: 12,
						fontFamily: 'Inter',
					},
				},
				legend: {
					orient: 'horizontal',
					bottom: 0,
					textStyle: {
						color: '#6B7280',
						fontSize: 11,
						fontFamily: 'Inter',
					},
					itemGap: 15,
				},
				series: [
					{
						type: 'pie',
						radius: ['40%', '70%'],
						center: ['50%', '45%'],
						data: pieData,
						emphasis: {
							itemStyle: {
								shadowBlur: 10,
								shadowOffsetX: 0,
								shadowColor: 'rgba(0, 0, 0, 0.5)',
							},
						},
						label: {
							show: false,
						},
						labelLine: {
							show: false,
						},
					},
				],
			};
		}

		// Bar, Line, or Area chart configuration
		const allValues = chartData.datasets.flatMap((d) => d.data);
		const maxValue = Math.max(...allValues, 60);
		const calculatedYAxisMax =
			yAxisMax ||
			Math.max(60, Math.ceil(maxValue / yAxisInterval) * yAxisInterval);

		const isAreaChart = type === 'area';
		const isLineChart = type === 'line';
		const isBarChart = type === 'bar';

		return {
			grid: {
				left: '60px',
				right: '25px',
				top: '15px',
				bottom: '50px',
				containLabel: false,
			},
			xAxis: {
				type: 'category',
				data: chartData.labels,
				boundaryGap: type === 'bar' ? true : false,
				axisLine: {
					show: true,
				},
				axisTick: {
					show: true,
				},
				axisLabel: {
					color: '#6B7280',
					fontSize: 10,
					fontFamily: 'Inter',
					fontWeight: 400,
					margin: 10,
				},
			},
			yAxis: {
				type: 'value',
				min: 0,
				max: calculatedYAxisMax,
				interval: yAxisInterval,
				axisLine: {
					show: true,
				},
				axisTick: {
					show: true,
				},
				axisLabel: {
					color: '#6B7280',
					fontSize: 10,
					fontFamily: 'Inter',
					fontWeight: 400,
					margin: 15,
				},
				splitLine: {
					show: true,
					lineStyle: {
						color: '#E5E7EB',
						type: 'dashed',
						width: 1,
					},
				},
				name: yAxisName,
				nameLocation: 'middle',
				nameGap: 50,
				nameRotate: 90,
				nameTextStyle: {
					color: '#1F2937',
					fontSize: 13,
					fontFamily: 'Inter',
					fontWeight: 500,
				},
			},
			series: chartData.datasets.map((dataset, index) => {
				const baseSeries = {
					name: dataset.label,
					type: isBarChart ? 'bar' : 'line',
					data: dataset.data,
				};

				if (isBarChart) {
					return {
						...baseSeries,
						itemStyle: {
							color: dataset.backgroundColor || dataset.borderColor,
							borderRadius: [6, 6, 0, 0],
						},
						barWidth: '20%',
						barGap: '10%',
					};
				}

				if (isAreaChart) {
					return {
						...baseSeries,
						areaStyle: areaStyle || {
							color:
								dataset.backgroundColor ||
								dataset.borderColor ||
								'#6A12CD',
							opacity: 0.3,
						},
						lineStyle: {
							color:
								dataset.borderColor ||
								dataset.backgroundColor ||
								'#6A12CD',
							width: 2,
							cap: 'round',
						},
						symbol: 'none',
						smooth: false,
					};
				}

				// Line chart
				return {
					...baseSeries,
					smooth: false,
					symbol: 'none',
					lineStyle: {
						color: dataset.borderColor || dataset.backgroundColor,
						width: 2,
						cap: 'round',
					},
				};
			}),
			tooltip: {
				trigger: 'axis',
				backgroundColor: 'rgba(255, 255, 255, 0.95)',
				borderColor: '#E2E8F0',
				borderWidth: 1,
				textStyle: {
					color: '#1F2937',
					fontSize: 12,
					fontFamily: 'Inter',
				},
				axisPointer: {
					type: 'line',
					lineStyle: {
						color: '#6B7280',
						width: 1,
						type: 'dashed',
					},
				},
			},
			legend: {
				show: true,
				bottom: 0,
				orient: 'horizontal',
				textStyle: {
					color: '#6B7280',
					fontSize: 11,
					fontFamily: 'Inter',
				},
				itemGap: 15,
				icon: 'circle',
			},
		};
	}, [chartData, type, yAxisName, yAxisInterval, yAxisMax]);

	return (
		<div style={{ height, width: '100%' }}>
			<ReactECharts
				option={echartsOption}
				style={{ height: '100%', width: '100%' }}
				opts={{ renderer: 'svg' }}
			/>
		</div>
	);
};

export default ChartWidget;
