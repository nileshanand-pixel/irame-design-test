/**
 * Mock data for Dashboard Detail Page
 * Matches the Figma design specifications
 */

export const metricCardsData = [
	{
		label: 'Total users',
		value: '35,981',
	},
	{
		label: 'Total sales revenue',
		value: '$119,427',
	},
	{
		label: 'Total users',
		value: '35,981',
	},
	{
		label: 'Gross revenue',
		value: '$92,810',
	},
];

// Multi-line Chart Data (Time-Series Analysis)
export const multiLineChartData = {
	chartData: {
		labels: ['Oct 27', 'Nov 3', 'Nov 10', 'Nov 17', 'Nov 24'],
		datasets: [
			{
				label: 'Procurement',
				data: [8, 12, 10, 14, 11],
				borderColor: '#6A12CD',
				backgroundColor: '#6A12CD',
			},
			{
				label: 'Finance',
				data: [15, 25, 20, 18, 16],
				borderColor: '#F97316',
				backgroundColor: '#F97316',
			},
			{
				label: 'Operations',
				data: [10, 15, 18, 22, 20],
				borderColor: '#3B82F6',
				backgroundColor: '#3B82F6',
			},
			{
				label: 'IT',
				data: [5, 8, 7, 9, 8],
				borderColor: '#FBBF24',
				backgroundColor: '#FBBF24',
			},
			{
				label: 'HR',
				data: [3, 5, 4, 6, 5],
				borderColor: '#10B981',
				backgroundColor: '#10B981',
			},
		],
	},
	options: {
		height: '300px',
		type: 'line',
		yAxisName: 'Number of Duplicates',
		xAxisName: 'Time Period',
		yAxisMax: 60,
		yAxisInterval: 10,
	},
};

// Area Chart Data (Amount Trend)
export const areaChartData = {
	chartData: {
		labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
		datasets: [
			{
				label: 'Amount',
				data: [40000, 60000, 80000, 100000, 120000],
				borderColor: '#6A12CD',
				backgroundColor: '#6A12CD',
			},
		],
	},
	options: {
		height: '300px',
		type: 'area',
		yAxisName: 'Amount (₹)',
		xAxisName: 'Time Period',
		yAxisMax: 160000,
		yAxisInterval: 40000,
		areaStyle: {
			color: '#6A12CD',
			opacity: 0.3,
		},
	},
};

// Bar Chart Data (Clustered Bar Chart - Monthly Comparison)
export const barChartData = {
	chartData: {
		labels: [
			'Jan',
			'Feb',
			'Mar',
			'Apr',
			'May',
			'Jun',
			'Jul',
			'Aug',
			'Sep',
			'Oct',
			'Nov',
			'Dec',
		],
		datasets: [
			{
				label: 'Pending',
				data: [5, 8, 3, 6, 4, 7, 5, 9, 6, 8, 4, 7],
				borderColor: '#F97316',
				backgroundColor: '#F97316',
			},
			{
				label: 'Resolved',
				data: [45, 52, 48, 55, 50, 58, 52, 60, 55, 58, 50, 55],
				borderColor: '#10B981',
				backgroundColor: '#10B981',
			},
			{
				label: 'Total Duplicates',
				data: [50, 60, 51, 61, 54, 65, 57, 69, 61, 66, 54, 62],
				borderColor: '#3B82F6',
				backgroundColor: '#3B82F6',
			},
		],
	},
	options: {
		height: '300px',
		yAxisName: 'Number of Duplicates',
		xAxisName: 'Months',
		yAxisMax: 80,
		yAxisInterval: 20,
		type: 'bar',
	},
};

// Pie Chart Data
export const pieChartData = {
	chartData: {
		labels: [
			'Amount Mismatch',
			'Duplicate Numbers',
			'Vendor Duplicates',
			'Date Conflicts',
			'Other',
		],
		datasets: [
			{
				label: 'Distribution',
				data: [35, 25, 20, 15, 5],
				backgroundColor: [
					'#3B82F6', // Blue
					'#10B981', // Green
					'#F97316', // Orange
					'#EF4444', // Red
					'#6A12CD', // Purple
				],
				borderColor: ['#3B82F6', '#10B981', '#F97316', '#EF4444', '#6A12CD'],
			},
		],
	},
	options: {
		height: '300px',
		type: 'pie',
	},
};

// Widgets Configuration - Dynamic array for rendering
export const chartWidgets = [
	{
		id: 'multi-line-chart',
		title: 'Invoice Processing & Duplicate Detection',
		subtitle: 'Real-time analytics and insights',
		icon: 'insights',
		type: 'chart',
		colSpan: 1,
		chartData: multiLineChartData.chartData,
		options: multiLineChartData.options,
	},
	{
		id: 'area-chart',
		title: 'Invoice Processing & Duplicate Detection',
		subtitle: 'Real-time analytics and insights',
		icon: 'insights',
		type: 'chart',
		colSpan: 1,
		chartData: areaChartData.chartData,
		options: areaChartData.options,
	},
	{
		id: 'bar-chart',
		title: 'Invoice Processing & Duplicate Detection',
		subtitle: 'Real-time analytics and insights',
		icon: 'insights',
		type: 'chart',
		colSpan: 1,
		chartData: barChartData.chartData,
		options: barChartData.options,
	},
	{
		id: 'pie-chart',
		title: 'Invoice Processing & Duplicate Detection',
		subtitle: 'Real-time analytics and insights',
		icon: 'insights',
		type: 'chart',
		colSpan: 1,
		chartData: pieChartData.chartData,
		options: pieChartData.options,
	},
];

// Table Data
export const tableData = {
	columns: ['INVOICE ID', 'PO NUMBER', 'DATE', 'VENDOR', 'CATEGORY', 'VALUE'],
	rows: [
		{
			id: 'row-1',
			invoiceId: 'STG-001',
			poNumber: 'Awareness',
			date: '5,240',
			vendor: '100%',
			category: '100%',
			value: '$2,620,000',
		},
		{
			id: 'row-2',
			invoiceId: 'STG-002',
			poNumber: 'Retention',
			date: '8,430',
			vendor: '0%',
			category: '0%',
			value: '$3,145,000',
		},
		{
			id: 'row-3',
			invoiceId: 'STG-003',
			poNumber: 'Consideration',
			date: '3,750',
			vendor: '10%',
			category: '10%',
			value: '$4,300,000',
		},
		{
			id: 'row-4',
			invoiceId: 'STG-004',
			poNumber: 'Action',
			date: '4,110',
			vendor: '25%',
			category: '25%',
			value: '$2,750,000',
		},
		{
			id: 'row-5',
			invoiceId: 'STG-006',
			poNumber: 'Decision',
			date: '1,620',
			vendor: '75%',
			category: '75%',
			value: '$1,890,000',
		},
		{
			id: 'row-6',
			invoiceId: 'STG-005',
			poNumber: 'Advocacy',
			date: '6,890',
			vendor: '50%',
			category: '50%',
			value: '$5,950,000',
		},
		{
			id: 'row-7',
			invoiceId: 'STG-007',
			poNumber: 'Innovation',
			date: '7,245',
			vendor: '60%',
			category: '60%',
			value: '$6,250,000',
		},
		{
			id: 'row-8',
			invoiceId: 'STG-008',
			poNumber: 'Sustainability',
			date: '6,532',
			vendor: '40%',
			category: '40%',
			value: '$6,500,000',
		},
	],
};
